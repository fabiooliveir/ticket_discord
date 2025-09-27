import { Injectable, Logger } from '@nestjs/common';
import { Message, EmbedBuilder, ChannelType, GuildChannel } from 'discord.js';
import { Inject } from '@nestjs/common';
import { DiscordBot } from './discord.bot';

export interface TeamConfig {
  channelId: string;
  roleId: string;
  keywords: string[];
  name: string;
  color: number;
  emoji: string;
}

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    @Inject('TEAMS_CONFIG') private readonly config: any,
    private readonly discordBot: DiscordBot,
  ) {}

  /**
   * Obtém a configuração das equipes
   */
  getTeamsConfig(): TeamConfig[] {
    return [
      {
        channelId: this.config.channels.suporte,
        roleId: this.config.roles.suporte,
        keywords: ['suporte', 'problema', 'bug', 'erro', 'ajuda', 'ticket'],
        name: 'Suporte Técnico',
        color: 0xff6b6b,
        emoji: '🔧',
      },
      {
        channelId: this.config.channels.cs,
        roleId: this.config.roles.cs,
        keywords: [
          'cs',
          'atendimento',
          'cliente',
          'vendas',
          'comercial',
          'proposta',
          'dúvida',
        ],
        name: 'Customer Success',
        color: 0x4ecdc4,
        emoji: '💼',
      },
      {
        channelId: this.config.channels.trafego,
        roleId: this.config.roles.trafego,
        keywords: [
          'tráfego',
          'marketing',
          'campanha',
          'anúncio',
          'lead',
          'conversão',
        ],
        name: 'Tráfego Pago',
        color: 0x45b7d1,
        emoji: '📈',
      },
    ];
  }

  /**
   * Determina qual equipe deve receber o ticket baseado no conteúdo
   */
  determineTeamForTicket(
    title: string,
    description?: string,
  ): TeamConfig | null {
    const teams = this.getTeamsConfig();
    const content = `${title} ${description || ''}`.toLowerCase();

    // Busca por palavras-chave específicas
    for (const team of teams) {
      const hasKeyword = team.keywords.some((keyword) =>
        content.includes(keyword.toLowerCase()),
      );

      if (hasKeyword) {
        this.logger.log(`Ticket direcionado para equipe: ${team.name}`);
        return team;
      }
    }

    // Fallback: direciona para suporte técnico se não encontrar match
    this.logger.log('Ticket direcionado para equipe padrão: Suporte Técnico');
    return teams[0]; // Suporte como padrão
  }

  /**
   * Envia notificação para a equipe específica
   */
  async notifyTeam(
    team: TeamConfig,
    ticketData: {
      id: string;
      title: string;
      description?: string;
      author: string;
      priority?: string;
    },
  ): Promise<void> {
    try {
      const channel = await this.discordBot.client.channels.fetch(
        team.channelId,
      );

      if (!channel || !channel.isTextBased()) {
        this.logger.error(
          `Canal ${team.channelId} não encontrado ou não é de texto`,
        );
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`${team.emoji} Novo Ticket - ${team.name}`)
        .setDescription(`**Título:** ${ticketData.title}`)
        .addFields(
          { name: '👤 Autor', value: ticketData.author, inline: true },
          { name: '🆔 ID do Ticket', value: ticketData.id, inline: true },
          {
            name: '⚡ Prioridade',
            value: ticketData.priority || 'Normal',
            inline: true,
          },
        )
        .setColor(team.color)
        .setTimestamp()
        .setFooter({ text: 'Sistema de Tickets Discord' });

      if (ticketData.description) {
        embed.addFields({
          name: '📝 Descrição',
          value:
            ticketData.description.length > 1024
              ? ticketData.description.substring(0, 1021) + '...'
              : ticketData.description,
          inline: false,
        });
      }

      // Menciona o cargo da equipe
      const roleMention = `<@&${team.roleId}>`;
      if (channel.isTextBased() && 'send' in channel) {
        await (channel as any).send({
          content: `${roleMention} - Novo ticket criado!`,
          embeds: [embed],
        });
      }

      this.logger.log(
        `Notificação enviada para equipe ${team.name} no canal ${team.channelId}`,
      );
    } catch (error) {
      this.logger.error(`Erro ao notificar equipe ${team.name}:`, error);
    }
  }

  /**
   * Verifica se o usuário tem permissão para acessar o canal da equipe
   */
  async hasChannelAccess(userId: string, team: TeamConfig): Promise<boolean> {
    try {
      const guild = this.discordBot.client.guilds.cache.first();
      if (!guild) return false;

      const member = await guild.members.fetch(userId);
      if (!member) return false;

      const channel = await guild.channels.fetch(team.channelId);
      if (!channel || !channel.isTextBased()) return false;

      // Verifica se o membro tem permissão para ver o canal
      const permissions = channel.permissionsFor(member);
      return permissions?.has('ViewChannel') || false;
    } catch (error) {
      this.logger.error(
        `Erro ao verificar permissões do usuário ${userId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Obtém estatísticas das equipes
   */
  async getTeamStats(): Promise<
    Array<{
      team: TeamConfig;
      channelName: string;
      memberCount: number;
    }>
  > {
    const teams = this.getTeamsConfig();
    const stats: Array<{
      team: TeamConfig;
      channelName: string;
      memberCount: number;
    }> = [];

    for (const team of teams) {
      try {
        const guild = this.discordBot.client.guilds.cache.first();
        if (!guild) continue;

        const channel = await guild.channels.fetch(team.channelId);
        const role = await guild.roles.fetch(team.roleId);

        stats.push({
          team,
          channelName: channel?.name || 'Canal não encontrado',
          memberCount: role?.members.size || 0,
        });
      } catch (error) {
        this.logger.error(
          `Erro ao obter estatísticas da equipe ${team.name}:`,
          error,
        );
        stats.push({
          team,
          channelName: 'Erro ao carregar',
          memberCount: 0,
        });
      }
    }

    return stats;
  }

  /**
   * Lista todos os canais e cargos configurados
   */
  async listTeamChannels(): Promise<string> {
    const teams = this.getTeamsConfig();
    const guild = this.discordBot.client.guilds.cache.first();

    if (!guild) {
      return '❌ Não foi possível acessar o servidor Discord';
    }

    let response = '📋 **Canais e Cargos das Equipes:**\n\n';

    for (const team of teams) {
      try {
        const channel = await guild.channels.fetch(team.channelId);
        const role = await guild.roles.fetch(team.roleId);

        response += `${team.emoji} **${team.name}**\n`;
        response += `   📺 Canal: ${channel?.name || '❌ Não encontrado'} (${team.channelId})\n`;
        response += `   👥 Cargo: ${role?.name || '❌ Não encontrado'} (${team.roleId})\n`;
        response += `   🔑 Palavras-chave: ${team.keywords.join(', ')}\n\n`;
      } catch (error) {
        this.logger.error(`Erro ao listar equipe ${team.name}:`, error);
        response += `${team.emoji} **${team.name}** - ❌ Erro ao carregar informações\n\n`;
      }
    }

    return response;
  }
}
