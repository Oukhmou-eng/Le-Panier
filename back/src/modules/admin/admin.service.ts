import { Injectable } from '@nestjs/common';
import { CreateSignalementDto } from './dto/create-signalement.dto';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AdminService {
  constructor(private readonly db: DatabaseService) {}

  create(dto: CreateSignalementDto) {
    // TODO: this.prisma.admin.create({ data: dto })
    return dto;
  }

  findAll() {
    // TODO: this.prisma.admin.findMany()
    return [];
  }

  async findAllSignalements() {
    return this.db.query(
      `SELECT
         s.id_signalement,
         s.id_user,
         s.type_cible,
         s.id_cible,
         s.motif,
         s.description,
         s.statut,
         s.id_admin,
         s.date_creation,
         s.date_traitement,
         u.prenom AS signalant_prenom,
         u.nom AS signalant_nom,
         u.email AS signalant_email,
         bt.nom AS boutique_nom,
         p.nom AS produit_nom,
         tu.prenom AS cible_utilisateur_prenom,
         tu.nom AS cible_utilisateur_nom
       FROM signalements s
       LEFT JOIN utilisateurs u ON u.id_user = s.id_user
       LEFT JOIN boutiques bt ON s.type_cible = 'boutique' AND bt.id_boutique = s.id_cible
       LEFT JOIN produits p ON s.type_cible = 'produit' AND p.id_produit = s.id_cible
       LEFT JOIN utilisateurs tu ON s.type_cible = 'utilisateur' AND tu.id_user = s.id_cible
       ORDER BY s.date_creation DESC, s.id_signalement DESC`
    );
  }

  async findOneSignalement(id: number) {
    const rows: any[] = await this.db.query(
      `SELECT * FROM signalements WHERE id_signalement = ? LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async updateSignalementStatus(id: number, statut: string, adminId: number) {
    const allowed = ['ouvert', 'en_cours', 'resolu', 'rejete'];
    const normalizedStatut = allowed.includes(statut) ? statut : 'ouvert';
    await this.db.query(
      `UPDATE signalements
         SET statut = ?, id_admin = ?, date_traitement = NOW()
         WHERE id_signalement = ?`,
      [normalizedStatut, adminId, id],
    );
    return this.findOneSignalement(id);
  }

  async getDashboard() {
    const [statsRows, utilisateurs, boutiques, signalements, factures] = await Promise.all([
      this.db.query<any[]>(`
        SELECT
          (SELECT COUNT(*) FROM utilisateurs) AS utilisateurs,
          (SELECT COUNT(*) FROM utilisateurs WHERE date_creation >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS nouveaux_utilisateurs,
          (SELECT COUNT(*) FROM boutiques WHERE statut = 'actif') AS boutiques_actives,
          (SELECT COUNT(*) FROM categories WHERE statut = 'actif') AS categories_actives,
          (SELECT COUNT(*) FROM factures_boutique WHERE statut = 'paye') AS factures_payees,
          (SELECT COALESCE(SUM(montant), 0) FROM factures_boutique WHERE statut = 'paye') AS revenus_payes,
          (SELECT COUNT(*) FROM signalements WHERE statut IN ('ouvert', 'en_cours')) AS signalements_ouverts
      `),
      this.db.query<any[]>(`
        SELECT id_user, prenom, nom, email, role, statut, date_creation
        FROM utilisateurs
        ORDER BY date_creation DESC, id_user DESC
        LIMIT 5
      `),
      this.db.query<any[]>(`
        SELECT id_boutique, nom, statut, date_creation, nbr_abonnes
        FROM boutiques
        ORDER BY date_creation DESC, id_boutique DESC
        LIMIT 5
      `),
      this.db.query<any[]>(`
        SELECT id_signalement, type_cible, motif, statut, date_creation
        FROM signalements
        ORDER BY date_creation DESC, id_signalement DESC
        LIMIT 5
      `),
      this.db.query<any[]>(`
        SELECT fb.id, b.nom AS boutique_nom, fb.type_facture, fb.montant, fb.statut, fb.date_facture
        FROM factures_boutique fb
        LEFT JOIN boutiques b ON b.id_boutique = fb.boutique_id
        ORDER BY fb.date_facture DESC, fb.id DESC
        LIMIT 5
      `),
    ]);

    return {
      stats: statsRows?.[0] ?? {},
      recents: {
        utilisateurs: utilisateurs ?? [],
        boutiques: boutiques ?? [],
        signalements: signalements ?? [],
        factures: factures ?? [],
      },
    };
  }
  findOne(id: number) {
    // TODO: this.prisma.admin.findUnique({ where: { id } })
    return { id };
  }

  update(id: number, dto: Partial<CreateSignalementDto>) {
    // TODO: this.prisma.admin.update({ where: { id }, data: dto })
    return { id, ...dto };
  }

  remove(id: number) {
    // TODO: this.prisma.admin.delete({ where: { id } })
    return { id };
  }
}
