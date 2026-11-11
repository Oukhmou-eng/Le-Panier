import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UtilisateursService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUtilisateurDto) {
    const { prenom, nom, email, password, tele, role, statut } = dto;
    if (!prenom?.trim() || !nom?.trim() || !email?.trim() || !password) {
      throw new BadRequestException('Prénom, nom, email et mot de passe sont requis.');
    }
    const normalizedEmail = email.trim();
    if (await this.prisma.utilisateurs.findUnique({ where: { email: normalizedEmail }, select: { id_user: true } })) {
      throw new BadRequestException('Cet email est déjà utilisé.');
    }
    const normalizedRole = role?.toLowerCase() === 'admin' ? 'admin' : 'user';
    const normalizedStatut = statut === 'suspendu' ? 'suspendu' : 'actif';
    const user = await this.prisma.utilisateurs.create({
      data: { nom: nom.trim(), prenom: prenom.trim(), email: normalizedEmail, password: await bcrypt.hash(password, 10), tele: tele?.trim() || null, role: normalizedRole, statut: normalizedStatut },
    });
    return { id_user: user.id_user, prenom: user.prenom, nom: user.nom, email: user.email, tele: user.tele, role: user.role, statut: user.statut };
  }

  async par(id: number) {
    try {
      const user = await this.prisma.utilisateurs.findUnique({
        where: { id_user: id },
        select: { prenom: true, nom: true, email: true, tele: true, logo_url: true, adresses: { take: 1, select: { ville: true, ligne1: true, code_postal: true } } },
      });
      if (!user) return { user: null };
      const adresse = user.adresses[0];
      return { user: { prenom: user.prenom, nom: user.nom, email: user.email, tele: user.tele, logo_url: user.logo_url, ville: adresse?.ville ?? null, adresse: adresse?.ligne1 ?? null, code_postal: adresse?.code_postal ?? null } };
    } catch (error) {
      console.error(error);
      return { msg: 'Erreur' };
    }
  }

  findAll() {
    return this.findAllAdmin();
  }

  async findAllAdmin(search = '', role = '', statut = '') {
    const normalizedRole = role ? (role.toLowerCase() === 'admin' ? 'admin' : 'user') : undefined;
    const normalizedStatut = statut ? (statut === 'suspendu' ? 'suspendu' : 'actif') : undefined;
    const users = await this.prisma.utilisateurs.findMany({
      where: {
        ...(search.trim() ? { OR: [{ prenom: { contains: search.trim() } }, { nom: { contains: search.trim() } }, { email: { contains: search.trim() } }] } : {}),
        ...(normalizedRole ? { role: normalizedRole } : {}),
        ...(normalizedStatut ? { statut: normalizedStatut } : {}),
      },
      orderBy: { date_creation: 'desc' },
      select: { id_user: true, prenom: true, nom: true, email: true, tele: true, logo_url: true, role: true, statut: true, date_creation: true },
    });
    return { users };
  }

  findOne(id: number) {
    return this.prisma.utilisateurs.findUnique({ where: { id_user: id } });
  }

  async updateMe(id: number, dto: Partial<CreateUtilisateurDto>) {
    const { prenom, nom, email, tele, adresse, ville, code_postal } = dto;
    await this.prisma.$transaction(async (tx) => {
      await tx.utilisateurs.update({ where: { id_user: id }, data: { prenom: prenom ?? undefined, nom: nom ?? undefined, email: email ?? undefined, tele: tele ?? undefined } });
      const existingAddress = await tx.adresses.findFirst({ where: { id_user: id }, select: { id_adresse: true } });
      const addressData = { ligne1: adresse ?? '', ville: ville ?? '', code_postal: code_postal ?? '' };
      if (existingAddress) await tx.adresses.update({ where: { id_adresse: existingAddress.id_adresse }, data: addressData });
      else await tx.adresses.create({ data: { id_user: id, ...addressData } });
    });
    return this.par(id);
  }

  async updatePassword(id: number, motDePasseActuel: string, nouveauMotDePasse: string) {
    if (!motDePasseActuel || nouveauMotDePasse.length < 8) throw new BadRequestException('Le nouveau mot de passe doit contenir au moins 8 caractères.');
    const user = await this.prisma.utilisateurs.findUnique({ where: { id_user: id }, select: { password: true } });
    if (!user || !(await bcrypt.compare(motDePasseActuel, user.password))) throw new UnauthorizedException('Le mot de passe actuel est incorrect.');
    await this.prisma.utilisateurs.update({ where: { id_user: id }, data: { password: await bcrypt.hash(nouveauMotDePasse, 10) } });
    return { message: 'Mot de passe mis à jour avec succès.' };
  }

  async updateLogoUrl(id: number, logoUrl: string | null) {
    await this.prisma.utilisateurs.update({ where: { id_user: id }, data: { logo_url: logoUrl } });
    return this.par(id);
  }

  async updateRoleByAdmin(id: number, role: string) {
    const normalizedRole = role?.toLowerCase() === 'admin' ? 'admin' : 'user';
    const result = await this.prisma.utilisateurs.updateMany({ where: { id_user: id }, data: { role: normalizedRole } });
    return { success: result.count > 0, role: normalizedRole };
  }

  async updateStatutByAdmin(id: number, statut: string) {
    const normalizedStatut = statut === 'suspendu' ? 'suspendu' : 'actif';
    const result = await this.prisma.utilisateurs.updateMany({ where: { id_user: id }, data: { statut: normalizedStatut } });
    return { success: result.count > 0, statut: normalizedStatut };
  }

  async update(id: number, dto: Partial<CreateUtilisateurDto>) {
    const { prenom, nom, email, tele, role, statut } = dto;
    return this.prisma.utilisateurs.update({
      where: { id_user: id },
      data: {
        prenom: prenom ?? undefined,
        nom: nom ?? undefined,
        email: email ?? undefined,
        tele: tele ?? undefined,
        role: role ? (role === 'admin' ? 'admin' : 'user') : undefined,
        statut: statut ? (statut === 'suspendu' ? 'suspendu' : 'actif') : undefined,
      },
    });
  }

  remove(id: number) {
    return this.prisma.utilisateurs.delete({ where: { id_user: id } });
  }
}
