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

export class BudgetAdjustmentForm {
  static createClientSelectionEmbed(clients: LeadfyClient[]): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('💰 Seleção de Cliente - Ajuste de Verba')
      .setDescription('Escolha o cliente para o ticket de ajuste de verba')
      .setColor(0x00ff00)
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
          .setCustomId(`select_client_budget_${client.id}`)
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

  static createFormModal(): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId('budget_adjustment_form')
      .setTitle('💰 Ajuste de Verba');

    // Motivo do Ajuste (obrigatório)
    const adjustmentReasonInput = new TextInputBuilder()
      .setCustomId('adjustmentReason')
      .setLabel('Motivo do Ajuste')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Descreva detalhadamente o motivo do ajuste de verba...')
      .setRequired(true)
      .setMaxLength(1000);

    // Valor Solicitado (obrigatório)
    const requestedAmountInput = new TextInputBuilder()
      .setCustomId('requestedAmount')
      .setLabel('Valor Solicitado')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: R$ 1.500,00 ou 15% ou 1500 reais')
      .setRequired(true)
      .setMaxLength(50);

    // Informações da Campanha (opcional)
    const campaignInfoInput = new TextInputBuilder()
      .setCustomId('campaignInfo')
      .setLabel('Informações da Campanha (opcional)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('ID da campanha, período, plataforma, etc...')
      .setRequired(false)
      .setMaxLength(500);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        adjustmentReasonInput,
      );
    const secondActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        requestedAmountInput,
      );
    const thirdActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(campaignInfoInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    return modal;
  }

  static createConfirmationEmbed(
    clientName: string,
    formData: {
      adjustmentReason: string;
      requestedAmount: string;
      campaignInfo?: string;
    },
  ): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle('💰 Confirmação - Ajuste de Verba')
      .setDescription('Revise os dados antes de criar o ticket')
      .setColor(0x00ff00)
      .addFields(
        {
          name: '👤 Cliente',
          value: clientName,
          inline: true,
        },
        {
          name: '📝 Motivo do Ajuste',
          value:
            formData.adjustmentReason.substring(0, 200) +
            (formData.adjustmentReason.length > 200 ? '...' : ''),
          inline: false,
        },
        {
          name: '💰 Valor Solicitado',
          value: formData.requestedAmount,
          inline: true,
        },
      );

    if (formData.campaignInfo) {
      embed.addFields({
        name: '📊 Informações da Campanha',
        value:
          formData.campaignInfo.substring(0, 200) +
          (formData.campaignInfo.length > 200 ? '...' : ''),
        inline: false,
      });
    }

    return embed;
  }

  static createConfirmationButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_budget_adjustment')
        .setLabel('✅ Confirmar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('cancel_budget_adjustment')
        .setLabel('❌ Cancelar')
        .setStyle(ButtonStyle.Danger),
    );
  }
}
