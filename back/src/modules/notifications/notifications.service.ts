import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notifications.create({
      data: { id_user: dto.id_user, type: dto.type, contenu: dto.contenu, lien: dto.lien ?? null, lu: dto.lu ?? false },
    });
  }

  async findAll() {
    return this.prisma.notifications.findMany({ orderBy: [{ date_creation: 'desc' }, { id_notification: 'desc' }] });
  }

  async getNotifications(id: number) {
    try {
      const notifications = await this.prisma.notifications.findMany({
        where: { id_user: id },
        orderBy: [{ date_creation: 'desc' }, { id_notification: 'desc' }],
      });

      return { notifications: notifications ?? [] };
    } catch (error) {
      console.error('Erreur getNotifications:', error);
      return { notifications: [] };
    }
  }

  async findOne(id: number) {
    return this.prisma.notifications.findUnique({ where: { id_notification: id } });
  }

  async update(id: number, dto: Partial<CreateNotificationDto>) {
    const data = Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined));
    if (!Object.keys(data).length) return this.findOne(id);
    return this.prisma.notifications.update({ where: { id_notification: id }, data });
  }

  async markAllAsRead(userId: number) {
    const result = await this.prisma.notifications.updateMany({ where: { id_user: userId, lu: false }, data: { lu: true } });
    return { success: true, updated: result.count };
  }

  async markAsRead(userId: number, notificationId: number) {
    const result = await this.prisma.notifications.updateMany({ where: { id_notification: notificationId, id_user: userId }, data: { lu: true } });
    return { success: result.count > 0 };
  }

  async remove(id: number) {
    const result = await this.prisma.notifications.deleteMany({ where: { id_notification: id } });
    return { success: result.count > 0 };
  }
}
