import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';

@Injectable()
export class PaiementsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePaiementDto) {
    return this.prisma.paiements.create({ data: { ...dto, statut: 'en_attente' } });
  }

  findAll() {
    return this.prisma.paiements.findMany({ orderBy: { date_paiement: 'desc' } });
  }

  findOne(id: number) {
    return this.prisma.paiements.findUnique({ where: { id_paiement: id } });
  }

  update(id: number, dto: Partial<CreatePaiementDto>) {
    return this.prisma.paiements.update({ where: { id_paiement: id }, data: dto });
  }

  async remove(id: number) {
    await this.prisma.paiements.delete({ where: { id_paiement: id } });
    return { id };
  }
}
