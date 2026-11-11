import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategorieDto } from './dto/create-categorie.dto';
import { ProduitsRankingService } from '../produits/produits-ranking.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService, private readonly ranking: ProduitsRankingService) {}

  async create(dto: CreateCategorieDto) {
    const input = dto as any;
    const nom = String(input.nom ?? input.name ?? '').trim();
    if (!nom) throw new BadRequestException('Le nom de la catégorie est requis.');
    const category = await this.prisma.categories.create({ data: { nom, icone: String(input.icone ?? input.icon ?? '').trim() || null, statut: input.statut ?? input.status === 'inactif' ? 'inactif' : 'actif' } });
    return { id_categorie: category.id_categorie, nom: category.nom, icone: category.icone, statut: category.statut };
  }

  findAll() { return this.prisma.categories.findMany({ orderBy: { nom: 'asc' }, select: { id_categorie: true, nom: true, icone: true, statut: true } }); }
  async findNames() { return (await this.prisma.categories.findMany({ orderBy: { nom: 'asc' }, select: { id_categorie: true, nom: true } })).map((category) => ({ id: category.id_categorie, label: category.nom })); }
  findOne(id: number) { return this.prisma.categories.findUnique({ where: { id_categorie: id }, select: { id_categorie: true, nom: true, icone: true, statut: true } }); }

  async update(id: number, dto: Partial<CreateCategorieDto>) {
    if (!dto.nom && dto.icone === undefined && dto.statut === undefined) return this.findOne(id);
    return this.prisma.categories.update({ where: { id_categorie: id }, data: { nom: dto.nom?.trim(), icone: dto.icone === undefined ? undefined : dto.icone?.trim() || null, statut: dto.statut === undefined ? undefined : dto.statut === 'inactif' ? 'inactif' : 'actif' } });
  }
  async remove(id: number) { await this.prisma.categories.delete({ where: { id_categorie: id } }); return { id_categorie: id }; }

  private include(now = new Date()): Prisma.produitsInclude {
    return { boutiques: { select: { nom: true } }, produit_medias: { orderBy: [{ ordre: 'asc' }, { id_media: 'asc' }], take: 1 }, soldes: { where: { statut: 'active', date_debut: { lte: now }, date_fin: { gte: now } }, orderBy: [{ date_creation: 'desc' }, { id_solde: 'desc' }], take: 1 } };
  }
  private format(produits: any[]) { return produits.map(({ boutiques, produit_medias, soldes, ...produit }) => ({ ...produit, boutique_nom: boutiques.nom, url: produit_medias[0]?.url ?? null, type: produit_medias[0]?.type ?? null, type_reduction: soldes[0]?.type_reduction ?? null, valeur_reduction: soldes[0]?.valeur_reduction ?? null, prix_promo: soldes[0]?.prix_promo ?? null })); }

  async findSearch(search: string) {
    try {
      const result = await this.ranking.getProduitsOrdonnes({ statut: 'en_ligne', OR: [{ nom: { contains: search } }, { boutiques: { nom: { contains: search } } }, { categories: { nom: { contains: search } } }] }, 1, Number.MAX_SAFE_INTEGER, this.include(), `search:${search}`);
      return { produits: this.format(result.produits) };
    } catch (error) { console.error('Erreur findSearch:', error); return { produits: [] }; }
  }

  async filtre(search: string, categories: string[] = [], priceRanges: string[] = [], minRating = false, _conditions: string[] = [], sort = 'pertinence', page = 1) {
    try {
      const orPrix: Prisma.produitsWhereInput[] = []; for (const range of priceRanges) { if (range === '0-200') orPrix.push({ prix: { gte: 0, lte: 200 } }); else if (range === '200-500') orPrix.push({ prix: { gte: 200, lte: 500 } }); else if (range === '500+') orPrix.push({ prix: { gt: 500 } }); }
      const ids = categories.map(Number).filter(Number.isInteger);
      const where: Prisma.produitsWhereInput = { statut: 'en_ligne', ...(search.trim() ? { OR: [{ nom: { startsWith: search.trim() } }, { boutiques: { nom: { startsWith: search.trim() } } }, { categories: { nom: { startsWith: search.trim() } } }] } : {}), ...(ids.length ? { id_categorie: { in: ids } } : {}), ...(orPrix.length ? { AND: [{ OR: orPrix }] } : {}), ...(minRating ? { boutiques: { note_moyenne: { gte: 4 } } } : {}) };
      const currentPage = Math.max(1, page || 1), take = 12;
      const result = await this.ranking.getProduitsOrdonnes(where, currentPage, take, this.include(), `catalogue:${JSON.stringify({ search, categories, priceRanges, minRating, sort })}`);
      return { produits: this.format(result.produits), total: result.total, totalPages: result.totalPages };
    } catch (error) { console.error('Erreur filtre:', error); return { produits: [], total: 0, totalPages: 1 }; }
  }

  async findSoldes(page = 1) {
    try {
      const now = new Date(), currentPage = Math.max(1, page), take = 12;
      const where: Prisma.soldesWhereInput = { statut: { in: ['active', 'en_attente'] }, date_debut: { lte: now }, date_fin: { gte: now }, produits: { statut: 'en_ligne' } };
      const [soldes, total] = await Promise.all([this.prisma.soldes.findMany({ where, orderBy: { date_creation: 'desc' }, skip: (currentPage - 1) * take, take, include: { produits: { include: { boutiques: { select: { nom: true } }, produit_medias: { orderBy: [{ ordre: 'asc' }, { id_media: 'asc' }], take: 1 } } } } }), this.prisma.soldes.count({ where })]);
      return { produits: soldes.map(({ produits, id_produit: _idProduit, ...solde }) => ({ ...solde, id_produit: produits.id_produit, nom: produits.nom, prix_original: produits.prix, boutique_nom: produits.boutiques.nom, url: produits.produit_medias[0]?.url ?? null, type: produits.produit_medias[0]?.type ?? null })), total, currentPage, totalPages: Math.ceil(total / take), limit: take };
    } catch (error) { console.error('Erreur findSoldes :', error); return { produits: [], total: 0, currentPage: 1, totalPages: 0, limit: 12 }; }
  }
}
