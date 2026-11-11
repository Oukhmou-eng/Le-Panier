import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProduitsRankingService } from '../produits/produits-ranking.service';

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService, private readonly ranking: ProduitsRankingService) {}

  async getHomeData(userId?: number) {
    try {
      const now = new Date();
      const [produits, favoris] = await Promise.all([
        this.ranking.getProduitsOrdonnes({ statut: 'en_ligne' }, 1, Number.MAX_SAFE_INTEGER, {
            boutiques: { select: { nom: true } },
            produit_medias: { orderBy: [{ ordre: 'asc' }, { id_media: 'asc' }], take: 1 },
            soldes: {
              where: { statut: 'active', date_debut: { lte: now }, date_fin: { gte: now } },
              orderBy: [{ date_creation: 'desc' }, { id_solde: 'desc' }],
              take: 1,
            },
          }, 'home-publics').then((result) => result.produits),
        userId
          ? this.prisma.favoris.findMany({ where: { id_user: userId }, select: { id_produit: true } })
          : Promise.resolve([]),
      ]);

      return {
        produitsVedette: produits.map((produit) => {
          const media = produit.produit_medias[0];
          const solde = produit.soldes[0];
          return {
            id_produit: produit.id_produit,
            nom: produit.nom,
            prix: produit.prix,
            boutique_nom: produit.boutiques.nom,
            url: media?.url ?? null,
            type: media?.type ?? null,
            type_reduction: solde?.type_reduction ?? null,
            valeur_reduction: solde?.valeur_reduction ?? null,
            prix_promo: solde?.prix_promo ?? null,
          };
        }),
        favoris: favoris.map((favori) => favori.id_produit),
      };
    } catch (error) {
      console.error('Erreur getHomeData:', error);
      return { produitsVedette: [], favoris: [] };
    }
  }
}
