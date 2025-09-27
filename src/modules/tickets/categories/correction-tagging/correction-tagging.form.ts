import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { LeadfyClient } from '../../../leadfy/interfaces/client.interface';

export class CorrectionTaggingForm {
  static createClientSelectionEmbed(clients: LeadfyClient[]): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('🔍 Seleção de Cliente - Correção de Tagueamento')
      .setDescription(
        'Escolha o cliente para o ticket de correção de tagueamento',
      )
      .setColor(0x0099ff)
      .setFooter({ text: `Total de ${clients.length} clientes encontrados` });
  }

  static createClientSelectionButtons(
    clients: LeadfyClient[],
  ): ActionRowBuilder<ButtonBuilder>[] {
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const maxButtonsPerRow = 5;

    for (let i = 0; i < clients.length; i += maxButtonsPerRow) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      const clientBatch = clients.slice(i, i + maxButtonsPerRow);

      clientBatch.forEach((client) => {
        const button = new ButtonBuilder()
          .setCustomId(`select_client_${client.id}`)
          .setLabel(
            client.name.length > 20
              ? client.name.substring(0, 17) + '...'
              : client.name,
          )
          .setStyle(ButtonStyle.Primary);

        row.addComponents(button);
      });

      rows.push(row);
    }

    return rows;
  }

  static createModal(
    clientId: string,
    client: any,
    team: string,
    priority: string,
  ): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(`correction_tagging_form_${clientId}`)
      .setTitle(`Correção - ${client.name}`);

    // Site
    const websiteInput = new TextInputBuilder()
      .setCustomId('website')
      .setLabel('Site que precisa de correção')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('https://exemplo.com');

    // Descrição do problema
    const descriptionInput = new TextInputBuilder()
      .setCustomId('problemDescription')
      .setLabel('Descrição do problema')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder('Descreva detalhadamente o problema de tagueamento...');

    // Informações adicionais
    const additionalInput = new TextInputBuilder()
      .setCustomId('additionalInfo')
      .setLabel('Informações adicionais (opcional)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setPlaceholder('Qualquer informação adicional relevante...');

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(websiteInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(additionalInput),
    );

    return modal;
  }

  static createTeamSelectionEmbed(): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('👥 Seleção de Time')
      .setDescription('Escolha o time responsável pelo ticket')
      .setColor(0x00ff00);
  }

  static createTeamSelectionButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('select_team_suporte')
        .setLabel('🔧 Suporte Técnico')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('select_team_cs')
        .setLabel('💼 Customer Success')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('select_team_trafico')
        .setLabel('📈 Tráfego Pago')
        .setStyle(ButtonStyle.Primary),
    );
  }

  static createPrioritySelectionEmbed(): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('⚡ Seleção de Prioridade')
      .setDescription('Escolha a prioridade do ticket')
      .setColor(0xff6b6b);
  }

  static createPrioritySelectionButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('select_priority_high')
        .setLabel('🔴 Alta')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('select_priority_medium')
        .setLabel('🟡 Média')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('select_priority_low')
        .setLabel('🟢 Baixa')
        .setStyle(ButtonStyle.Success),
    );
  }

  static createConfirmationEmbed(data: any): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('✅ Confirmação do Ticket')
      .setDescription('Revise os dados antes de confirmar')
      .setColor(0x00ff00)
      .addFields(
        { name: 'Cliente', value: data.clientName || 'N/A', inline: true },
        { name: 'Site', value: data.website || 'N/A', inline: true },
        { name: 'Time', value: data.team || 'N/A', inline: true },
        { name: 'Prioridade', value: data.priority || 'N/A', inline: true },
        {
          name: 'Problema',
          value: data.problemDescription || 'N/A',
          inline: false,
        },
      )
      .setTimestamp();
  }

  static createConfirmationButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_ticket')
        .setLabel('✅ Confirmar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('cancel_ticket')
        .setLabel('❌ Cancelar')
        .setStyle(ButtonStyle.Danger),
    );
  }
}
