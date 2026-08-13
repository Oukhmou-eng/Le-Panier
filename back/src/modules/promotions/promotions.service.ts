import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { CreatePlanTarifDto } from './dto/create-plan-tarif.dto';
import { UpdatePlanTarifDto } from './dto/update-plan-tarif.dto';
import { DatabaseService } from '../../database/database.service';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

@Injectable()
export class PromotionsService {
  constructor(private readonly db: DatabaseService) {}

  async findPlans() {
    return this.db.query(
      `SELECT id, nom_plan, type_cible, duree_jours, prix, priorite, statut
       FROM plans_tarifs
       WHERE type_cible = 'produit' AND statut = 'actif'
       ORDER BY priorite DESC, prix ASC`,
    );
  }

  async adminFindPlans() {
    return this.db.query(
      `SELECT id, nom_plan, type_cible, duree_jours, prix, priorite, statut, modifie_par, date_creation, date_maj
       FROM plans_tarifs
       ORDER BY priorite DESC, prix ASC`,
    );
  }

  async adminFindFactures() {
    return this.db.query(
      `SELECT
         fb.id,
         fb.boutique_id,
         b.nom AS boutique_nom,
         b.slug AS boutique_slug,
         fb.type_facture,
         fb.reference_id,
         fb.moyen_paiement_id,
         mp.fournisseur AS paiement_fournisseur,
         fb.montant,
         fb.statut,
         fb.reference_transaction,
         fb.date_facture,
         fb.date_paiement
       FROM factures_boutique fb
       LEFT JOIN boutiques b ON b.id_boutique = fb.boutique_id
       LEFT JOIN moyens_paiement mp ON mp.id_moyen_paiement = fb.moyen_paiement_id
       ORDER BY fb.date_facture DESC`,
    );
  }

  async findPlanById(id: number) {
    const rows = await this.db.query<RowDataPacket[]>(`SELECT * FROM plans_tarifs WHERE id = ? LIMIT 1`, [id]);
    return rows?.[0] ?? null;
  }

  async createPlan(dto: CreatePlanTarifDto, adminId: number) {
    const result: any = await this.db.query(
      `INSERT INTO plans_tarifs
       (nom_plan, type_cible, duree_jours, prix, priorite, statut, modifie_par, date_creation, date_maj)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [dto.nom_plan, dto.type_cible, dto.duree_jours, dto.prix, dto.priorite, dto.statut, adminId],
    );

    return {
      id: result?.insertId ?? null,
      nom_plan: dto.nom_plan,
      type_cible: dto.type_cible,
      duree_jours: dto.duree_jours,
      prix: dto.prix,
      priorite: dto.priorite,
      statut: dto.statut,
      modefie_par: adminId,
      date_creation: new Date().toISOString(),
      date_maj: new Date().toISOString(),
    };
  }

  async updatePlan(id: number, dto: UpdatePlanTarifDto, adminId: number) {
    const updates: string[] = [];
    const params: any[] = [];

    if (dto.nom_plan !== undefined) {
      updates.push('nom_plan = ?');
      params.push(dto.nom_plan);
    }
    if (dto.type_cible !== undefined) {
      updates.push('type_cible = ?');
      params.push(dto.type_cible);
    }
    if (dto.duree_jours !== undefined) {
      updates.push('duree_jours = ?');
      params.push(dto.duree_jours);
    }
    if (dto.prix !== undefined) {
      updates.push('prix = ?');
      params.push(dto.prix);
    }
    if (dto.priorite !== undefined) {
      updates.push('priorite = ?');
      params.push(dto.priorite);
    }
    if (dto.statut !== undefined) {
      updates.push('statut = ?');
      params.push(dto.statut);
    }

    if (updates.length === 0) {
      return { id, ...dto };
    }

    updates.push('modifie_par = ?');
    params.push(adminId);
    updates.push('date_maj = NOW()');
    params.push(id);

    await this.db.query(`UPDATE plans_tarifs SET ${updates.join(', ')} WHERE id = ?`, params);
    return { id, ...dto, modifie_par: adminId };
  }

  async updatePlanStatut(id: number, statut: string, adminId: number) {
    const normalizedStatut = statut === 'inactif' ? 'inactif' : 'actif';
    await this.db.query(
      `UPDATE plans_tarifs
       SET statut = ?, modifie_par = ?, date_maj = NOW()
       WHERE id = ?`,
      [normalizedStatut, adminId, id],
    );
    return { id, statut: normalizedStatut, modifie_par: adminId };
  }

  async create(dto: CreatePromotionDto, idUser: number) {
    const connection = await this.db.getPool().getConnection();
    try {
      await connection.beginTransaction();

      const [planRows] = await connection.query<RowDataPacket[]>(
        `SELECT * FROM plans_tarifs WHERE id = ? LIMIT 1`,
        [dto.plan_tarif_id],
      );
      const plan = planRows?.[0] ?? null;
      if (!plan) {
        throw new NotFoundException('Plan tarifaire introuvable.');
      }

      const [produitRows] = await connection.query<RowDataPacket[]>(
        `SELECT p.*, b.id_user AS owner_user_id
         FROM produits p
         INNER JOIN boutiques b ON b.id_boutique = p.id_boutique
         WHERE p.id_produit = ? LIMIT 1`,
        [dto.id_produit],
      );
      const produit = produitRows?.[0] ?? null;
      if (!produit) {
        throw new NotFoundException('Produit introuvable.');
      }

      const boutiqueId = produit.id_boutique;
      const utilisateurId = produit.owner_user_id ?? null;
      if (!utilisateurId) {
        throw new BadRequestException('Impossible de déterminer le propriétaire de la boutique pour le paiement.');
      }
      if (utilisateurId !== idUser) {
        throw new BadRequestException('Vous ne pouvez pas promouvoir un produit qui n\'appartient pas à votre boutique.');
      }

      const factureMontant = Number(plan.prix);

      const now = new Date();
      const dateDebut = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const endDate = new Date(now.getTime() + Number(plan.duree_jours ?? 0) * 24 * 60 * 60 * 1000);
      const dateFin = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:${String(endDate.getSeconds()).padStart(2, '0')}`;

      let moyenPaiementId = dto.moyen_paiement_id ?? null;
      if (!moyenPaiementId) {
        const jeton = `tok_${randomUUID()}`;
        const last4 = dto.card_number ? String(dto.card_number).slice(-4) : null;
        let dateExp: string | null = null;
        if (dto.card_expiration) {
          const parts = dto.card_expiration.split('/').map((p) => p.trim());
          if (parts.length === 2) {
            const mm = parts[0].padStart(2, '0');
            let yy = parts[1];
            if (yy.length === 2) yy = `20${yy}`;
            dateExp = `${yy}-${mm}-01`;
          }
        }

        const [moyenResult] = await connection.execute<ResultSetHeader>(
          `INSERT INTO moyens_paiement (id_user, fournisseur, type, jeton_paiement, derniers_chiffres, date_expiration, est_defaut, date_creation)
           VALUES (?, ?, 'carte', ?, ?, ?, 0, NOW())`,
          [utilisateurId, 'simulated', jeton, last4, dateExp],
        );
        moyenPaiementId = (moyenResult as ResultSetHeader).insertId;
      }

      const txRef = dto.reference_transaction ?? `tx_${randomUUID()}`;

      // create facture marked as paid
      const [factureResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO factures_boutique
         (boutique_id, type_facture, reference_id, moyen_paiement_id, montant, statut, reference_transaction, date_facture, date_paiement)
         VALUES (?, ?, ?, ?, ?, 'paye', ?, NOW(), NOW())`,
        [
          boutiqueId,
          dto.type_facture ?? 'promotion',
          dto.reference_id ?? dto.id_produit,
          moyenPaiementId,
          factureMontant,
          txRef,
        ],
      );

      // create promotion and activate it immediately
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO promouvoir (id_produit, plan, plan_tarif_id, priorite, date_debut, date_fin, statut)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [
          dto.id_produit,
          plan.nom_plan,
          dto.plan_tarif_id,
          dto.priorite ?? Number(plan.priorite ?? 0),
          dateDebut,
          dateFin,
        ],
      );

      await connection.commit();
      return {
        id_promotion: result.insertId,
        id_facture: factureResult.insertId,
        statut: 'active',
        date_debut: dateDebut,
        date_fin: dateFin,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findAll() {
    return this.db.query(`SELECT * FROM promouvoir ORDER BY date_creation DESC`);
  }

  async findActive() {
    return this.db.query(
      `SELECT pr.*, p.nom AS produit_nom, pt.nom_plan, pt.prix AS plan_prix
       FROM promouvoir pr
       INNER JOIN produits p ON p.id_produit = pr.id_produit
       LEFT JOIN plans_tarifs pt ON pt.id = pr.plan_tarif_id
       WHERE pr.statut = 'active' AND pr.date_debut <= NOW() AND pr.date_fin >= NOW()
       ORDER BY pr.priorite DESC, pr.date_fin ASC`,
    );
  }

  async findOne(id: number) {
    const rows = await this.db.query(`SELECT * FROM promouvoir WHERE id_promotion = ? LIMIT 1`, [id]);
    return rows?.[0] ?? null;
  }

  async update(id: number, dto: Partial<CreatePromotionDto>) {
    const updates: string[] = [];
    const params: any[] = [];
    if (dto.plan_tarif_id !== undefined) {
      updates.push('plan_tarif_id = ?');
      params.push(dto.plan_tarif_id);
    }
    if (dto.priorite !== undefined) {
      updates.push('priorite = ?');
      params.push(dto.priorite);
    }
    if (dto.date_debut !== undefined) {
      updates.push('date_debut = ?');
      params.push(dto.date_debut);
    }
    if (dto.date_fin !== undefined) {
      updates.push('date_fin = ?');
      params.push(dto.date_fin);
    }
    if (updates.length === 0) return { id, ...dto };
    params.push(id);
    await this.db.query(`UPDATE promouvoir SET ${updates.join(', ')} WHERE id_promotion = ?`, params);
    return { id, ...dto };
  }

  async remove(id: number) {
    await this.db.query(`DELETE FROM promouvoir WHERE id_promotion = ?`, [id]);
    return { id };
  }
}
