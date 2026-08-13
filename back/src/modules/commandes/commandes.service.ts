import { Injectable, ForbiddenException, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CarteSimuleeDto, CreateCommandeDto } from './dto/create-commande.dto';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class CommandesService {
  constructor(private readonly db: DatabaseService) {}

  async create(userId: number, dto: CreateCommandeDto) {
    // dto can contain: id_adresse OR adresse object, paiement (simulated card info)
    const connection = await this.db.getPool().getConnection();
    try {
      await connection.beginTransaction();

      // load cart items for user
      const [itemsRows]: any = await connection.query(
        `SELECT pi.id_panier_item, pi.id_produit, pi.quantite,
                COALESCE((
                  SELECT s.prix_promo FROM soldes s
                  WHERE s.id_produit = p.id_produit AND s.prix_promo < p.prix AND s.statut = 'active'
                    AND s.date_debut <= NOW() AND s.date_fin >= NOW()
                  ORDER BY s.id_solde DESC LIMIT 1
                ), p.prix) AS prix_unitaire,
                p.stock, p.id_boutique, p.statut
         FROM panier_items pi
         JOIN produits p ON p.id_produit = pi.id_produit
         WHERE pi.id_user = ? AND pi.est_enregistre = 0 FOR UPDATE`,
        [userId],
      );

      if (!itemsRows || itemsRows.length === 0) {
        throw new BadRequestException('Panier vide');
      }

      for (const item of itemsRows) {
        const stock = Number(item.stock ?? 0);
        const quantite = Number(item.quantite);
        if (!Number.isInteger(quantite) || quantite < 1) {
          throw new BadRequestException(`Quantité invalide pour le produit ${item.id_produit}`);
        }
        if (item.statut !== 'en_ligne' || quantite > stock) {
          throw new BadRequestException(`Stock insuffisant ou produit indisponible : ${item.id_produit}`);
        }
      }

      // handle adresse
      let adresseId = dto.id_adresse ?? null;
      if (adresseId) {
        const [addresses]: any = await connection.query(
          'SELECT id_adresse FROM adresses WHERE id_adresse = ? AND id_user = ? FOR UPDATE',
          [adresseId, userId],
        );
        if (!addresses.length) throw new BadRequestException('Adresse de livraison introuvable');
      } else if (dto.adresse) {
        const addr = dto.adresse;
        const [res]: any = await connection.query(
          `INSERT INTO adresses (id_user, libelle, ligne1, ville, code_postal, tele, est_defaut) VALUES (?, ?, ?, ?, ?, ?, 0)`,
          [userId, addr.libelle?.trim() || null, addr.ligne1.trim(), addr.ville.trim(), addr.code_postal.trim(), addr.tele.trim()],
        );
        adresseId = res.insertId;
      }
      if (!adresseId) {
        throw new BadRequestException('Adresse de livraison requise');
      }

      let sousTotal = 0;
      for (const item of itemsRows) {
        const prix = Number(item.prix_unitaire ?? 0);
        sousTotal += prix * Number(item.quantite);
      }
      // Doit rester aligné avec la règle affichée par le panier côté client.
      const fraisLivraison = sousTotal >= 700 ? 0 : 25;
      const montantTotal = sousTotal + fraisLivraison;
      const paiementMoyenId = await this.createSimulatedPaymentMethod(connection, userId, dto.paiement);

      // create commande
      const [commandeRes]: any = await connection.query(
        `INSERT INTO commandes (id_user, id_adresse, montant_total) VALUES (?, ?, ?)`,
        [userId, adresseId, montantTotal],
      );
      const commandeId = commandeRes.insertId;

      // create commande_lignes and decrement stock
      for (const item of itemsRows) {
        const sousTotal = Number(item.prix_unitaire) * Number(item.quantite);
        const [stockResult]: any = await connection.query(
          `UPDATE produits SET stock = stock - ?
           WHERE id_produit = ? AND statut = 'en_ligne' AND stock >= ?`,
          [item.quantite, item.id_produit, item.quantite],
        );
        if (!stockResult.affectedRows) {
          throw new BadRequestException(`Stock insuffisant pour le produit ${item.id_produit}`);
        }
        await connection.query(
          `INSERT INTO commande_lignes (id_commande, id_produit, id_boutique, quantite, prix_unitaire, sous_total)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [commandeId, item.id_produit, item.id_boutique, item.quantite, item.prix_unitaire, sousTotal],
        );
      }

      // simulate payment
      const reference = `SIMU-${randomUUID()}`;
      await connection.query(
        `INSERT INTO paiements (id_commande, id_moyen_paiement, montant, methode, fournisseur, statut, reference_transaction)
         VALUES (?, ?, ?, ?, ?, 'valide', ?)`,
        [commandeId, paiementMoyenId, montantTotal, dto.paiement.methode, dto.paiement.fournisseur ?? (dto.paiement.methode === 'carte' ? 'simulation' : 'livraison'), reference],
      );

      // remove panier items
      await connection.query(`DELETE FROM panier_items WHERE id_user = ? AND est_enregistre = 0`, [userId]);

      await connection.commit();

      return {
        success: true,
        id_commande: commandeId,
        reference_transaction: reference,
        sous_total: sousTotal,
        frais_livraison: fraisLivraison,
        montant_total: montantTotal,
      };
    } catch (err) {
      await connection.rollback();
      if (err && err.message) throw err;
      throw new InternalServerErrorException('Erreur lors de la création de la commande');
    } finally {
      connection.release();
    }
  }

  private async createSimulatedPaymentMethod(connection: any, userId: number, paiement: CreateCommandeDto['paiement']) {
    if (paiement.methode === 'cod') return null;

    const carte = paiement.carte as CarteSimuleeDto;
    const numero = carte.numero.replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(numero) || !this.isValidCardNumber(numero)) {
      throw new BadRequestException('Numéro de carte bancaire invalide');
    }

    const [month, year] = carte.expiration.split('/').map(Number);
    const expiration = new Date(2000 + year, month, 0);
    if (expiration < new Date(new Date().getFullYear(), new Date().getMonth(), 1)) {
      throw new BadRequestException('Carte bancaire expirée');
    }

    const token = `sim_${randomUUID()}`;
    const expirationSql = `${expiration.getFullYear()}-${String(expiration.getMonth() + 1).padStart(2, '0')}-01`;
    const [result]: any = await connection.query(
      `INSERT INTO moyens_paiement (id_user, fournisseur, type, jeton_paiement, derniers_chiffres, date_expiration)
       VALUES (?, ?, 'carte', ?, ?, ?)`,
      [userId, paiement.fournisseur ?? 'simulation', token, numero.slice(-4), expirationSql],
    );
    return result.insertId;
  }

  private isValidCardNumber(numero: string) {
    let sum = 0;
    let shouldDouble = false;
    for (let index = numero.length - 1; index >= 0; index -= 1) {
      let digit = Number(numero[index]);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  async getStatistics(
    user: { id_user: number; id_boutique?: number },
    periode = 7,
  ) {
    const boutiqueId = await this.resolveBoutiqueId(user);
    if (!boutiqueId) {
      throw new ForbiddenException('Aucune boutique associée à cet utilisateur.');
    }

    const currentEnd = new Date();
    currentEnd.setHours(23, 59, 59, 999);

    const currentStart = new Date(currentEnd);
    currentStart.setHours(0, 0, 0, 0);
    currentStart.setDate(currentStart.getDate() - periode + 1);

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - periode);
    previousStart.setHours(0, 0, 0, 0);

    const previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(-1);

    const currentStartSql = this.formatDateForMySQL(currentStart);
    const currentEndSql = this.formatDateForMySQL(currentEnd);
    const previousStartSql = this.formatDateForMySQL(previousStart);
    const previousEndSql = this.formatDateForMySQL(previousEnd);

    const summaryRows = await this.db.query<any[]>(
      `SELECT
        IFNULL(SUM(cl.sous_total), 0) AS ventes_totales,
        IFNULL(COUNT(DISTINCT c.id_commande), 0) AS commandes_totales,
        IFNULL(SUM(cl.quantite), 0) AS articles_vendus
      FROM commande_lignes cl
      JOIN commandes c ON c.id_commande = cl.id_commande
      WHERE cl.id_boutique = ?
        AND c.statut IN ('confirmee','expediee','livree')
        AND c.date_commande BETWEEN ? AND ?`,
      [boutiqueId, currentStartSql, currentEndSql],
    );

    const previousRows = await this.db.query<any[]>(
      `SELECT
        IFNULL(SUM(cl.sous_total), 0) AS ventes_totales
      FROM commande_lignes cl
      JOIN commandes c ON c.id_commande = cl.id_commande
      WHERE cl.id_boutique = ?
        AND c.statut IN ('confirmee','expediee','livree')
        AND c.date_commande BETWEEN ? AND ?`,
      [boutiqueId, previousStartSql, previousEndSql],
    );

    const ventesTotales = Number(summaryRows?.[0]?.ventes_totales ?? 0);
    const previousVentesTotales = Number(previousRows?.[0]?.ventes_totales ?? 0);
    const deltaVentes = previousVentesTotales > 0
      ? Math.round(((ventesTotales - previousVentesTotales) / previousVentesTotales) * 100)
      : ventesTotales > 0
      ? 100
      : 0;

    const ventesParJourRows = await this.db.query<any[]>(
      `SELECT
        DATE(c.date_commande) AS date_commande,
        IFNULL(SUM(cl.sous_total), 0) AS ventes
      FROM commande_lignes cl
      JOIN commandes c ON c.id_commande = cl.id_commande
      WHERE cl.id_boutique = ?
        AND c.statut IN ('confirmee','expediee','livree')
        AND c.date_commande BETWEEN ? AND ?
      GROUP BY DATE(c.date_commande)
      ORDER BY DATE(c.date_commande) ASC`,
      [boutiqueId, currentStartSql, currentEndSql],
    );

    const formatDateKey = (date: Date) => {
      const pad = (value: number) => String(value).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };

    const ventesParJourMap = new Map<string, number>();
    for (const row of ventesParJourRows) {
      const rawDate = row.date_commande;
      const date = rawDate ? new Date(rawDate) : null;
      if (date && !Number.isNaN(date.getTime())) {
        ventesParJourMap.set(formatDateKey(date), Number(row.ventes ?? 0));
      }
    }

    const jourFormatter = (date: Date) => {
      if (periode <= 7) {
        return date.toLocaleDateString('fr-FR', { weekday: 'short' });
      }
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    };

    const ventesParJour = Array.from({ length: periode }, (_, index) => {
      const date = new Date(currentStart);
      date.setDate(currentStart.getDate() + index);
      return {
        jour: jourFormatter(date),
        ventes: ventesParJourMap.get(formatDateKey(date)) ?? 0,
      };
    });

    const topProduits = await this.db.query<any[]>(
      `SELECT
        p.nom AS produit,
        COUNT(cl.id_commande_ligne) AS ventes,
        IFNULL(SUM(cl.sous_total), 0) AS revenus
      FROM commande_lignes cl
      JOIN commandes c ON c.id_commande = cl.id_commande
      JOIN produits p ON p.id_produit = cl.id_produit
      WHERE cl.id_boutique = ?
        AND c.statut IN ('confirmee','expediee','livree')
        AND c.date_commande BETWEEN ? AND ?
      GROUP BY p.id_produit, p.nom
      ORDER BY revenus DESC
      LIMIT 10`,
      [boutiqueId, currentStartSql, currentEndSql],
    );

    return {
      resume: {
        ventesTotales,
        deltaVentes,
        commandesTotales: Number(summaryRows?.[0]?.commandes_totales ?? 0),
        articlesVendus: Number(summaryRows?.[0]?.articles_vendus ?? 0),
      },
      ventesParJour: ventesParJour.map((row) => ({
        jour: row.jour,
        ventes: Number(row.ventes ?? 0),
      })),
      topProduits: topProduits.map((row) => ({
        produit: row.produit,
        ventes: Number(row.ventes ?? 0),
        revenus: Number(row.revenus ?? 0),
      })),
    };
  }

  private async resolveBoutiqueId(user: { id_user: number; id_boutique?: number }) {
    if (user?.id_boutique) {
      return Number(user.id_boutique);
    }

    const rows = await this.db.query<any[]>(
      'SELECT id_boutique FROM boutiques WHERE id_user = ? LIMIT 1',
      [user.id_user],
    );

    return rows?.[0]?.id_boutique ? Number(rows[0].id_boutique) : null;
  }

  private formatDateForMySQL(date: Date) {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  async findByUser(userId: number) {
    const commandes = await this.db.query(
      `SELECT
        c.id_commande,
        c.statut,
        c.montant_total,
        c.date_commande,
        MIN(p.nom) AS produit_nom,
        MIN(p.id_produit) AS id_produit,
        MIN(b.nom) AS boutique_nom,
        MIN(pm.url) AS image_url
      FROM commandes c
      LEFT JOIN commande_lignes cl ON cl.id_commande = c.id_commande
      LEFT JOIN produits p ON p.id_produit = cl.id_produit
      LEFT JOIN boutiques b ON b.id_boutique = cl.id_boutique
      LEFT JOIN produit_medias pm ON pm.id_media = (
        SELECT pm2.id_media
        FROM produit_medias pm2
        WHERE pm2.id_produit = p.id_produit
        ORDER BY pm2.ordre ASC, pm2.id_media ASC
        LIMIT 1
      )
      WHERE c.id_user = ?
      GROUP BY c.id_commande, c.statut, c.montant_total, c.date_commande
      ORDER BY c.date_commande DESC, c.id_commande DESC`,
      [userId],
    );

    return { commandes: commandes ?? [] };
  }

  async findByBoutique(boutiqueId: number, currentUserId?: number) {
    if (!boutiqueId) {
      return { commandes: [] };
    }

    const boutiqueRows = await this.db.query<any[]>(
      'SELECT id_user FROM boutiques WHERE id_boutique = ? LIMIT 1',
      [boutiqueId],
    );
    const boutiqueOwnerId = boutiqueRows?.[0]?.id_user;

    if (currentUserId && boutiqueOwnerId && currentUserId !== boutiqueOwnerId) {
      throw new ForbiddenException('Accès interdit à cette boutique.');
    }

    const commandes = await this.db.query(
      `SELECT
        c.id_commande,
        c.statut,
        c.montant_total,
        c.date_commande,
        MIN(p.nom) AS produit_nom,
        MIN(p.id_produit) AS id_produit,
        MIN(u.nom) AS client_nom,
        MIN(u.prenom) AS client_prenom,
        MIN(b.nom) AS boutique_nom
      FROM commandes c
      LEFT JOIN commande_lignes cl ON cl.id_commande = c.id_commande
      LEFT JOIN produits p ON p.id_produit = cl.id_produit
      LEFT JOIN boutiques b ON b.id_boutique = cl.id_boutique
      LEFT JOIN utilisateurs u ON u.id_user = c.id_user
      WHERE cl.id_boutique = ? OR b.id_boutique = ?
      GROUP BY c.id_commande, c.statut, c.montant_total, c.date_commande
      ORDER BY c.date_commande DESC, c.id_commande DESC`,
      [boutiqueId, boutiqueId],
    );

    return { commandes: commandes ?? [] };
  }

  findAll() {
    // TODO: this.prisma.commandes.findMany()
    return [];
  }

  findOne(id: number) {
    // TODO: this.prisma.commandes.findUnique({ where: { id } })
    return { id };
  }

  async updateStatusForBoutique(id: number, userId: number, statut?: string) {
    const allowedStatuses = ['en_attente', 'confirmee', 'expediee', 'livree', 'annulee', 'remboursee'];
    if (!statut || !allowedStatuses.includes(statut)) {
      throw new BadRequestException('Statut invalide.');
    }

    const ownedOrder = await this.db.query<any[]>(
      `SELECT c.id_commande
       FROM commandes c
       INNER JOIN commande_lignes cl ON cl.id_commande = c.id_commande
       INNER JOIN boutiques b ON b.id_boutique = cl.id_boutique
       WHERE c.id_commande = ? AND b.id_user = ?
       LIMIT 1`,
      [id, userId],
    );
    if (!ownedOrder.length) {
      throw new NotFoundException('Commande introuvable pour votre boutique.');
    }

    await this.db.query('UPDATE commandes SET statut = ? WHERE id_commande = ?', [statut, id]);
    return { id_commande: id, statut };
  }

  remove(id: number) {
    // TODO: this.prisma.commandes.delete({ where: { id } })
    return { id };
  }
}
