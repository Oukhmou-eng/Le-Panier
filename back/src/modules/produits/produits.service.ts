import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateProduitDto } from './dto/create-produit.dto';
import { CreateSoldeDto } from './dto/create-solde.dto';
import { ProduitsRankingService } from './produits-ranking.service';

type Media = { type: 'image' | 'video'; url: string; ordre: number };

@Injectable()
export class ProduitsService {
  constructor(private readonly prisma: PrismaService, private readonly ranking: ProduitsRankingService) {}

  private async categoryId(categorie: string) {
    const value = categorie.trim();
    const id = Number(value);
    const category = await this.prisma.categories.findFirst({ where: { OR: [{ nom: value }, ...(Number.isInteger(id) ? [{ id_categorie: id }] : [])] }, select: { id_categorie: true } });
    if (!category) throw new BadRequestException('La catégorie sélectionnée est introuvable.');
    return category.id_categorie;
  }

  private productInclude(now = new Date()): Prisma.produitsInclude {
    return {
      boutiques: { select: { nom: true, id_user: true } },
      categories: { select: { nom: true } },
      produit_medias: { orderBy: [{ ordre: 'asc' }, { id_media: 'asc' }] },
      soldes: { where: { statut: 'active', date_debut: { lte: now }, date_fin: { gte: now } }, orderBy: [{ date_creation: 'desc' }, { id_solde: 'desc' }], take: 1 },
    };
  }

  async create(dto: CreateProduitDto, medias: Media[], idUser: number) {
    const [boutique, idCategorie] = await Promise.all([
      this.prisma.boutiques.findFirst({ where: { id_user: idUser, statut: 'actif' }, orderBy: { date_creation: 'asc' }, select: { id_boutique: true } }),
      this.categoryId(dto.categorie),
    ]);
    if (!boutique) throw new BadRequestException('Créez d’abord une boutique active avant de publier un produit.');
    const produit = await this.prisma.produits.create({
      data: { id_boutique: boutique.id_boutique, id_categorie: idCategorie, nom: dto.nom.trim(), description: dto.description?.trim() || null, prix: dto.prix, stock: dto.stock, statut: dto.statut ?? 'en_ligne', produit_medias: { create: medias } },
    });
    return { id_produit: produit.id_produit, id_boutique: boutique.id_boutique, statut: produit.statut, medias };
  }

  async findAll() { return (await this.ranking.getProduitsOrdonnes({ statut: 'en_ligne' }, 1, Number.MAX_SAFE_INTEGER, {}, 'produits-publics')).produits; }

  async getMesProduits(id: number) {
    try {
      const produits = await this.prisma.produits.findMany({
        where: { id_boutique: id }, orderBy: [{ date_creation: 'desc' }, { id_produit: 'desc' }],
        include: { boutiques: { select: { nom: true } }, categories: { select: { nom: true } }, produit_medias: { orderBy: [{ ordre: 'asc' }, { id_media: 'asc' }], take: 1 }, commande_lignes: { select: { quantite: true } } },
      });
      return { produits: produits.map(({ boutiques, categories, produit_medias, commande_lignes, ...produit }) => ({ ...produit, categorie_nom: categories?.nom ?? null, boutique_nom: boutiques.nom, image_url: produit_medias[0]?.url ?? null, ventes: commande_lignes.reduce((total, ligne) => total + ligne.quantite, 0) })) };
    } catch (error) { console.error('Erreur getMesProduits:', error); return { produits: [] }; }
  }

  async findOne(id: number) {
    const produit = await this.prisma.produits.findUnique({ where: { id_produit: id }, include: this.productInclude() });
    if (!produit) return null;
    const { boutiques, categories, soldes, produit_medias, ...data } = produit;
    const solde = soldes[0];
    return { ...data, categorie_nom: categories?.nom ?? null, boutique_nom: boutiques.nom, type_reduction: solde?.type_reduction ?? null, valeur_reduction: solde?.valeur_reduction ?? null, prix_promo: solde?.prix_promo ?? null, date_debut: solde?.date_debut ?? null, date_fin: solde?.date_fin ?? null, medias: produit_medias.map(({ type, url, ordre }) => ({ type, url, ordre })) };
  }

  async update(id: number, dto: Partial<CreateProduitDto>, medias: Media[] = [], idUser?: number) {
    const produit = await this.prisma.produits.findUnique({ where: { id_produit: id }, include: { boutiques: { select: { id_user: true } }, produit_medias: { select: { ordre: true }, orderBy: { ordre: 'desc' }, take: 1 } } });
    if (!produit || (typeof idUser === 'number' && produit.boutiques.id_user !== idUser)) throw new BadRequestException('Produit introuvable ou accès non autorisé.');
    const id_categorie = dto.categorie !== undefined ? await this.categoryId(dto.categorie) : undefined;
    await this.prisma.$transaction(async (tx) => {
      await tx.produits.update({ where: { id_produit: id }, data: { nom: dto.nom?.trim(), description: dto.description === undefined ? undefined : dto.description.trim() || null, prix: dto.prix, stock: dto.stock, statut: dto.statut, id_categorie } });
      if (medias.length) {
        const start = (produit.produit_medias[0]?.ordre ?? -1) + 1;
        await tx.produit_medias.createMany({ data: medias.map((media, index) => ({ id_produit: id, type: media.type, url: media.url, ordre: start + index })) });
      }
    });
    return this.findOne(id);
  }

  async remove(id: number) {
    try { const result = await this.prisma.produits.deleteMany({ where: { id_produit: id } }); return { success: result.count > 0 }; }
    catch (error) { console.error('Erreur lors de la suppression du produit :', error); return { success: false, error: 'Impossible de supprimer le produit' }; }
  }

  async signaler(id: number, motif: string, description: string, idUser: number) {
    try { await this.prisma.signalements.create({ data: { id_user: idUser, type_cible: 'produit', id_cible: id, motif, description, statut: 'en_cours' } }); return { success: true, message: 'Signalement envoyé avec succès.' }; }
    catch (error) { console.error('Erreur signaler produit:', error); return { success: false, message: "Une erreur est survenue lors de l'envoi du signalement." }; }
  }

  async getAvis(id: number) {
    try {
      const avis = await this.prisma.avis.findMany({ where: { type_cible: 'produit', id_cible: id }, include: { utilisateurs: { select: { nom: true, prenom: true, logo_url: true } } } });
      return { avis: avis.map(({ utilisateurs, ...avis }) => ({ nom: utilisateurs.nom, prenom: utilisateurs.prenom, logo_url: utilisateurs.logo_url, commentaire: avis.commentaire, note: avis.note })) };
    } catch (error) { console.error('Erreur getAvis:', error); return { avis: [] }; }
  }

  async findSimilarProducts(shopId: number, idCategorie: number) {
    try {
      const produits = (await this.ranking.getProduitsOrdonnes({ statut: 'en_ligne', OR: [{ id_boutique: shopId }, { id_categorie: idCategorie }] }, 1, 5, { boutiques: { select: { nom: true } }, produit_medias: { orderBy: [{ ordre: 'asc' }, { id_media: 'asc' }], take: 1 } }, `similaires:${shopId}:${idCategorie}`)).produits;
      return { produitsVedette: produits.map(({ boutiques, produit_medias, ...produit }) => ({ ...produit, boutique_nom: boutiques.nom, url: produit_medias[0]?.url ?? null, type: produit_medias[0]?.type ?? null })) };
    } catch (error) { console.error('Erreur findSimilarProducts:', error); return { produitsVedette: [] }; }
  }

  async createSolde(idProduit: number, dto: CreateSoldeDto, idUser?: number) {
    if (typeof idUser !== 'number') throw new BadRequestException('Utilisateur non authentifié.');
    const produit = await this.prisma.produits.findUnique({ where: { id_produit: idProduit }, include: { boutiques: { select: { id_user: true } } } });
    if (!produit || produit.boutiques.id_user !== idUser) throw new BadRequestException('Produit introuvable ou accès non autorisé.');
    const debut = new Date(dto.date_debut), fin = new Date(dto.date_fin);
    if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime()) || debut >= fin) throw new BadRequestException('Dates invalides pour le solde.');
    if (dto.prix_promo < 0 || dto.valeur_reduction < 0) throw new BadRequestException('Valeurs de réduction invalides.');
    const solde = await this.prisma.soldes.create({ data: { id_produit: idProduit, type_reduction: dto.type_reduction, valeur_reduction: dto.valeur_reduction, prix_promo: dto.prix_promo, date_debut: debut, date_fin: fin, statut: 'active' } });
    return { id_solde: solde.id_solde, id_produit: idProduit, statut: 'en_attente' };
  }
}
