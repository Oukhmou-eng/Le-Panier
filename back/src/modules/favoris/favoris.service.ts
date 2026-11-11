import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateFavoriDto } from './dto/create-favori.dto';

@Injectable()
export class FavorisService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFavoriDto) {
    try {
      const existing = await this.prisma.favoris.findUnique({
        where: { id_user_id_produit: { id_user: dto.id_user, id_produit: dto.id_produit } },
      });
      if (existing) return { success: true, created: false, favori: existing };

      const favori = await this.prisma.favoris.create({ data: dto });
      return { success: true, created: true, id_favori: favori.id_favori };
    } catch (error) {
      console.error('Erreur lors de la création du favori :', error);
      return { success: false, error: "Impossible d'ajouter le favori" };
    }
  }

  findAll() {
    return this.prisma.favoris.findMany();
  }

  async getFav(id: number) {
    try {
      const favoris = await this.prisma.favoris.findMany({
        where: { id_user: id, produits: { statut: 'en_ligne' } },
        orderBy: { produits: { date_creation: 'desc' } },
        include: {
          produits: {
            include: {
              boutiques: { select: { nom: true } },
              produit_medias: { orderBy: [{ ordre: 'asc' }, { id_media: 'asc' }], take: 1 },
              soldes: {
                where: { statut: 'active', date_debut: { lte: new Date() }, date_fin: { gte: new Date() } },
                orderBy: [{ date_creation: 'desc' }, { id_solde: 'desc' }],
                take: 1,
              },
            },
          },
        },
      });

      return {
        produitsVedette: favoris.map(({ produits }) => {
          const media = produits.produit_medias[0];
          const solde = produits.soldes[0];
          return {
            id_produit: produits.id_produit,
            nom: produits.nom,
            prix: produits.prix,
            boutique_nom: produits.boutiques.nom,
            url: media?.url ?? null,
            type: media?.type ?? null,
            type_reduction: solde?.type_reduction ?? null,
            valeur_reduction: solde?.valeur_reduction ?? null,
            prix_promo: solde?.prix_promo ?? null,
          };
        }),
      };
    } catch (error) {
      console.error('Erreur getFav:', error);
      return { produitsVedette: [] };
    }
  }

  async addFavori(userId: number, produitId: number) {
    return this.create({ id_user: userId, id_produit: produitId });
  }

  async removeFavori(userId: number, produitId: number) {
    try {
      const result = await this.prisma.favoris.deleteMany({ where: { id_user: userId, id_produit: produitId } });
      return { success: true, deleted: result.count > 0 };
    } catch (error) {
      console.error('Erreur lors de la suppression du favori :', error);
      return { success: false, error: 'Impossible de retirer le favori' };
    }
  }

  async update(id: number, dto: Partial<CreateFavoriDto>) {
    return this.prisma.favoris.update({ where: { id_favori: id }, data: dto });
  }

  async remove(id: number) {
    return this.prisma.favoris.delete({ where: { id_favori: id } });
  }
}
