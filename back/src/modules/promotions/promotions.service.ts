import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { CreatePlanTarifDto } from './dto/create-plan-tarif.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePlanTarifDto } from './dto/update-plan-tarif.dto';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  findPlans() {
    return this.prisma.plans_tarifs.findMany({
      where: { type_cible: 'produit', statut: 'actif' },
      orderBy: [{ priorite: 'desc' }, { prix: 'asc' }],
      select: { id: true, nom_plan: true, type_cible: true, duree_jours: true, prix: true, priorite: true, statut: true },
    });
  }

  adminFindPlans() {
    return this.prisma.plans_tarifs.findMany({ orderBy: [{ priorite: 'desc' }, { prix: 'asc' }] });
  }

  async adminFindFactures() {
    const factures = await this.prisma.factures_boutique.findMany({
      orderBy: { date_facture: 'desc' },
      include: { boutiques: { select: { nom: true, slug: true } }, moyens_paiement: { select: { fournisseur: true } } },
    });
    return factures.map(({ boutiques, moyens_paiement, ...facture }) => ({
      ...facture,
      boutique_nom: boutiques.nom,
      boutique_slug: boutiques.slug,
      paiement_fournisseur: moyens_paiement.fournisseur,
    }));
  }

  findPlanById(id: number) {
    return this.prisma.plans_tarifs.findUnique({ where: { id } });
  }

  createPlan(dto: CreatePlanTarifDto, adminId: number) {
    return this.prisma.plans_tarifs.create({ data: { ...dto, modifie_par: adminId } });
  }

  updatePlan(id: number, dto: UpdatePlanTarifDto, adminId: number) {
    return this.prisma.plans_tarifs.update({ where: { id }, data: { ...dto, modifie_par: adminId, date_maj: new Date() } });
  }

  updatePlanStatut(id: number, statut: string, adminId: number) {
    return this.prisma.plans_tarifs.update({
      where: { id },
      data: { statut: statut === 'inactif' ? 'inactif' : 'actif', modifie_par: adminId, date_maj: new Date() },
    });
  }

  async create(dto: CreatePromotionDto, idUser: number) {
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.plans_tarifs.findUnique({ where: { id: dto.plan_tarif_id } });
      if (!plan) throw new NotFoundException('Plan tarifaire introuvable.');

      const produit = await tx.produits.findUnique({
        where: { id_produit: dto.id_produit },
        include: { boutiques: { select: { id_user: true } } },
      });
      if (!produit) throw new NotFoundException('Produit introuvable.');
      if (produit.boutiques.id_user !== idUser) {
        throw new BadRequestException("Vous ne pouvez pas promouvoir un produit qui n'appartient pas à votre boutique.");
      }

      let moyenPaiementId = dto.moyen_paiement_id;
      if (!moyenPaiementId) {
        const moyen = await tx.moyens_paiement.create({
          data: {
            id_user: idUser,
            fournisseur: 'simulated',
            type: 'carte',
            jeton_paiement: `tok_${randomUUID()}`,
            derniers_chiffres: dto.card_number?.slice(-4) ?? null,
            date_expiration: this.parseExpiration(dto.card_expiration),
          },
        });
        moyenPaiementId = moyen.id_moyen_paiement;
      }

      const now = new Date();
      const dateFin = new Date(now.getTime() + plan.duree_jours * 24 * 60 * 60 * 1000);
      const facture = await tx.factures_boutique.create({
        data: {
          boutique_id: produit.id_boutique,
          type_facture: (dto.type_facture ?? 'promotion') as 'publicite' | 'promotion' | 'abonnement',
          reference_id: dto.reference_id ?? dto.id_produit,
          moyen_paiement_id: moyenPaiementId,
          montant: plan.prix,
          statut: 'paye',
          reference_transaction: dto.reference_transaction ?? `tx_${randomUUID()}`,
          date_facture: now,
          date_paiement: now,
        },
      });
      const promotion = await tx.promouvoir.create({
        data: {
          id_produit: dto.id_produit,
          plan: plan.nom_plan,
          plan_tarif_id: plan.id,
          priorite: dto.priorite ?? plan.priorite ?? 0,
          date_debut: now,
          date_fin: dateFin,
          statut: 'active',
        },
      });
      return { id_promotion: promotion.id_promotion, id_facture: facture.id, statut: 'active', date_debut: now, date_fin: dateFin };
    });
  }

  findAll() {
    return this.prisma.promouvoir.findMany({ orderBy: { date_creation: 'desc' } });
  }

  async findActive() {
    const promotions = await this.prisma.promouvoir.findMany({
      where: { statut: 'active', date_debut: { lte: new Date() }, date_fin: { gte: new Date() } },
      orderBy: [{ priorite: 'desc' }, { date_fin: 'asc' }],
      include: { produits: { select: { nom: true } }, plans_tarifs: { select: { nom_plan: true, prix: true } } },
    });
    return promotions.map(({ produits, plans_tarifs, ...promotion }) => ({
      ...promotion,
      produit_nom: produits.nom,
      nom_plan: plans_tarifs?.nom_plan ?? null,
      plan_prix: plans_tarifs?.prix ?? null,
    }));
  }

  findOne(id: number) {
    return this.prisma.promouvoir.findUnique({ where: { id_promotion: id } });
  }

  update(id: number, dto: Partial<CreatePromotionDto>) {
    return this.prisma.promouvoir.update({
      where: { id_promotion: id },
      data: {
        ...(dto.plan_tarif_id !== undefined && { plan_tarif_id: dto.plan_tarif_id }),
        ...(dto.priorite !== undefined && { priorite: dto.priorite }),
        ...(dto.date_debut !== undefined && { date_debut: new Date(dto.date_debut) }),
        ...(dto.date_fin !== undefined && { date_fin: new Date(dto.date_fin) }),
      },
    });
  }

  async remove(id: number) {
    await this.prisma.promouvoir.delete({ where: { id_promotion: id } });
    return { id };
  }

  private parseExpiration(value?: string): Date | null {
    if (!value) return null;
    const [month, year] = value.split('/').map((part) => part.trim());
    if (!month || !year) return null;
    const normalizedYear = year.length === 2 ? `20${year}` : year;
    const result = new Date(`${normalizedYear}-${month.padStart(2, '0')}-01T00:00:00`);
    return Number.isNaN(result.getTime()) ? null : result;
  }
}
