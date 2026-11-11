import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { messages_type_message } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

interface CreateMessagePayload {
  id_conversation?: number;
  id_boutique?: number;
  contenu: string;
  type_message?: string;
  id_produit?: number;
}

@Injectable()
export class MessagerieService {
  constructor(private readonly prisma: PrismaService) {}

  async getConversations(userId: number, boutiqueId: number | null) {
    const isBoutiqueView = Boolean(boutiqueId);
    const conversations = await this.prisma.conversations.findMany({
      where: isBoutiqueView ? { id_boutique: boutiqueId as number } : { id_user: userId },
      include: {
        boutiques: { select: { nom: true, logo_url: true } },
        utilisateurs: { select: { nom: true, prenom: true, logo_url: true } },
        messages: {
          orderBy: [{ date_creation: 'desc' }, { id_message: 'desc' }],
          take: 1,
          include: { messages_statuts: { where: { id_user: userId }, select: { statut: true } } },
        },
      },
    });

    return conversations
      .filter((conversation) => conversation.messages[0])
      .map((conversation) => {
        const message = conversation.messages[0];
        return {
          id_conversation: conversation.id_conversation,
          autre_partie_nom: isBoutiqueView ? `${conversation.utilisateurs.nom} ${conversation.utilisateurs.prenom}` : conversation.boutiques.nom,
          autre_partie_avatar: isBoutiqueView ? conversation.utilisateurs.logo_url : conversation.boutiques.logo_url,
          dernier_message: message.contenu,
          dernier_message_date: message.date_creation,
          non_lus: message.messages_statuts[0]?.statut !== 'lu' ? 1 : 0,
          en_ligne: false,
        };
      });
  }

  async getMessages(conversationId: number, userId: number, boutiqueId: number | null) {
    await this.validateConversationAccess(conversationId, userId, boutiqueId);
    const messages = await this.prisma.messages.findMany({
      where: { id_conversation: conversationId },
      orderBy: [{ date_creation: 'asc' }, { id_message: 'asc' }],
      include: {
        messages_statuts: { where: { id_user: userId }, select: { statut: true } },
        messages_pieces_jointes: true,
        produits: {
          select: {
            id_produit: true,
            nom: true,
            prix: true,
            produit_medias: {
              orderBy: [{ ordre: 'asc' }, { id_media: 'asc' }],
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });
    return messages.map(({ messages_statuts, messages_pieces_jointes, produits, ...message }) => ({
      ...message,
      statut_lecture: messages_statuts[0]?.statut ?? 'envoye',
      pieces_jointes: messages_pieces_jointes,
      produit: produits ? {
        id: produits.id_produit,
        nom: produits.nom,
        prix: produits.prix,
        image_url: produits.produit_medias[0]?.url ?? null,
      } : null,
    }));
  }

  async markConversationAsRead(conversationId: number, userId: number, boutiqueId: number | null) {
    await this.validateConversationAccess(conversationId, userId, boutiqueId);
    const messages = await this.prisma.messages.findMany({
      where: { id_conversation: conversationId, id_user: { not: userId } },
      select: { id_message: true },
    });
    const date_lecture = new Date();
    await this.prisma.$transaction(messages.map((message) => this.prisma.messages_statuts.upsert({
      where: { id_message_id_user: { id_message: message.id_message, id_user: userId } },
      create: { id_message: message.id_message, id_user: userId, statut: 'lu', date_lecture },
      update: { statut: 'lu', date_lecture },
    })));
    return { success: true };
  }

  async createMessage(authorId: number, payload: CreateMessagePayload, boutiqueId: number | null) {
    const contenu = payload.contenu?.trim();
    if (!contenu) throw new BadRequestException('Le contenu du message est requis.');

    const hasConversationId = payload.id_conversation != null && Number.isInteger(payload.id_conversation) && payload.id_conversation > 0;
    const hasBoutiqueId = payload.id_boutique != null && Number.isInteger(payload.id_boutique) && payload.id_boutique > 0;
    const conversation = hasConversationId
      ? await this.validateConversationAccess(payload.id_conversation as number, authorId, boutiqueId)
      : hasBoutiqueId
        ? await this.findOrCreateConversation(authorId, payload.id_boutique as number)
        : (() => { throw new BadRequestException('id_conversation ou id_boutique requis.'); })();

    const typeMessage = Object.values(messages_type_message).includes(payload.type_message as messages_type_message)
      ? payload.type_message as messages_type_message
      : 'texte';
    const message = await this.prisma.messages.create({
      data: {
        id_conversation: conversation.id_conversation,
        id_user: authorId,
        id_produit: payload.id_produit ?? null,
        contenu,
        type_message: typeMessage,
      },
    });
    const recipientUserId = await this.resolveRecipientUserId(authorId, conversation);
    if (recipientUserId) {
      await this.prisma.messages_statuts.upsert({
        where: { id_message_id_user: { id_message: message.id_message, id_user: recipientUserId } },
        create: { id_message: message.id_message, id_user: recipientUserId, statut: 'envoye' },
        update: { statut: 'envoye' },
      });
    }
    return { ...message, pieces_jointes: [], statut_lecture: 'envoye' };
  }

  async validateConversationAccess(conversationId: number, userId: number, boutiqueId: number | null) {
    const conversation = await this.prisma.conversations.findUnique({
      where: { id_conversation: conversationId },
      include: { boutiques: { select: { id_user: true } } },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable.');
    const canAccess = conversation.id_user === userId || conversation.boutiques.id_user === userId || (boutiqueId !== null && conversation.id_boutique === boutiqueId);
    if (!canAccess) throw new ForbiddenException('Accès interdit à cette conversation.');
    return { id_conversation: conversation.id_conversation, id_user: conversation.id_user, id_boutique: conversation.id_boutique };
  }

  async findOrCreateConversation(userId: number, boutiqueId: number) {
    const existing = await this.prisma.conversations.findFirst({ where: { id_user: userId, id_boutique: boutiqueId } });
    return existing ?? this.prisma.conversations.create({ data: { id_user: userId, id_boutique: boutiqueId } });
  }

  async resolveRecipientUserId(authorId: number, conversation: { id_user: number; id_boutique: number }) {
    if (conversation.id_user !== authorId) return conversation.id_user;
    const boutique = await this.prisma.boutiques.findUnique({ where: { id_boutique: conversation.id_boutique }, select: { id_user: true } });
    return boutique?.id_user ?? null;
  }
}
