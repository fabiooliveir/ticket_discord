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

export class NewTaggingForm {
  static createClientSelectionEmbed(clients: LeadfyClient[]): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('🔍 Seleção de Cliente - Novo Tagueamento')
      .setDescription(
        'Escolha o cliente para configurar novo sistema de tagueamento',
      )
      .setColor(0x9932cc)
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
          .setCustomId(`select_client_new_tagging_${client.id}`)
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
      .setCustomId(`new_tagging_form_${clientId}`)
      .setTitle(`Novo Tag - ${client.name}`);

    // ID de Conta Meta
    const metaAccountInput = new TextInputBuilder()
      .setCustomId('metaAccountId')
      .setLabel('ID de Conta Meta')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('Ex: 123456789');

    // ID de Conta Google Ads
    const googleAdsInput = new TextInputBuilder()
      .setCustomId('googleAdsAccountId')
      .setLabel('ID de Conta Google Ads')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('Ex: 123-456-7890');

    // ID de Pixel Facebook
    const facebookPixelInput = new TextInputBuilder()
      .setCustomId('facebookPixelId')
      .setLabel('ID de Pixel Facebook')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('Ex: 123456789012345');

    // Informações adicionais
    const additionalInput = new TextInputBuilder()
      .setCustomId('additionalInfo')
      .setLabel('Informações adicionais (opcional)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setPlaceholder('Qualquer informação adicional relevante...');

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(metaAccountInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(googleAdsInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        facebookPixelInput,
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(additionalInput),
    );

    return modal;
  }

  static createConfirmationEmbed(data: any): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('✅ Confirmação do Ticket - Novo Tagueamento')
      .setDescription('Revise os dados antes de confirmar')
      .setColor(0x9932cc)
      .addFields(
        { name: 'Cliente', value: data.clientName || 'N/A', inline: true },
        { name: 'Time', value: data.team || 'N/A', inline: true },
        { name: 'Prioridade', value: data.priority || 'N/A', inline: true },
        {
          name: 'Meta Account ID',
          value: data.metaAccountId || 'N/A',
          inline: false,
        },
        {
          name: 'Google Ads ID',
          value: data.googleAdsAccountId || 'N/A',
          inline: false,
        },
        {
          name: 'Facebook Pixel ID',
          value: data.facebookPixelId || 'N/A',
          inline: false,
        },
        {
          name: 'Informações Adicionais',
          value: data.additionalInfo || 'Nenhuma',
          inline: false,
        },
      )
      .setTimestamp();
  }

  static createConfirmationButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_new_tagging_ticket')
        .setLabel('✅ Confirmar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('cancel_new_tagging_ticket')
        .setLabel('❌ Cancelar')
        .setStyle(ButtonStyle.Danger),
    );
  }
}
