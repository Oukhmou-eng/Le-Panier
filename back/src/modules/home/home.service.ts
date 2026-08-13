import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class HomeService {
  constructor(private readonly db: DatabaseService) {}

  async getHomeData(userId?: number) {
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
        INNER JOIN boutiques b ON b.id_boutique = p.id_boutique
        LEFT JOIN produit_medias pm ON pm.id_media = (
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
        WHERE p.statut = 'en_ligne'
        ORDER BY p.date_creation DESC;
      `);

      const rows = userId
        ? await this.db.query('SELECT id_produit FROM favoris WHERE id_user = ?', [userId]) as Array<{ id_produit: number }>
        : [];

      return {
        produitsVedette: produitsVedette ?? [],
        favoris: rows.map((favori) => favori.id_produit),
      };
    } catch (error) {
      console.error('Erreur getHomeData:', error);
      return { produitsVedette: [], favoris: [] };
    }
  }
}
