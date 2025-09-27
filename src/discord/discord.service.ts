import { Injectable, Logger } from '@nestjs/common';
import {
  Message,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import { Inject } from '@nestjs/common';
import { DiscordBot } from './discord.bot';
import { TeamsService } from './teams.service';
import { FormHandlerService } from './forms/form-handler.service';
import { DatabaseService } from '../database/database.service';
import { Ticket } from '../database/entities/ticket.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketCategoryService } from '../modules/tickets/categories/ticket-category.service';
import { CorrectionTaggingService } from '../modules/tickets/categories/correction-tagging/correction-tagging.service';
import { CorrectionTaggingForm } from '../modules/tickets/categories/correction-tagging/correction-tagging.form';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  constructor(
    @Inject('DISCORD_CONFIG') private readonly config: any,
    private readonly databaseService: DatabaseService,
    private readonly teamsService: TeamsService,
    private readonly formHandlerService: FormHandlerService,
    private readonly ticketCategoryService: TicketCategoryService,
    private readonly correctionTaggingService: CorrectionTaggingService,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async handleTicketCommand(message: Message) {
    try {
      const args = message.content.split(' ').slice(1);
      const command = args[0];

      switch (command) {
        case 'create':
          await this.createTicket(message, args.slice(1));
          break;
        case 'close':
          await this.closeTicket(message);
          break;
        case 'list':
          await this.listTickets(message);
          break;
        case 'teams':
          await this.showTeamsInfo(message);
          break;
        case 'stats':
          await this.showTeamStats(message);
          break;
        case 'help':
          await this.showHelp(message);
          break;
        default:
          await this.showHelp(message);
      }
    } catch (error) {
      this.logger.error('Erro ao processar comando de ticket:', error);
      await message.reply('❌ Ocorreu um erro ao processar o comando!');
    }
  }

  async createTicket(message: Message, args: string[]) {
    if (args.length === 0) {
      await message.reply(
        '❌ Por favor, forneça um título para o ticket!\nExemplo: `!ticket create Problema com login`',
      );
      return;
    }

    const title = args.join(' ');
    const userId = message.author.id;
    const channelId = message.channel.id;

    try {
      // Verificar se o usuário já tem um ticket aberto
      const existingTicket = await this.ticketRepository.findOne({
        where: {
          discordUserId: userId,
          status: 'open',
        },
      });

      if (existingTicket) {
        await message.reply(
          '❌ Você já possui um ticket aberto! Use `!ticket close` para fechar o atual.',
        );
        return;
      }

      // Determinar equipe responsável baseado no conteúdo
      const team = this.teamsService.determineTeamForTicket(title);
      const teamInfo = team
        ? `\n\n🎯 **Direcionado para:** ${team.emoji} ${team.name}`
        : '';

      // Criar ticket no banco de dados
      const ticket = this.ticketRepository.create({
        title,
        description: `Ticket criado por ${message.author.tag}${teamInfo}`,
        status: 'open',
        priority: 'medium',
        discordUserId: userId,
        discordChannelId: channelId,
        metadata: {
          createdBy: message.author.tag,
          createdAt: new Date().toISOString(),
          assignedTeam: team?.name || 'Suporte Técnico',
          teamChannelId: team?.channelId,
          teamRoleId: team?.roleId,
        },
      });

      const savedTicket = await this.ticketRepository.save(ticket);

      // Notificar a equipe responsável
      if (team) {
        await this.teamsService.notifyTeam(team, {
          id: savedTicket.id,
          title: savedTicket.title,
          description: savedTicket.description,
          author: message.author.tag,
          priority: savedTicket.priority,
        });
      }

      // Criar embed de confirmação
      const embed = new EmbedBuilder()
        .setTitle('🎫 Ticket Criado')
        .setDescription(`**Título:** ${title}`)
        .addFields(
          { name: 'ID do Ticket', value: savedTicket.id, inline: true },
          { name: 'Status', value: 'Aberto', inline: true },
          { name: 'Prioridade', value: 'Média', inline: true },
          {
            name: 'Equipe Responsável',
            value: team ? `${team.emoji} ${team.name}` : '🔧 Suporte Técnico',
            inline: false,
          },
        )
        .setColor(team?.color || 0x00ff00)
        .setTimestamp()
        .setFooter({ text: `Criado por ${message.author.tag}` });

      // Criar botões de ação
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`close_ticket_${savedTicket.id}`)
          .setLabel('Fechar Ticket')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`priority_high_${savedTicket.id}`)
          .setLabel('Alta Prioridade')
          .setStyle(ButtonStyle.Primary),
      );

      await message.reply({ embeds: [embed], components: [row] });

      this.logger.log(
        `Ticket ${savedTicket.id} criado por ${message.author.tag} e direcionado para ${team?.name || 'Suporte Técnico'}`,
      );
    } catch (error) {
      this.logger.error('Erro ao criar ticket:', error);
      await message.reply(
        '❌ Erro ao criar ticket. Tente novamente mais tarde.',
      );
    }
  }

  async closeTicket(message: Message) {
    try {
      const userId = message.author.id;

      const ticket = await this.ticketRepository.findOne({
        where: {
          discordUserId: userId,
          status: 'open',
        },
      });

      if (!ticket) {
        await message.reply('❌ Você não possui nenhum ticket aberto!');
        return;
      }

      // Atualizar status do ticket
      ticket.status = 'closed';
      ticket.metadata = {
        ...ticket.metadata,
        closedBy: message.author.tag,
        closedAt: new Date().toISOString(),
      };

      await this.ticketRepository.save(ticket);

      const embed = new EmbedBuilder()
        .setTitle('🎫 Ticket Fechado')
        .setDescription(`Ticket **${ticket.title}** foi fechado com sucesso!`)
        .setColor(0xff0000)
        .setTimestamp()
        .setFooter({ text: `Fechado por ${message.author.tag}` });

      await message.reply({ embeds: [embed] });

      this.logger.log(`Ticket ${ticket.id} fechado por ${message.author.tag}`);
    } catch (error) {
      this.logger.error('Erro ao fechar ticket:', error);
      await message.reply(
        '❌ Erro ao fechar ticket. Tente novamente mais tarde.',
      );
    }
  }

  async listTickets(message: Message) {
    try {
      const userId = message.author.id;

      const tickets = await this.ticketRepository.find({
        where: {
          discordUserId: userId,
        },
        order: {
          createdAt: 'DESC',
        },
        take: 10,
      });

      if (tickets.length === 0) {
        await message.reply('📝 Você não possui nenhum ticket!');
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('📝 Seus Tickets')
        .setDescription('Lista dos seus últimos 10 tickets:')
        .setColor(0x0099ff)
        .setTimestamp();

      tickets.forEach((ticket, index) => {
        const status = ticket.status === 'open' ? '🟢 Aberto' : '🔴 Fechado';
        const priority =
          ticket.priority === 'high'
            ? '🔴 Alta'
            : ticket.priority === 'medium'
              ? '🟡 Média'
              : '🟢 Baixa';

        embed.addFields({
          name: `${index + 1}. ${ticket.title}`,
          value: `**ID:** ${ticket.id}\n**Status:** ${status}\n**Prioridade:** ${priority}\n**Criado:** <t:${Math.floor(ticket.createdAt.getTime() / 1000)}:R>`,
          inline: false,
        });
      });

      await message.reply({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Erro ao listar tickets:', error);
      await message.reply(
        '❌ Erro ao listar tickets. Tente novamente mais tarde.',
      );
    }
  }

  async showHelp(message: Message) {
    const embed = new EmbedBuilder()
      .setTitle('🎫 Sistema de Tickets - Ajuda')
      .setDescription('Comandos disponíveis para gerenciar tickets:')
      .addFields(
        {
          name: '!ticket create <título>',
          value:
            'Cria um novo ticket (direcionado automaticamente para a equipe correta)',
          inline: false,
        },
        {
          name: '!ticket close',
          value: 'Fecha seu ticket aberto',
          inline: false,
        },
        { name: '!ticket list', value: 'Lista seus tickets', inline: false },
        {
          name: '!ticket teams',
          value: 'Mostra informações sobre as equipes configuradas',
          inline: false,
        },
        {
          name: '!ticket stats',
          value: 'Mostra estatísticas das equipes (canais e membros)',
          inline: false,
        },
        {
          name: '!ticket help',
          value: 'Mostra esta mensagem de ajuda',
          inline: false,
        },
      )
      .setColor(0x0099ff)
      .setTimestamp()
      .setFooter({ text: 'Sistema de Tickets Discord' });

    await message.reply({ embeds: [embed] });
  }

  async getSlashCommands() {
    return [
      {
        name: 'criar-ticket',
        description: 'Cria um novo ticket de suporte',
        options: [
          {
            name: 'categoria',
            description: 'Categoria do ticket',
            type: 3,
            required: true,
            choices: [
              {
                name: 'Correção de Tagueamento',
                value: 'correction-tagging',
              },
              {
                name: 'Ticket Geral',
                value: 'general',
              },
            ],
          },
          {
            name: 'titulo',
            description:
              'Título do ticket (opcional para correção de tagueamento)',
            type: 3,
            required: false,
          },
          {
            name: 'descricao',
            description:
              'Descrição detalhada do problema (opcional para correção de tagueamento)',
            type: 3,
            required: false,
          },
        ],
      },
    ];
  }

  async handleSlashCommand(interaction: any) {
    const { commandName, options } = interaction;

    switch (commandName) {
      case 'criar-ticket':
        await this.handleCreateTicketSlash(interaction, options);
        break;
      default:
        await interaction.reply({
          content: '❌ Comando não reconhecido!',
          ephemeral: true,
        });
    }
  }

  private async handleCreateTicketSlash(interaction: any, options: any) {
    try {
      const category = options.getString('categoria');
      const title = options.getString('titulo');
      const description =
        options.getString('descricao') || 'Sem descrição fornecida';

      // Defer a resposta para dar tempo de processar
      await interaction.deferReply({ ephemeral: true });

      if (category === 'correction-tagging') {
        // Fluxo específico para correção de tagueamento
        await this.handleCorrectionTaggingFlow(interaction);
      } else {
        // Fluxo padrão para tickets gerais
        const ticket = await this.createTicketFromSlash(
          interaction,
          title,
          description,
        );

        if (ticket) {
          await interaction.editReply({
            content: `✅ Ticket criado com sucesso! ID: ${ticket.id}`,
          });
        } else {
          await interaction.editReply({
            content: '❌ Erro ao criar ticket. Tente novamente.',
          });
        }
      }
    } catch (error) {
      this.logger.error('Erro ao criar ticket via slash command:', error);
      await interaction.editReply({
        content: '❌ Erro interno ao criar ticket. Tente novamente.',
      });
    }
  }

  private async createTicketFromSlash(
    interaction: any,
    title: string,
    description: string,
  ) {
    try {
      const guild = interaction.guild;
      const user = interaction.user;

      // Criar canal do ticket
      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        parent: this.config.ticketCategoryId,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
            ],
          },
        ],
      });

      // Salvar no banco de dados
      const ticket = this.ticketRepository.create({
        title,
        description,
        status: 'open',
        priority: 'normal',
        discordUserId: user.id,
        discordChannelId: ticketChannel.id,
        metadata: {
          createdBy: user.tag,
          guildId: guild.id,
        },
      });

      const savedTicket = await this.ticketRepository.save(ticket);

      // Criar embed do ticket
      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${savedTicket.id}`)
        .setDescription(`**Título:** ${title}\n**Descrição:** ${description}`)
        .addFields(
          { name: '👤 Criado por', value: user.tag, inline: true },
          {
            name: '📅 Data',
            value: new Date().toLocaleString('pt-BR'),
            inline: true,
          },
          { name: '📊 Status', value: '🟢 Aberto', inline: true },
        )
        .setColor(0x00ff00)
        .setFooter({ text: 'Sistema de Tickets Discord' });

      // Criar botões de ação
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`close_ticket_${savedTicket.id}`)
          .setLabel('Fechar Ticket')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`priority_ticket_${savedTicket.id}`)
          .setLabel('Alta Prioridade')
          .setStyle(ButtonStyle.Primary),
      );

      // Enviar mensagem no canal do ticket
      await ticketChannel.send({
        content: `<@${user.id}>`,
        embeds: [embed],
        components: [row],
      });

      // Notificar no canal de logs se configurado
      if (this.config.logChannelId) {
        const logChannel = guild.channels.cache.get(this.config.logChannelId);
        if (logChannel && logChannel.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setTitle('🎫 Novo Ticket Criado')
            .setDescription(
              `**Ticket:** ${title}\n**Canal:** <#${ticketChannel.id}>\n**Usuário:** ${user.tag}`,
            )
            .setColor(0x00ff00)
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        }
      }

      return savedTicket;
    } catch (error) {
      this.logger.error('Erro ao criar ticket:', error);
      return null;
    }
  }

  async handleButtonInteraction(interaction: any) {
    const customId = interaction.customId;

    if (customId.startsWith('close_ticket_')) {
      const ticketId = customId.replace('close_ticket_', '');
      await this.closeTicketById(interaction, ticketId);
    } else if (customId.startsWith('priority_high_')) {
      const ticketId = customId.replace('priority_high_', '');
      await this.setTicketPriority(interaction, ticketId, 'high');
    } else {
      // Delegar para FormHandlerService para outros tipos de botões
      await this.formHandlerService.handleButtonInteraction(interaction);
    }
  }

  private async closeTicketById(interaction: any, ticketId: string) {
    try {
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
      });

      if (!ticket) {
        await interaction.reply({
          content: '❌ Ticket não encontrado!',
          ephemeral: true,
        });
        return;
      }

      ticket.status = 'closed';
      ticket.metadata = {
        ...ticket.metadata,
        closedBy: interaction.user.tag,
        closedAt: new Date().toISOString(),
      };

      await this.ticketRepository.save(ticket);

      const embed = new EmbedBuilder()
        .setTitle('🎫 Ticket Fechado')
        .setDescription(`Ticket **${ticket.title}** foi fechado com sucesso!`)
        .setColor(0xff0000)
        .setTimestamp();

      await interaction.update({ embeds: [embed], components: [] });
    } catch (error) {
      this.logger.error('Erro ao fechar ticket por ID:', error);
      await interaction.reply({
        content: '❌ Erro ao fechar ticket!',
        ephemeral: true,
      });
    }
  }

  private async setTicketPriority(
    interaction: any,
    ticketId: string,
    priority: string,
  ) {
    try {
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
      });

      if (!ticket) {
        await interaction.reply({
          content: '❌ Ticket não encontrado!',
          ephemeral: true,
        });
        return;
      }

      ticket.priority = priority;
      ticket.metadata = {
        ...ticket.metadata,
        priorityChangedBy: interaction.user.tag,
        priorityChangedAt: new Date().toISOString(),
      };

      await this.ticketRepository.save(ticket);

      const embed = new EmbedBuilder()
        .setTitle('🎫 Prioridade Alterada')
        .setDescription(
          `Prioridade do ticket **${ticket.title}** alterada para **Alta**!`,
        )
        .setColor(0xffaa00)
        .setTimestamp();

      await interaction.update({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Erro ao alterar prioridade do ticket:', error);
      await interaction.reply({
        content: '❌ Erro ao alterar prioridade!',
        ephemeral: true,
      });
    }
  }

  /**
   * Mostra informações sobre as equipes configuradas
   */
  async showTeamsInfo(message: Message) {
    try {
      const teamsInfo = await this.teamsService.listTeamChannels();

      const embed = new EmbedBuilder()
        .setTitle('👥 Informações das Equipes')
        .setDescription(teamsInfo)
        .setColor(0x0099ff)
        .setTimestamp()
        .setFooter({ text: 'Sistema de Tickets Discord' });

      await message.reply({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Erro ao mostrar informações das equipes:', error);
      await message.reply('❌ Erro ao carregar informações das equipes.');
    }
  }

  /**
   * Mostra estatísticas das equipes
   */
  async showTeamStats(message: Message) {
    try {
      const stats = await this.teamsService.getTeamStats();

      const embed = new EmbedBuilder()
        .setTitle('📊 Estatísticas das Equipes')
        .setDescription('Informações sobre canais e membros das equipes:')
        .setColor(0x00ff00)
        .setTimestamp()
        .setFooter({ text: 'Sistema de Tickets Discord' });

      stats.forEach((stat) => {
        embed.addFields({
          name: `${stat.team.emoji} ${stat.team.name}`,
          value: `📺 **Canal:** ${stat.channelName}\n👥 **Membros:** ${stat.memberCount}`,
          inline: true,
        });
      });

      await message.reply({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Erro ao mostrar estatísticas das equipes:', error);
      await message.reply('❌ Erro ao carregar estatísticas das equipes.');
    }
  }

  private async handleCorrectionTaggingFlow(interaction: any) {
    try {
      // Buscar clientes na Leadfy
      const clients = await this.correctionTaggingService.getAllClients();

      if (clients.length === 0) {
        await interaction.editReply({
          content:
            '❌ Nenhum cliente encontrado na Leadfy. Tente novamente mais tarde.',
        });
        return;
      }

      // Mostrar seleção de cliente
      const embed = CorrectionTaggingForm.createClientSelectionEmbed(clients);
      const buttonRows =
        CorrectionTaggingForm.createClientSelectionButtons(clients);

      await interaction.editReply({
        embeds: [embed],
        components: buttonRows,
      });
    } catch (error) {
      this.logger.error('Erro no fluxo de correção de tagueamento:', error);
      await interaction.editReply({
        content: '❌ Erro ao buscar clientes. Tente novamente.',
      });
    }
  }

  async handleModalSubmit(interaction: any) {
    await this.formHandlerService.handleModalSubmit(interaction);
  }
}
