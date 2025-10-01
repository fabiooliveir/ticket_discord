import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

export class GeneralForm {
  static createModal(clientId: string): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId(`general_form_${clientId}`)
      .setTitle('📋 Ticket Geral');

    // Campo: Título
    const titleInput = new TextInputBuilder()
      .setCustomId('title')
      .setLabel('Título do Ticket')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Resumo breve da demanda...')
      .setRequired(true)
      .setMaxLength(100);

    // Campo: Descrição
    const descriptionInput = new TextInputBuilder()
      .setCustomId('description')
      .setLabel('Descrição Detalhada')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Descreva detalhadamente sua demanda...')
      .setRequired(true)
      .setMaxLength(2000);

    const titleRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      titleInput,
    );
    const descriptionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);

    modal.addComponents(titleRow, descriptionRow);

    return modal;
  }

  static createConfirmationEmbed(data: {
    clientName: string;
    title: string;
    description: string;
    team: string;
    priority: string;
  }): EmbedBuilder {
    const priorityEmoji =
      data.priority === 'high'
        ? '🔴'
        : data.priority === 'medium'
          ? '🟡'
          : '🟢';
    const priorityText =
      data.priority === 'high'
        ? 'Alta'
        : data.priority === 'medium'
          ? 'Média'
          : 'Baixa';

    return new EmbedBuilder()
      .setTitle('📋 Confirmação - Ticket Geral')
      .setDescription('Revise os dados do ticket antes de confirmar:')
      .setColor(0x0099ff)
      .addFields(
        {
          name: '👤 Cliente',
          value: data.clientName,
          inline: true,
        },
        {
          name: '📝 Título',
          value: data.title,
          inline: true,
        },
        {
          name: '📋 Descrição',
          value:
            data.description.length > 1000
              ? data.description.substring(0, 1000) + '...'
              : data.description,
          inline: false,
        },
        {
          name: '👥 Equipe',
          value: data.team,
          inline: true,
        },
        {
          name: '⚡ Prioridade',
          value: `${priorityEmoji} ${priorityText}`,
          inline: true,
        },
      )
      .setTimestamp()
      .setFooter({ text: 'Clique em "Confirmar" para criar o ticket' });
  }

  static createConfirmationButtons(): ActionRowBuilder<ButtonBuilder> {
    const confirmButton = new ButtonBuilder()
      .setCustomId('confirm_general_ticket')
      .setLabel('Confirmar Ticket')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅');

    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_general_ticket')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('❌');

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      confirmButton,
      cancelButton,
    );
  }
}
