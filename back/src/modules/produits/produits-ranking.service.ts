import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

type ProduitAvecPromotions = { id_produit: number; promouvoir: Array<{ priorite: number }> };

type CacheEntry = {
  expiresAt: number;
  orderedIds: number[];
};

@Injectable()
export class ProduitsRankingService {
  private readonly paginationCache = new Map<string, CacheEntry>();
  private readonly cacheTtlMs = 3 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  /** Fisher-Yates: every non-promoted product has the same probability at each position. */
  shuffle<T>(items: T[], random: () => number = Math.random): T[] {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index--) {
      const selected = Math.floor(random() * (index + 1));
      [result[index], result[selected]] = [result[selected], result[index]];
    }
    return result;
  }

  /** Weighted roulette without replacement. A product's weight is max(active priority) + 1. */
  weightedShuffle<T extends ProduitAvecPromotions>(items: T[], random: () => number = Math.random): T[] {
    const remaining = [...items];
    const result: T[] = [];

    while (remaining.length) {
      const totalWeight = remaining.reduce((sum, product) => sum + Math.max(0, product.promouvoir[0]?.priorite ?? 0) + 1, 0);
      let draw = random() * totalWeight;
      let selectedIndex = remaining.length - 1;

      for (let index = 0; index < remaining.length; index++) {
        draw -= Math.max(0, remaining[index].promouvoir[0]?.priorite ?? 0) + 1;
        if (draw < 0) {
          selectedIndex = index;
          break;
        }
      }
      result.push(remaining.splice(selectedIndex, 1)[0]);
    }
    return result;
  }

  isActivePromotion(promotion: { statut: string; date_debut: Date; date_fin: Date }, now = new Date()): boolean {
    return promotion.statut === 'active' && promotion.date_debut <= now && promotion.date_fin >= now;
  }

  /**
   * The first page always creates a fresh order. Its ordered ids are retained briefly so
   * subsequent pages for the same filters use the exact same ordering (cache strategy b).
   */
  async getProduitsOrdonnes(
    filtres: Prisma.produitsWhereInput,
    page = 1,
    limite = 12,
    include: Prisma.produitsInclude = {},
    cacheKey = JSON.stringify(filtres),
  ) {
    const currentPage = Math.max(1, page);
    const take = Math.max(1, limite);
    const now = new Date();
    const cached = this.paginationCache.get(cacheKey);
    const canReuseOrder = currentPage > 1 && cached && cached.expiresAt > Date.now();

    const produits = await this.prisma.produits.findMany({
      where: filtres,
      include: {
        ...include,
        // Dates are deliberately checked in SQL, not just the potentially stale status.
        promouvoir: {
          where: { statut: 'active', date_debut: { lte: now }, date_fin: { gte: now } },
          select: { priorite: true },
          orderBy: { priorite: 'desc' },
        },
      },
    });

    let orderedIds: number[];
    if (canReuseOrder && cached.orderedIds.length === produits.length) {
      orderedIds = cached.orderedIds;
    } else {
      const promoted = produits.filter((produit) => produit.promouvoir.length > 0);
      const regular = produits.filter((produit) => produit.promouvoir.length === 0);
      orderedIds = [...this.weightedShuffle(promoted), ...this.shuffle(regular)].map((produit) => produit.id_produit);
      this.paginationCache.set(cacheKey, { orderedIds, expiresAt: Date.now() + this.cacheTtlMs });
    }

    const byId = new Map(produits.map((produit) => [produit.id_produit, produit]));
    const ordered = orderedIds.map((id) => byId.get(id)).filter((produit): produit is NonNullable<typeof produit> => !!produit);
    // `promouvoir` is only ranking metadata; never expose it or alter existing response shapes.
    const pageProducts = ordered
      .slice((currentPage - 1) * take, currentPage * take)
      .map(({ promouvoir: _promouvoir, ...produit }) => produit);
    return {
      produits: pageProducts,
      total: ordered.length,
      totalPages: Math.max(1, Math.ceil(ordered.length / take)),
    };
  }
}
