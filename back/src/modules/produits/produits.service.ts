import { BadRequestException, Injectable } from '@nestjs/common';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { CreateProduitDto } from './dto/create-produit.dto';
import { CreateSoldeDto } from './dto/create-solde.dto';
import { DatabaseService } from '../../database/database.service';


@Injectable()
export class ProduitsService {
  constructor(private readonly db: DatabaseService) {}

  async create(
    dto: CreateProduitDto,
    medias: Array<{ type: 'image' | 'video'; url: string; ordre: number }>,
    idUser: number,
  ) {
    const connection = await this.db.getPool().getConnection();

    try {
      await connection.beginTransaction();
      const [boutiques] = await connection.execute<(RowDataPacket & { id_boutique: number })[]>(
        `SELECT id_boutique FROM boutiques WHERE id_user = ? AND statut = 'actif'
         ORDER BY date_creation ASC LIMIT 1`,
        [idUser],
      );
      if (!boutiques.length) throw new BadRequestException('Créez d’abord une boutique active avant de publier un produit.');

      const selectedCategory = String(dto.categorie).trim();
      const [categories] = await connection.execute<(RowDataPacket & { id_categorie: number })[]>(
        'SELECT id_categorie FROM categories WHERE LOWER(nom) = LOWER(?) OR id_categorie = ? LIMIT 1',
        [selectedCategory, selectedCategory],
      );
      if (!categories.length) throw new BadRequestException('La catégorie sélectionnée est introuvable.');

      const [produitResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO produits (id_boutique, id_categorie, nom, description, prix, stock, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [boutiques[0].id_boutique, categories[0].id_categorie, dto.nom.trim(), dto.description?.trim() || null, dto.prix, dto.stock, dto.statut || 'en_ligne'],
      );
      const idProduit = produitResult.insertId;
      for (const media of medias) {
        await connection.execute(
          'INSERT INTO produit_medias (id_produit, type, url, ordre) VALUES (?, ?, ?, ?)',
          [idProduit, media.type, media.url, media.ordre],
        );
      }

      await connection.commit();
      return { id_produit: idProduit, id_boutique: boutiques[0].id_boutique, statut: dto.statut || 'en_ligne', medias };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  findAll() {
    // TODO: this.prisma.produits.findMany()
    return [];
  }

  async getMesProduits(id: number) {
    try {
      const produits = await this.db.query(
        `SELECT
          p.id_produit,
          p.nom,
          p.prix,
          p.stock,
          p.statut,
          p.id_categorie,
          c.nom AS categorie_nom,
          b.nom AS boutique_nom,
          pm.url AS image_url,
          COALESCE(SUM(cl.quantite), 0) AS ventes
        FROM produits p
        INNER JOIN boutiques b ON b.id_boutique = p.id_boutique
        LEFT JOIN categories c ON c.id_categorie = p.id_categorie
        LEFT JOIN produit_medias pm ON pm.id_media = (
          SELECT pm2.id_media
          FROM produit_medias pm2
          WHERE pm2.id_produit = p.id_produit
          ORDER BY pm2.ordre ASC, pm2.id_media ASC
          LIMIT 1
        )
        LEFT JOIN commande_lignes cl ON cl.id_produit = p.id_produit
        WHERE p.id_boutique = ?
        GROUP BY p.id_produit, p.nom, p.prix, p.stock, p.statut, p.id_categorie,
                 c.nom, b.nom, pm.url
        ORDER BY p.date_creation DESC, p.id_produit DESC`,
        [id],
      );

      return { produits: produits ?? [] };
    } catch (error) {
      console.error('Erreur getMesProduits:', error);
      return { produits: [] };
    }
  }

  async findOne(id: number) {
    try {
      const produits = await this.db.query(
        `
        SELECT
          p.id_produit,
          p.nom,
          p.description,
          p.prix,
          p.stock,
          p.statut,
          p.id_boutique,
          p.id_categorie,
          c.nom AS categorie_nom,
          b.nom AS boutique_nom,
          s.type_reduction,
          s.valeur_reduction,
          s.prix_promo AS prix_promo,
          s.date_debut AS date_debut,
          s.date_fin AS date_fin
        FROM produits p
        INNER JOIN boutiques b
          ON b.id_boutique = p.id_boutique
        LEFT JOIN categories c
          ON c.id_categorie = p.id_categorie
        LEFT JOIN soldes s
          ON s.id_produit = p.id_produit
          AND s.statut = 'active'
          AND s.date_debut <= NOW()
          AND s.date_fin >= NOW()
        WHERE p.id_produit = ?
        LIMIT 1
        `,
        [id],
      );

      if (produits.length === 0) {
        return null;
      }

      const medias = await this.db.query(
        `
        SELECT
          type,
          url,
          ordre
        FROM produit_medias
        WHERE id_produit = ?
        ORDER BY ordre ASC, id_media ASC
        `,
        [id],
      );

      return {
        ...produits[0],
        medias,
      };
    } catch (error) {
      console.error('Erreur findOne :', error);
      throw error;
    }
  }

  async update(id: number, dto: Partial<CreateProduitDto>, medias: Array<{ type: 'image' | 'video'; url: string; ordre: number }> = [], idUser?: number) {
    const connection = await this.db.getPool().getConnection();
    try {
      await connection.beginTransaction();

      if (typeof idUser === 'number') {
        const [ownedBoutiques] = await connection.execute<(RowDataPacket & { id_boutique: number })[]>(
          `SELECT p.id_boutique FROM produits p
           INNER JOIN boutiques b ON b.id_boutique = p.id_boutique
           WHERE p.id_produit = ? AND b.id_user = ? LIMIT 1`,
          [id, idUser],
        );
        if (!ownedBoutiques.length) {
          throw new BadRequestException('Produit introuvable ou accès non autorisé.');
        }
      }

      const updates: string[] = [];
      const params: Array<string | number | null> = [];

      if (dto.nom !== undefined) {
        updates.push('nom = ?');
        params.push(dto.nom.trim());
      }
      if (dto.description !== undefined) {
        updates.push('description = ?');
        params.push(dto.description?.trim() || null);
      }
      if (dto.prix !== undefined) {
        updates.push('prix = ?');
        params.push(dto.prix);
      }
      if (dto.stock !== undefined) {
        updates.push('stock = ?');
        params.push(dto.stock);
      }
      if (dto.statut !== undefined) {
        updates.push('statut = ?');
        params.push(dto.statut);
      }
      if (dto.categorie !== undefined) {
        const selectedCategory = String(dto.categorie).trim();
        const [categories] = await connection.execute<(RowDataPacket & { id_categorie: number })[]>(
          'SELECT id_categorie FROM categories WHERE LOWER(nom) = LOWER(?) OR id_categorie = ? LIMIT 1',
          [selectedCategory, selectedCategory],
        );
        if (!categories.length) {
          throw new BadRequestException('La catégorie sélectionnée est introuvable.');
        }
        updates.push('id_categorie = ?');
        params.push(categories[0].id_categorie);
      }

      if (updates.length > 0) {
        params.push(id);
        await connection.execute(
          `UPDATE produits SET ${updates.join(', ')} WHERE id_produit = ?`,
          params,
        );
      }

      if (medias.length) {
        const [existing] = await connection.execute<(RowDataPacket & { maxOrdre: number })[]>(
          'SELECT MAX(ordre) AS maxOrdre FROM produit_medias WHERE id_produit = ?',
          [id],
        );
        let nextOrdre = existing?.[0]?.maxOrdre ?? -1;
        for (const media of medias) {
          nextOrdre += 1;
          await connection.execute(
            'INSERT INTO produit_medias (id_produit, type, url, ordre) VALUES (?, ?, ?, ?)',
            [id, media.type, media.url, nextOrdre],
          );
        }
      }

      await connection.commit();
      return this.findOne(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async remove(id: number) {
    try {
      const result: any = await this.db.query(
        `DELETE FROM produits WHERE id_produit = ?`,
        [id],
      );
      return { success: result?.affectedRows > 0 };
    } catch (error) {
      console.error('Erreur lors de la suppression du produit :', error);
      return { success: false, error: 'Impossible de supprimer le produit' };
    }
  }







  async signaler(id: number, motif: string, description: string, idUser: number) {
    try {
      await this.db.query(
        `
        INSERT INTO signalements (id_user, type_cible, id_cible, motif, description, date_creation, statut)
        VALUES (?, 'produit', ?, ?, ?, NOW(), 'en_cours')
        `,
        [idUser, id, motif, description],
      );

      return { success: true, message: 'Signalement envoyé avec succès.' };
    } catch (error) {
      console.error('Erreur signaler produit:', error);
      return { success: false, message: "Une erreur est survenue lors de l'envoi du signalement." };
    }
  }

async getAvis(id: number) {
  try {
    const avis = await this.db.query(
      `
      SELECT U.nom,U.prenom,U.logo_url, A.commentaire, A.note FROM  avis A JOIN utilisateurs U ON A.id_user = U.id_user WHERE A.type_cible = 'produit' AND A.id_cible = ?
      `,
      [id]
    );
    return { avis: avis ?? []  };
  } catch (error) {
    console.error('Erreur getAvis:', error);
    return { avis: [] };
  }
}





async findSimilarProducts(shopId: number, idCategorie: number) {
  try {
    const produitsVedette = await this.db.query(
      `
      SELECT
        p.id_produit,
        p.nom,
        p.prix,
        b.nom AS boutique_nom,
        pm.url,
        pm.type
      FROM produits p
      INNER JOIN boutiques b
        ON b.id_boutique = p.id_boutique
      INNER JOIN categories c
        ON c.id_categorie = p.id_categorie
      LEFT JOIN produit_medias pm
        ON pm.id_media = (
          SELECT pm2.id_media
          FROM produit_medias pm2
          WHERE pm2.id_produit = p.id_produit
          ORDER BY pm2.ordre ASC, pm2.id_media ASC
          LIMIT 1
        )
      WHERE
        p.statut = 'en_ligne'
        AND (p.id_boutique = ? OR c.id_categorie = ?)
      ORDER BY p.date_creation DESC
      LIMIT 5
      `,
      [shopId, idCategorie],
    );

    return { produitsVedette: produitsVedette ?? [] };
  } catch (error) {
    console.error('Erreur findSimilarProducts:', error);
    return { produitsVedette: [] };
  }
}




  async createSolde(idProduit: number, dto: CreateSoldeDto, idUser?: number) {
    const connection = await this.db.getPool().getConnection();
    try {
      await connection.beginTransaction();

      if (typeof idUser !== 'number') {
        throw new BadRequestException('Utilisateur non authentifié.');
      }

      const [owned] = await connection.execute<(RowDataPacket & { id_boutique: number })[]>(
        `SELECT p.id_boutique FROM produits p
         INNER JOIN boutiques b ON b.id_boutique = p.id_boutique
         WHERE p.id_produit = ? AND b.id_user = ? LIMIT 1`,
        [idProduit, idUser],
      );
      if (!owned.length) throw new BadRequestException('Produit introuvable ou accès non autorisé.');

      const debut = new Date(dto.date_debut);
      const fin = new Date(dto.date_fin);
      if (isNaN(debut.getTime()) || isNaN(fin.getTime()) || debut >= fin) {
        throw new BadRequestException('Dates invalides pour le solde.');
      }

      if (dto.prix_promo < 0 || dto.valeur_reduction < 0) {
        throw new BadRequestException('Valeurs de réduction invalides.');
      }

      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO soldes (id_produit, type_reduction, valeur_reduction, prix_promo, date_debut, date_fin, statut)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [idProduit, dto.type_reduction, dto.valeur_reduction, dto.prix_promo, dto.date_debut, dto.date_fin],
      );

      await connection.commit();
      return { id_solde: result.insertId, id_produit: idProduit, statut: 'en_attente' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

}
