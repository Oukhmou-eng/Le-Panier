import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRevenuDto } from './dto/create-revenu.dto';

@Injectable()
export class RevenusService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateRevenuDto) {
    return this.prisma.revenus_vendeur.create({ data: { ...dto, statut: 'en_attente' } });
  }

  findAll() {
    return this.prisma.revenus_vendeur.findMany({ orderBy: { date: 'desc' } });
  }

  findOne(id: number) {
    return this.prisma.revenus_vendeur.findUnique({ where: { id_revenu: id } });
  }

  update(id: number, dto: Partial<CreateRevenuDto>) {
    return this.prisma.revenus_vendeur.update({ where: { id_revenu: id }, data: dto });
  }

  async remove(id: number) {
    await this.prisma.revenus_vendeur.delete({ where: { id_revenu: id } });
    return { id };
  }
}
