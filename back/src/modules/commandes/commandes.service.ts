import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CarteSimuleeDto, CreateCommandeDto } from './dto/create-commande.dto';

@Injectable()
export class CommandesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateCommandeDto) {
    return this.prisma.$transaction(async (tx) => {
      const items = await tx.panier_items.findMany({
        where: { id_user: userId, est_enregistre: false },
        include: { produits: { include: { soldes: { where: { statut: 'active', date_debut: { lte: new Date() }, date_fin: { gte: new Date() } }, orderBy: { id_solde: 'desc' }, take: 1 } } } },
      });
      if (!items.length) throw new BadRequestException('Panier vide');
      for (const item of items) {
        if (item.quantite < 1 || item.produits.statut !== 'en_ligne' || item.quantite > item.produits.stock) {
          throw new BadRequestException(`Stock insuffisant ou produit indisponible : ${item.id_produit}`);
        }
      }

      let adresseId = dto.id_adresse;
      if (adresseId) {
        const adresse = await tx.adresses.findFirst({ where: { id_adresse: adresseId, id_user: userId } });
        if (!adresse) throw new BadRequestException('Adresse de livraison introuvable');
      } else if (dto.adresse) {
        const adresse = await tx.adresses.create({ data: { id_user: userId, libelle: dto.adresse.libelle?.trim() || null, ligne1: dto.adresse.ligne1.trim(), ville: dto.adresse.ville.trim(), code_postal: dto.adresse.code_postal.trim(), tele: dto.adresse.tele.trim() } });
        adresseId = adresse.id_adresse;
      }
      if (!adresseId) throw new BadRequestException('Adresse de livraison requise');

      const lignes = items.map((item) => {
        const solde = item.produits.soldes[0];
        const prix = solde && Number(solde.prix_promo) < Number(item.produits.prix) ? solde.prix_promo : item.produits.prix;
        return { item, prix, sousTotal: Number(prix) * item.quantite };
      });
      const sousTotal = lignes.reduce((total, ligne) => total + ligne.sousTotal, 0);
      const fraisLivraison = sousTotal >= 700 ? 0 : 25;
      const montantTotal = sousTotal + fraisLivraison;
      const paiementMoyenId = await this.createSimulatedPaymentMethod(tx, userId, dto.paiement);
      const commande = await tx.commandes.create({ data: { id_user: userId, id_adresse: adresseId, montant_total: montantTotal } });

      for (const ligne of lignes) {
        const updated = await tx.produits.updateMany({ where: { id_produit: ligne.item.id_produit, statut: 'en_ligne', stock: { gte: ligne.item.quantite } }, data: { stock: { decrement: ligne.item.quantite } } });
        if (!updated.count) throw new BadRequestException(`Stock insuffisant pour le produit ${ligne.item.id_produit}`);
        await tx.commande_lignes.create({ data: { id_commande: commande.id_commande, id_produit: ligne.item.id_produit, id_boutique: ligne.item.produits.id_boutique, quantite: ligne.item.quantite, prix_unitaire: ligne.prix, sous_total: ligne.sousTotal } });
      }
      const reference = `SIMU-${randomUUID()}`;
      await tx.paiements.create({ data: { id_commande: commande.id_commande, id_moyen_paiement: paiementMoyenId, montant: montantTotal, methode: dto.paiement.methode, fournisseur: dto.paiement.fournisseur ?? (dto.paiement.methode === 'carte' ? 'simulation' : 'livraison'), statut: 'valide', reference_transaction: reference } });
      await tx.panier_items.deleteMany({ where: { id_user: userId, est_enregistre: false } });
      return { success: true, id_commande: commande.id_commande, reference_transaction: reference, sous_total: sousTotal, frais_livraison: fraisLivraison, montant_total: montantTotal };
    });
  }

  private async createSimulatedPaymentMethod(tx: Prisma.TransactionClient, userId: number, paiement: CreateCommandeDto['paiement']) {
    if (paiement.methode === 'cod') return null;
    const numero = (paiement.carte as CarteSimuleeDto).numero.replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(numero) || !this.isValidCardNumber(numero)) throw new BadRequestException('Numéro de carte bancaire invalide');
    const [month, year] = (paiement.carte as CarteSimuleeDto).expiration.split('/').map(Number);
    const expiration = new Date(2000 + year, month, 0);
    if (expiration < new Date(new Date().getFullYear(), new Date().getMonth(), 1)) throw new BadRequestException('Carte bancaire expirée');
    const moyen = await tx.moyens_paiement.create({ data: { id_user: userId, fournisseur: paiement.fournisseur ?? 'simulation', type: 'carte', jeton_paiement: `sim_${randomUUID()}`, derniers_chiffres: numero.slice(-4), date_expiration: new Date(expiration.getFullYear(), expiration.getMonth(), 1) } });
    return moyen.id_moyen_paiement;
  }

  private isValidCardNumber(numero: string) { let sum = 0; let double = false; for (let i = numero.length - 1; i >= 0; i--) { let digit = +numero[i]; if (double && (digit *= 2) > 9) digit -= 9; sum += digit; double = !double; } return sum % 10 === 0; }

  async getStatistics(user: { id_user: number; id_boutique?: number }, periode = 7) {
    const boutiqueId = await this.resolveBoutiqueId(user);
    if (!boutiqueId) throw new ForbiddenException('Aucune boutique associée à cet utilisateur.');
    const end = new Date(); end.setHours(23, 59, 59, 999); const start = new Date(end); start.setDate(start.getDate() - periode + 1); start.setHours(0, 0, 0, 0);
    const previousStart = new Date(start); previousStart.setDate(previousStart.getDate() - periode); const previousEnd = new Date(start.getTime() - 1);
    const lignes = await this.prisma.commande_lignes.findMany({ where: { id_boutique: boutiqueId, commandes: { statut: { in: ['confirmee', 'expediee', 'livree'] }, date_commande: { gte: previousStart, lte: end } } }, include: { commandes: true, produits: { select: { nom: true } } } });
    const current = lignes.filter((l) => l.commandes.date_commande >= start);
    const previous = lignes.filter((l) => l.commandes.date_commande <= previousEnd);
    const ventesTotales = current.reduce((s, l) => s + Number(l.sous_total), 0); const ventesAvant = previous.reduce((s, l) => s + Number(l.sous_total), 0);
    const byDay = new Map<string, number>(); current.forEach((l) => { const k = l.commandes.date_commande.toISOString().slice(0, 10); byDay.set(k, (byDay.get(k) ?? 0) + Number(l.sous_total)); });
    const top = new Map<string, { ventes: number; revenus: number }>(); current.forEach((l) => { const v = top.get(l.produits.nom) ?? { ventes: 0, revenus: 0 }; v.ventes += 1; v.revenus += Number(l.sous_total); top.set(l.produits.nom, v); });
    return { resume: { ventesTotales, deltaVentes: ventesAvant ? Math.round(((ventesTotales - ventesAvant) / ventesAvant) * 100) : ventesTotales ? 100 : 0, commandesTotales: new Set(current.map((l) => l.id_commande)).size, articlesVendus: current.reduce((s, l) => s + l.quantite, 0) }, ventesParJour: Array.from({ length: periode }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return { jour: periode <= 7 ? d.toLocaleDateString('fr-FR', { weekday: 'short' }) : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), ventes: byDay.get(d.toISOString().slice(0, 10)) ?? 0 }; }), topProduits: [...top].map(([produit, v]) => ({ produit, ...v })).sort((a, b) => b.revenus - a.revenus).slice(0, 10) };
  }

  private async resolveBoutiqueId(user: { id_user: number; id_boutique?: number }) { return user.id_boutique ?? (await this.prisma.boutiques.findFirst({ where: { id_user: user.id_user }, select: { id_boutique: true } }))?.id_boutique ?? null; }
  async findByUser(userId: number) { const orders = await this.prisma.commandes.findMany({ where: { id_user: userId }, orderBy: [{ date_commande: 'desc' }, { id_commande: 'desc' }], include: { commande_lignes: { take: 1, include: { produits: { include: { produit_medias: { orderBy: [{ ordre: 'asc' }, { id_media: 'asc' }], take: 1 } } }, boutiques: true } } } }); return { commandes: orders.map((c) => { const l = c.commande_lignes[0]; return { ...c, produit_nom: l?.produits.nom ?? null, id_produit: l?.id_produit ?? null, boutique_nom: l?.boutiques.nom ?? null, image_url: l?.produits.produit_medias[0]?.url ?? null }; }) }; }
  async findByBoutique(boutiqueId: number, currentUserId?: number) { const boutique = await this.prisma.boutiques.findUnique({ where: { id_boutique: boutiqueId } }); if (!boutique) return { commandes: [] }; if (currentUserId && boutique.id_user !== currentUserId) throw new ForbiddenException('Accès interdit à cette boutique.'); const lines = await this.prisma.commande_lignes.findMany({ where: { id_boutique: boutiqueId }, include: { commandes: { include: { utilisateurs: { select: { nom: true, prenom: true } } } }, produits: true, boutiques: true }, orderBy: { commandes: { date_commande: 'desc' } } }); return { commandes: lines.map((l) => ({ ...l.commandes, produit_nom: l.produits.nom, id_produit: l.id_produit, boutique_nom: l.boutiques.nom, client_nom: l.commandes.utilisateurs.nom, client_prenom: l.commandes.utilisateurs.prenom })) }; }
  findAll() { return this.prisma.commandes.findMany(); }
  findOne(id: number) { return this.prisma.commandes.findUnique({ where: { id_commande: id }, include: { commande_lignes: true, paiements: true } }); }
  async updateStatusForBoutique(id: number, userId: number, statut?: string) { const allowed = ['en_attente', 'confirmee', 'expediee', 'livree', 'annulee', 'remboursee']; if (!statut || !allowed.includes(statut)) throw new BadRequestException('Statut invalide.'); const line = await this.prisma.commande_lignes.findFirst({ where: { id_commande: id, boutiques: { id_user: userId } } }); if (!line) throw new NotFoundException('Commande introuvable pour votre boutique.'); await this.prisma.commandes.update({ where: { id_commande: id }, data: { statut: statut as any } }); return { id_commande: id, statut }; }
  async remove(id: number) { await this.prisma.commandes.delete({ where: { id_commande: id } }); return { id }; }
}
