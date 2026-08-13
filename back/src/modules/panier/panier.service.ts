import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2';
import { CreatePanierItemDto } from './dto/create-panier-item.dto';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class PanierService {
  constructor(private readonly db: DatabaseService) {}

  private readonly cartItemSelect = `
    SELECT pi.id_panier_item AS id, pi.id_user, pi.id_produit, pi.quantite,
      p.nom, p.prix, p.stock, p.id_boutique, b.nom AS boutique_nom,
      b.logo_url AS boutique_logo_url, pm.url AS image_url,
      s.type_reduction, s.valeur_reduction, s.prix_promo, s.date_debut, s.date_fin
    FROM panier_items pi
    INNER JOIN produits p ON p.id_produit = pi.id_produit
    INNER JOIN boutiques b ON b.id_boutique = p.id_boutique
    LEFT JOIN soldes s ON s.id_produit = p.id_produit
      AND s.statut = 'active'
      AND s.date_debut <= NOW()
      AND s.date_fin >= NOW()
    LEFT JOIN produit_medias pm ON pm.id_media = (
      SELECT pm2.id_media FROM produit_medias pm2
      WHERE pm2.id_produit = p.id_produit
      ORDER BY pm2.ordre ASC, pm2.id_media ASC LIMIT 1
    )`;

  async findByUser(userId: number) {
    const items = await this.db.query<RowDataPacket[]>(
      `${this.cartItemSelect} WHERE pi.id_user = ? AND pi.est_enregistre = 0 ORDER BY pi.date_ajout DESC`,
      [userId],
    );
    return { items: items.map((item) => ({ ...item, variante: '' })) };
  }

  async findSavedByUser(userId: number) {
    const items = await this.db.query<RowDataPacket[]>(
      `${this.cartItemSelect} WHERE pi.id_user = ? AND pi.est_enregistre = 1 ORDER BY pi.date_ajout DESC`,
      [userId],
    );
    return { items: items.map((item) => ({ ...item, variante: '' })) };
  }

  async create(dto: CreatePanierItemDto) {
    const products = await this.db.query<RowDataPacket[]>(
      `SELECT stock FROM produits WHERE id_produit = ? AND statut = 'en_ligne' LIMIT 1`,
      [dto.id_produit],
    );
    if (!products.length) throw new NotFoundException('Produit introuvable ou indisponible');

    const existing = await this.db.query<RowDataPacket[]>(
      `SELECT id_panier_item, quantite FROM panier_items WHERE id_user = ? AND id_produit = ? LIMIT 1`,
      [dto.id_user, dto.id_produit],
    );
    const quantity = (existing[0]?.quantite ?? 0) + dto.quantite;
    this.ensureStock(quantity, products[0].stock);

    if (existing.length) {
      await this.db.query(
        `UPDATE panier_items SET quantite = ?, est_enregistre = 0 WHERE id_panier_item = ?`,
        [quantity, existing[0].id_panier_item],
      );
      return { success: true, created: false, id_panier_item: existing[0].id_panier_item, quantite: quantity };
    }

    const result: any = await this.db.query(
      `INSERT INTO panier_items (id_user, id_produit, quantite) VALUES (?, ?, ?)`,
      [dto.id_user, dto.id_produit, dto.quantite],
    );
    return { success: true, created: true, id_panier_item: result.insertId, quantite: dto.quantite };
  }

  async updateQuantity(id: number, userId: number, quantite: number) {
    const items = await this.db.query<RowDataPacket[]>(
      `SELECT pi.id_panier_item, p.stock FROM panier_items pi
       INNER JOIN produits p ON p.id_produit = pi.id_produit
       WHERE pi.id_panier_item = ? AND pi.id_user = ? AND pi.est_enregistre = 0 LIMIT 1`,
      [id, userId],
    );
    if (!items.length) throw new NotFoundException('Article du panier introuvable');
    this.ensureStock(quantite, items[0].stock);
    await this.db.query(`UPDATE panier_items SET quantite = ? WHERE id_panier_item = ? AND id_user = ?`, [quantite, id, userId]);
    return { success: true, id_panier_item: id, quantite };
  }

  async remove(id: number, userId: number) {
    const result: any = await this.db.query(`DELETE FROM panier_items WHERE id_panier_item = ? AND id_user = ?`, [id, userId]);
    if (!result.affectedRows) throw new NotFoundException('Article du panier introuvable');
    return { success: true, deleted: true };
  }

  async saveForLater(id: number, userId: number) {
    const result: any = await this.db.query(
      `UPDATE panier_items SET est_enregistre = 1 WHERE id_panier_item = ? AND id_user = ? AND est_enregistre = 0`,
      [id, userId],
    );
    if (!result.affectedRows) throw new NotFoundException('Article du panier introuvable');
    return { success: true };
  }

  async restoreFromSaved(id: number, userId: number) {
    const items = await this.db.query<RowDataPacket[]>(
      `SELECT pi.quantite, p.stock FROM panier_items pi INNER JOIN produits p ON p.id_produit = pi.id_produit
       WHERE pi.id_panier_item = ? AND pi.id_user = ? AND pi.est_enregistre = 1 LIMIT 1`,
      [id, userId],
    );
    if (!items.length) throw new NotFoundException('Article enregistré introuvable');
    this.ensureStock(items[0].quantite, items[0].stock);
    await this.db.query(`UPDATE panier_items SET est_enregistre = 0 WHERE id_panier_item = ? AND id_user = ?`, [id, userId]);
    return { success: true };
  }

  private ensureStock(quantity: number, stock: number) {
    if (quantity < 1) throw new BadRequestException('La quantité doit être supérieure à zéro');
    if (quantity > stock) throw new BadRequestException('La quantité demandée dépasse le stock disponible');
  }
}
