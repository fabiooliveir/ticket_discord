import { Injectable, Logger } from '@nestjs/common';
import { ThreadChannel } from 'discord.js';
import { TicketMessage } from '../../database/entities/ticket-message.interface';

@Injectable()
export class MessageCaptureService {
  private readonly logger = new Logger(MessageCaptureService.name);

  async captureThreadMessages(
    thread: ThreadChannel,
    botUserId: string,
  ): Promise<TicketMessage[]> {
    try {
      const messages: TicketMessage[] = [];
      let lastMessageId: string | undefined;

      this.logger.log(`Iniciando captura de mensagens da thread ${thread.id}`);

      // Buscar mensagens em lotes de 100 (limite da API Discord)
      while (true) {
        const fetchedMessages = await thread.messages.fetch({
          limit: 100,
          before: lastMessageId,
        });

        if (fetchedMessages.size === 0) break;

        // Filtrar e processar mensagens
        fetchedMessages.forEach((message) => {
          // Excluir mensagens do bot
          if (message.author.id === botUserId) return;

          const ticketMessage: TicketMessage = {
            id: message.id,
            author: {
              id: message.author.id,
              username: message.author.username,
              tag: message.author.tag,
            },
            content: message.content,
            timestamp: message.createdAt.toISOString(),
            attachments: message.attachments.map((att) => ({
              id: att.id,
              filename: att.name,
              url: att.url,
              size: att.size,
            })),
            type: message.author.bot ? 'system' : 'user',
          };

          messages.push(ticketMessage);
        });

        lastMessageId = fetchedMessages.last()?.id;

        // Pequena pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Ordenar por timestamp (mais antigas primeiro)
      messages.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      this.logger.log(
        `Capturadas ${messages.length} mensagens da thread ${thread.id}`,
      );

      return messages;
    } catch (error) {
      this.logger.error('Erro ao capturar mensagens:', error);
      return [];
    }
  }

  async captureTicketMessagesByThreadId(
    threadId: string,
    botUserId: string,
    client: any,
  ): Promise<TicketMessage[]> {
    try {
      const thread = await client.channels.fetch(threadId);
      
      if (!thread || !thread.isThread()) {
        this.logger.warn(`Thread ${threadId} não encontrada ou não é uma thread válida`);
        return [];
      }

      return this.captureThreadMessages(thread as ThreadChannel, botUserId);
    } catch (error) {
      this.logger.error(`Erro ao capturar mensagens da thread ${threadId}:`, error);
      return [];
    }
  }
}
