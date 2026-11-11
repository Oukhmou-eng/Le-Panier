import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAvisDto } from './dto/create-avis.dto';

@Injectable()
export class AvisService {
  constructor(private readonly prisma: PrismaService) {}

  async create(type_cible: string, id_cible: number, note: number, commentaire: string, id_user: number) {
    const avis = await this.prisma.avis.create({
      data: { id_cible, id_user, type_cible: type_cible as 'produit' | 'boutique', note, commentaire },
    });

    return {
      success: true,
      insertId: avis.id_avis,
    };
  }

  findAll() {
    return this.prisma.avis.findMany({ orderBy: { date_creation: 'desc' } });
  }

  findOne(id: number) {
    return this.prisma.avis.findUnique({ where: { id_avis: id } });
  }

  update(id: number, dto: Partial<CreateAvisDto>) {
    return this.prisma.avis.update({
      where: { id_avis: id },
      data: {
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.commentaire !== undefined && { commentaire: dto.commentaire }),
      },
    });
  }

  async remove(id: number) {
    await this.prisma.avis.delete({ where: { id_avis: id } });
    return { id };
  }
}
