import { Injectable } from '@nestjs/common';
import { CreateFavoriDto } from './dto/create-favori.dto';
import { DatabaseService } from '../../database/database.service';
@Injectable()
export class FavorisService {
  constructor(private readonly db: DatabaseService) {}
  async create(dto: CreateFavoriDto) {
    try {
      const existing = await this.db.query(
        `SELECT id_favori FROM favoris WHERE id_user = ? AND id_produit = ? LIMIT 1`,
        [dto.id_user, dto.id_produit],
      );

      if (Array.isArray(existing) && existing.length > 0) {
        return { success: true, created: false, favori: existing[0] };
      }

      const result: any = await this.db.query(
        `INSERT INTO favoris (id_user, id_produit) VALUES (?, ?)`,
        [dto.id_user, dto.id_produit],
      );

      return {
        success: true,
        created: true,
        id_favori: result?.insertId,
      };
    } catch (error) {
      console.error('Erreur lors de la création du favori :', error);
      return { success: false, error: 'Impossible d\'ajouter le favori' };
    }
  }

  findAll() {
    // TODO: this.prisma.favoris.findMany()
    return [];
  }

  async getFav(id: number) {
 try {
      const produitsVedette = await this.db.query(`
        SELECT
          p.id_produit,
          p.nom,
          p.prix,
          b.nom AS boutique_nom,
          pm.url,
          pm.type,
          s.type_reduction,
          s.valeur_reduction,
          s.prix_promo
        FROM produits p
        INNER JOIN boutiques b
          ON b.id_boutique = p.id_boutique

          INNER JOIN favoris f
          ON f.id_produit = p.id_produit
        LEFT JOIN produit_medias pm
          ON pm.id_media = (
            SELECT pm2.id_media
            FROM produit_medias pm2
            WHERE pm2.id_produit = p.id_produit
            ORDER BY pm2.ordre ASC, pm2.id_media ASC
          LIMIT 1
          )
        LEFT JOIN soldes s ON s.id_solde = (
          SELECT s2.id_solde
          FROM soldes s2
          WHERE s2.id_produit = p.id_produit
            AND s2.statut = 'active'
            AND NOW() BETWEEN s2.date_debut AND s2.date_fin
          ORDER BY s2.date_creation DESC, s2.id_solde DESC
          LIMIT 1
        )
        WHERE p.statut = 'en_ligne' And f.id_user = ?
        ORDER BY p.date_creation DESC ;
        
      `,[id]);

      return { produitsVedette: produitsVedette ?? [] };
    } catch (error) {
      console.error('Erreur getHomeData:', error);
      return { produitsVedette: [] };
    }
  }

  async addFavori(userId: number, produitId: number) {
    return this.create({ id_user: userId, id_produit: produitId });
  }

  async removeFavori(userId: number, produitId: number) {
    try {
      const result: any = await this.db.query(
        `DELETE FROM favoris WHERE id_user = ? AND id_produit = ?`,
        [userId, produitId],
      );

      return {
        success: true,
        deleted: result?.affectedRows > 0,
      };
    } catch (error) {
      console.error('Erreur lors de la suppression du favori :', error);
      return { success: false, error: 'Impossible de retirer le favori' };
    }
  }

  update(id: number, dto: Partial<CreateFavoriDto>) {
    // TODO: this.prisma.favoris.update({ where: { id }, data: dto })
    return { id, ...dto };
  }

  remove(id: number) {
    // TODO: this.prisma.favoris.delete({ where: { id } })
    return { id };
  }
}
