import { ProduitsRankingService } from './produits-ranking.service';

const product = (id_produit: number, priorite?: number) => ({
  id_produit,
  promouvoir: priorite === undefined ? [] : [{ priorite }],
});

describe('ProduitsRankingService', () => {
  const service = new ProduitsRankingService({} as any);

  it('places every actively promoted product before regular products', () => {
    const ordered = [
      ...service.weightedShuffle([product(1, 0), product(2, 5)], () => 0.4),
      ...service.shuffle([product(3), product(4)], () => 0.4),
    ];

    expect(ordered.map((item) => item.id_produit)).toEqual(expect.arrayContaining([1, 2, 3, 4]));
    expect(ordered.slice(0, 2).every((item) => item.promouvoir.length > 0)).toBe(true);
    expect(ordered.slice(2).every((item) => item.promouvoir.length === 0)).toBe(true);
  });

  it('does not keep a fixed ordering for regular products', () => {
    const originalRandom = Math.random;
    const orders = new Set<string>();
    try {
      for (let simulation = 0; simulation < 30; simulation++) {
        Math.random = () => (simulation * 0.61803398875) % 1;
        orders.add(service.shuffle([product(1), product(2), product(3), product(4)]).map((item) => item.id_produit).join(','));
      }
    } finally {
      Math.random = originalRandom;
    }
    expect(orders.size).toBeGreaterThan(1);
  });

  it('draws a higher-priority promotion first more often over many simulations', () => {
    let highFirst = 0;
    let state = 17;
    const random = () => {
      state = (state * 48271) % 2147483647;
      return state / 2147483647;
    };

    for (let simulation = 0; simulation < 1000; simulation++) {
      const ordered = service.weightedShuffle([product(1, 0), product(2, 9)], random);
      if (ordered[0].id_produit === 2) highFirst++;
    }
    expect(highFirst).toBeGreaterThan(500);
  });

  it('does not consider an expired active-status promotion to be active', () => {
    const now = new Date('2026-08-25T12:00:00Z');
    expect(service.isActivePromotion({ statut: 'active', date_debut: new Date('2026-08-24T12:00:00Z'), date_fin: new Date('2026-08-25T11:59:59Z') }, now)).toBe(false);
  });
});
