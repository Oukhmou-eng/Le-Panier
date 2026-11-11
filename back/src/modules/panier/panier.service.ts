import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreatePanierItemDto } from './dto/create-panier-item.dto';

@Injectable()
export class PanierService {
  constructor(private readonly prisma: PrismaService) {}

  private productInclude(now: Date): Prisma.panier_itemsInclude {
    return {
      produits: {
        include: {
          boutiques: { select: { nom: true, logo_url: true } },
          produit_medias: { orderBy: [{ ordre: 'asc' }, { id_media: 'asc' }], take: 1 },
          soldes: {
            where: { statut: 'active', date_debut: { lte: now }, date_fin: { gte: now } },
            orderBy: [{ date_creation: 'desc' }, { id_solde: 'desc' }],
            take: 1,
          },
        },
      },
    };
  }

  private formatItems(items: any[]) {
    return items.map(({ produits: produit, ...item }) => {
      const solde = produit.soldes[0];
      return {
        id: item.id_panier_item,
        id_user: item.id_user,
        id_produit: item.id_produit,
        quantite: item.quantite,
        nom: produit.nom,
        prix: produit.prix,
        stock: produit.stock,
        id_boutique: produit.id_boutique,
        boutique_nom: produit.boutiques.nom,
        boutique_logo_url: produit.boutiques.logo_url,
        image_url: produit.produit_medias[0]?.url ?? null,
        type_reduction: solde?.type_reduction ?? null,
        valeur_reduction: solde?.valeur_reduction ?? null,
        prix_promo: solde?.prix_promo ?? null,
        date_debut: solde?.date_debut ?? null,
        date_fin: solde?.date_fin ?? null,
        variante: '',
      };
    });
  }

  async findByUser(userId: number) {
    const items = await this.prisma.panier_items.findMany({
      where: { id_user: userId, est_enregistre: false },
      orderBy: { date_ajout: 'desc' },
      include: this.productInclude(new Date()),
    });
    return { items: this.formatItems(items) };
  }

  async findSavedByUser(userId: number) {
    const items = await this.prisma.panier_items.findMany({
      where: { id_user: userId, est_enregistre: true },
      orderBy: { date_ajout: 'desc' },
      include: this.productInclude(new Date()),
    });
    return { items: this.formatItems(items) };
  }

  async create(dto: CreatePanierItemDto) {
    const product = await this.prisma.produits.findFirst({
      where: { id_produit: dto.id_produit, statut: 'en_ligne' },
      select: { stock: true },
    });
    if (!product) throw new NotFoundException('Produit introuvable ou indisponible');

    const existing = await this.prisma.panier_items.findUnique({
      where: { id_user_id_produit: { id_user: dto.id_user, id_produit: dto.id_produit } },
    });
    const quantite = (existing?.quantite ?? 0) + dto.quantite;
    this.ensureStock(quantite, product.stock);

    if (existing) {
      await this.prisma.panier_items.update({
        where: { id_panier_item: existing.id_panier_item },
        data: { quantite, est_enregistre: false },
      });
      return { success: true, created: false, id_panier_item: existing.id_panier_item, quantite };
    }

    const item = await this.prisma.panier_items.create({
      data: { id_user: dto.id_user, id_produit: dto.id_produit, quantite: dto.quantite },
    });
    return { success: true, created: true, id_panier_item: item.id_panier_item, quantite: item.quantite };
  }

  async updateQuantity(id: number, userId: number, quantite: number) {
    const item = await this.prisma.panier_items.findFirst({
      where: { id_panier_item: id, id_user: userId, est_enregistre: false },
      include: { produits: { select: { stock: true } } },
    });
    if (!item) throw new NotFoundException('Article du panier introuvable');
    this.ensureStock(quantite, item.produits.stock);
    await this.prisma.panier_items.update({ where: { id_panier_item: id }, data: { quantite } });
    return { success: true, id_panier_item: id, quantite };
  }

  async remove(id: number, userId: number) {
    const result = await this.prisma.panier_items.deleteMany({ where: { id_panier_item: id, id_user: userId } });
    if (!result.count) throw new NotFoundException('Article du panier introuvable');
    return { success: true, deleted: true };
  }

  async saveForLater(id: number, userId: number) {
    const result = await this.prisma.panier_items.updateMany({
      where: { id_panier_item: id, id_user: userId, est_enregistre: false },
      data: { est_enregistre: true },
    });
    if (!result.count) throw new NotFoundException('Article du panier introuvable');
    return { success: true };
  }

  async restoreFromSaved(id: number, userId: number) {
    const item = await this.prisma.panier_items.findFirst({
      where: { id_panier_item: id, id_user: userId, est_enregistre: true },
      include: { produits: { select: { stock: true } } },
    });
    if (!item) throw new NotFoundException('Article enregistré introuvable');
    this.ensureStock(item.quantite, item.produits.stock);
    await this.prisma.panier_items.update({ where: { id_panier_item: id }, data: { est_enregistre: false } });
    return { success: true };
  }

  private ensureStock(quantity: number, stock: number) {
    if (quantity < 1) throw new BadRequestException('La quantité doit être supérieure à zéro');
    if (quantity > stock) throw new BadRequestException('La quantité demandée dépasse le stock disponible');
  }
}
