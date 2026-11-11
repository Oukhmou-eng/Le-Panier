import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { slugify } from '../../common/utils/slugify.util';
import { CreateBoutiqueDto } from './dto/create-boutique.dto';
import { ProduitsRankingService } from '../produits/produits-ranking.service';

@Injectable()
export class BoutiquesService {
  constructor(private readonly prisma: PrismaService, private readonly ranking: ProduitsRankingService) {}

  async create(id_user: number, dto: CreateBoutiqueDto) {
    const base = slugify(dto.nom).replace(/^-|-$/g, '') || 'boutique';
    const same = await this.prisma.boutiques.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } });
    const used = new Set(same.map((b) => b.slug)); let slug = base; let n = 2; while (used.has(slug)) slug = `${base}-${n++}`;
    try {
      const boutique = await this.prisma.$transaction(async (tx) => {
        const created = await tx.boutiques.create({ data: { id_user, nom: dto.nom.trim(), slug, description: dto.description?.trim() || null, logo_url: dto.logo_url?.trim() || null, banniere_url: dto.banniere_url?.trim() || null } });
        await tx.infoboutique.create({ data: { id_boutique: created.id_boutique, adresse: dto.adresse?.trim() || '', tele: dto.tele?.trim() || null, emailprof: dto.emailprof?.trim() || null, instagram: dto.instagram?.trim() || null, facebook: dto.facebook?.trim() || null } });
        return created;
      });
      return { id_boutique: boutique.id_boutique, id_user, nom: boutique.nom, slug };
    } catch (error: any) { if (error.code === 'P2002') throw new ConflictException('Cette boutique existe déjà.'); throw error; }
  }

  private async list(where: any = {}, orderBy: any = { nom: 'asc' }) {
    const boutiques = await this.prisma.boutiques.findMany({ where, orderBy, include: { produits: { where: { statut: 'en_ligne' }, select: { id_produit: true } } } });
    return boutiques.map(({ produits, ...b }) => ({ ...b, nbr_produits: produits.length }));
  }
  async findAll() { try { return { boutiques: await this.list({ statut: 'actif' }) }; } catch { return { boutiques: [] }; } }
  async findAllAdmin() { try { return { boutiques: await this.list({ statut: { in: ['actif', 'suspendu'] } }) }; } catch { return { boutiques: [] }; } }
  async updateStatusByAdmin(id: number, statut: string) { if (!['actif', 'suspendu'].includes(statut)) throw new BadRequestException('Statut invalide.'); const r = await this.prisma.boutiques.updateMany({ where: { id_boutique: id }, data: { statut: statut as any } }); return { success: !!r.count }; }
  async addFollow(id_user: number, id_boutique: number) { await this.prisma.boutiques_suivies.upsert({ where: { id_user_id_boutique: { id_user, id_boutique } }, create: { id_user, id_boutique }, update: {} }); return { success: true }; }
  async removeFollow(id_user: number, id_boutique: number) { const r = await this.prisma.boutiques_suivies.deleteMany({ where: { id_user, id_boutique } }); return { success: !!r.count }; }
  async checkFollow(id_user: number, id_boutique: number) { return { isFollowed: !!(await this.prisma.boutiques_suivies.findUnique({ where: { id_user_id_boutique: { id_user, id_boutique } } })) }; }
  async findOne(id: number) {
    const now = new Date();
    const boutique = await this.prisma.boutiques.findUnique({ where: { id_boutique: id }, include: { infoboutique: true } });
    const produits = (await this.ranking.getProduitsOrdonnes(
      { id_boutique: id, statut: 'en_ligne' },
      1,
      Number.MAX_SAFE_INTEGER,
      {
        produit_medias: { orderBy: [{ ordre: 'asc' }, { id_media: 'asc' }], take: 1 },
        soldes: {
          where: { statut: 'active', date_debut: { lte: now }, date_fin: { gte: now } },
          orderBy: [{ date_creation: 'desc' }, { id_solde: 'desc' }],
          take: 1,
        },
      },
      `boutique:${id}`,
    )).produits;

    return {
      boutique,
      produits: produits.map(({ produit_medias, soldes, ...p }) => ({
        ...p,
        url: produit_medias[0]?.url ?? null,
        type: produit_medias[0]?.type ?? null,
        type_reduction: soldes[0]?.type_reduction ?? null,
        valeur_reduction: soldes[0]?.valeur_reduction ?? null,
        prix_promo: soldes[0]?.prix_promo ?? null,
      })),
    };
  }
  async getMesBoutiques(id_user: number) { return { boutiques: await this.prisma.boutiques.findMany({ where: { id_user } }) }; }
  async getMesBoutiquesid(id_user: number, id: number) { return { boutiques: await this.prisma.boutiques.findMany({ where: { id_user, id_boutique: id }, include: { infoboutique: true } }) }; }
  async search(term: string) { return { boutiques: await this.list({ statut: 'actif', OR: [{ nom: { contains: term } }, { slug: { contains: term } }] }) }; }
  async trie(sort: string) { return { boutiques: await this.list({ statut: 'actif' }, sort === 'mieux_notees' ? { note_moyenne: 'desc' } : sort === 'nouvelles' ? { date_creation: 'desc' } : { nom: 'asc' }) }; }
  async tries(sort: string, id_user: number) { return this.trie(sort); }

  async update(id: number, userId: number, dto: Partial<CreateBoutiqueDto>) {
    const boutique = await this.prisma.boutiques.findUnique({ where: { id_boutique: id } }); if (!boutique) throw new BadRequestException('Boutique introuvable.'); if (boutique.id_user !== userId) throw new ForbiddenException('Vous ne pouvez pas modifier cette boutique.');
    await this.prisma.$transaction(async (tx) => {
      await tx.boutiques.update({ where: { id_boutique: id }, data: { ...(dto.nom !== undefined && { nom: dto.nom.trim() }), ...(dto.description !== undefined && { description: dto.description?.trim() || null }), ...(dto.logo_url !== undefined && { logo_url: dto.logo_url?.trim() || null }), ...(dto.banniere_url !== undefined && { banniere_url: dto.banniere_url?.trim() || null }) } });
      if (['adresse', 'tele', 'emailprof', 'instagram', 'facebook'].some((key) => dto[key] !== undefined)) await tx.infoboutique.upsert({ where: { id_boutique: id }, create: { id_boutique: id, adresse: dto.adresse?.trim() || '', tele: dto.tele?.trim() || null, emailprof: dto.emailprof?.trim() || null, instagram: dto.instagram?.trim() || null, facebook: dto.facebook?.trim() || null }, update: { ...(dto.adresse !== undefined && { adresse: dto.adresse?.trim() || '' }), ...(dto.tele !== undefined && { tele: dto.tele?.trim() || null }), ...(dto.emailprof !== undefined && { emailprof: dto.emailprof?.trim() || null }), ...(dto.instagram !== undefined && { instagram: dto.instagram?.trim() || null }), ...(dto.facebook !== undefined && { facebook: dto.facebook?.trim() || null }) } });
    }); return { success: true };
  }
  async remove(id: number) { await this.prisma.boutiques.delete({ where: { id_boutique: id } }); return { id }; }
  async signaler(id_cible: number, motif: string, description: string, id_user: number) { await this.prisma.signalements.create({ data: { id_user, id_cible, type_cible: 'boutique', motif, description, statut: 'en_cours' } }); return { success: true, message: 'Signalement envoyé avec succès.' }; }
  async getAvis(id: number) { const avis = await this.prisma.avis.findMany({ where: { type_cible: 'boutique', id_cible: id }, orderBy: { date_creation: 'desc' }, include: { utilisateurs: { select: { nom: true, prenom: true, logo_url: true } }, reponses_avis: { where: { id_boutique: id } } } }); return { avis: avis.map(({ utilisateurs, reponses_avis, ...a }) => ({ ...a, ...utilisateurs, reponse: reponses_avis?.reponse ?? null })) }; }
  async respondToAvis(boutiqueId: number, avisId: number, reponse: string, userId: number) { const valid = await this.prisma.boutiques.findFirst({ where: { id_boutique: boutiqueId, id_user: userId } }); if (!valid || !(await this.prisma.avis.findFirst({ where: { id_avis: avisId, id_cible: boutiqueId, type_cible: 'boutique' } }))) throw new BadRequestException('Avis ou boutique introuvable.'); const result = await this.prisma.reponses_avis.upsert({ where: { id_avis: avisId }, create: { id_avis: avisId, id_boutique: boutiqueId, reponse: reponse.trim() }, update: { reponse: reponse.trim(), date_modification: new Date() } }); return { reponse: result.reponse }; }
  async ajouterAvis(id_cible: number, note: number, commentaire: string, id_user: number) { await this.prisma.avis.create({ data: { id_user, id_cible, type_cible: 'boutique', note, commentaire } }); return { message: 'Avis ajouté avec succès.' }; }
  async getBS(id_user: number, search = '', sort = '') { const follows = await this.prisma.boutiques_suivies.findMany({ where: { id_user, boutiques: { statut: 'actif', OR: [{ nom: { contains: search } }, { slug: { contains: search } }] } }, include: { boutiques: { include: { produits: { where: { statut: 'en_ligne' }, select: { id_produit: true } } } } }, orderBy: { date_suivi: 'desc' } }); let boutiques = follows.map(({ boutiques: b }) => ({ ...b, nbr_produits: b.produits.length })); if (sort === 'mieux_notees') boutiques = boutiques.sort((a, b) => Number(b.note_moyenne) - Number(a.note_moyenne)); if (sort === 'plus_produits') boutiques = boutiques.sort((a, b) => b.nbr_produits - a.nbr_produits); return { boutiques }; }
}
