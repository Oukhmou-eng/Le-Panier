import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSignalementDto } from './dto/create-signalement.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSignalementDto) {
    return this.prisma.signalements.create({ data: dto });
  }

  findAll() {
    return this.prisma.signalements.findMany();
  }

  async findAllSignalements() {
    const signalements = await this.prisma.signalements.findMany({
      orderBy: [{ date_creation: 'desc' }, { id_signalement: 'desc' }],
      include: { utilisateurs_signalements_id_userToutilisateurs: { select: { prenom: true, nom: true, email: true } } },
    });
    const [boutiques, produits, utilisateurs] = await Promise.all([
      this.prisma.boutiques.findMany({ select: { id_boutique: true, nom: true } }),
      this.prisma.produits.findMany({ select: { id_produit: true, nom: true } }),
      this.prisma.utilisateurs.findMany({ select: { id_user: true, prenom: true, nom: true } }),
    ]);
    const boutiquesById = new Map(boutiques.map((boutique) => [boutique.id_boutique, boutique]));
    const produitsById = new Map(produits.map((produit) => [produit.id_produit, produit]));
    const utilisateursById = new Map(utilisateurs.map((utilisateur) => [utilisateur.id_user, utilisateur]));

    return signalements.map((signalement) => {
      const cibleBoutique = signalement.type_cible === 'boutique' ? boutiquesById.get(signalement.id_cible) : undefined;
      const cibleProduit = signalement.type_cible === 'produit' ? produitsById.get(signalement.id_cible) : undefined;
      const cibleUtilisateur = signalement.type_cible === 'utilisateur' ? utilisateursById.get(signalement.id_cible) : undefined;
      const signalant = signalement.utilisateurs_signalements_id_userToutilisateurs;
      return {
        ...signalement,
        signalant_prenom: signalant.prenom,
        signalant_nom: signalant.nom,
        signalant_email: signalant.email,
        boutique_nom: cibleBoutique?.nom ?? null,
        produit_nom: cibleProduit?.nom ?? null,
        cible_utilisateur_prenom: cibleUtilisateur?.prenom ?? null,
        cible_utilisateur_nom: cibleUtilisateur?.nom ?? null,
      };
    });
  }

  findOneSignalement(id: number) {
    return this.prisma.signalements.findUnique({ where: { id_signalement: id } });
  }

  async updateSignalementStatus(id: number, statut: string, adminId: number) {
    const allowed = ['ouvert', 'en_cours', 'resolu', 'rejete'] as const;
    const normalizedStatut = allowed.includes(statut as (typeof allowed)[number]) ? statut as (typeof allowed)[number] : 'ouvert';
    return this.prisma.signalements.update({
      where: { id_signalement: id },
      data: { statut: normalizedStatut, id_admin: adminId, date_traitement: new Date() },
    });
  }

  async getDashboard() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [utilisateursCount, nouveauxUtilisateurs, boutiquesActives, categoriesActives, facturesPayees, revenusPayes, signalementsOuverts, utilisateurs, boutiques, signalements, factures] = await Promise.all([
      this.prisma.utilisateurs.count(),
      this.prisma.utilisateurs.count({ where: { date_creation: { gte: sevenDaysAgo } } }),
      this.prisma.boutiques.count({ where: { statut: 'actif' } }),
      this.prisma.categories.count({ where: { statut: 'actif' } }),
      this.prisma.factures_boutique.count({ where: { statut: 'paye' } }),
      this.prisma.factures_boutique.aggregate({ where: { statut: 'paye' }, _sum: { montant: true } }),
      this.prisma.signalements.count({ where: { statut: { in: ['ouvert', 'en_cours'] } } }),
      this.prisma.utilisateurs.findMany({ orderBy: [{ date_creation: 'desc' }, { id_user: 'desc' }], take: 5, select: { id_user: true, prenom: true, nom: true, email: true, role: true, statut: true, date_creation: true } }),
      this.prisma.boutiques.findMany({ orderBy: [{ date_creation: 'desc' }, { id_boutique: 'desc' }], take: 5, select: { id_boutique: true, nom: true, statut: true, date_creation: true, nbr_abonnes: true } }),
      this.prisma.signalements.findMany({ orderBy: [{ date_creation: 'desc' }, { id_signalement: 'desc' }], take: 5, select: { id_signalement: true, type_cible: true, motif: true, statut: true, date_creation: true } }),
      this.prisma.factures_boutique.findMany({ orderBy: [{ date_facture: 'desc' }, { id: 'desc' }], take: 5, include: { boutiques: { select: { nom: true } } } }),
    ]);

    return {
      stats: { utilisateurs: utilisateursCount, nouveaux_utilisateurs: nouveauxUtilisateurs, boutiques_actives: boutiquesActives, categories_actives: categoriesActives, factures_payees: facturesPayees, revenus_payes: revenusPayes._sum.montant ?? 0, signalements_ouverts: signalementsOuverts },
      recents: {
        utilisateurs,
        boutiques,
        signalements,
        factures: factures.map(({ boutiques: boutique, ...facture }) => ({ ...facture, boutique_nom: boutique.nom })),
      },
    };
  }

  findOne(id: number) {
    return this.findOneSignalement(id);
  }

  async update(id: number, dto: Partial<CreateSignalementDto>) {
    return this.prisma.signalements.update({ where: { id_signalement: id }, data: dto });
  }

  async remove(id: number) {
    return this.prisma.signalements.delete({ where: { id_signalement: id } });
  }
}
