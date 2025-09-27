import { Injectable, Logger } from '@nestjs/common';
import { LeadfyService } from '../../../leadfy/leadfy.service';
import { NewTaggingData, NewTaggingFormData } from './new-tagging.interface';

@Injectable()
export class NewTaggingService {
  private readonly logger = new Logger(NewTaggingService.name);

  constructor(private readonly leadfyService: LeadfyService) {}

  async validateClient(clientId: string): Promise<boolean> {
    try {
      return await this.leadfyService.validateClient(clientId);
    } catch (error) {
      this.logger.error(`Erro ao validar cliente ${clientId}:`, error.message);
      return false;
    }
  }

  async getClientById(clientId: string) {
    try {
      return await this.leadfyService.getClientById(clientId);
    } catch (error) {
      this.logger.error(`Erro ao buscar cliente ${clientId}:`, error.message);
      return null;
    }
  }

  async searchClients(query: string) {
    try {
      return await this.leadfyService.searchClients(query);
    } catch (error) {
      this.logger.error(`Erro na busca de clientes:`, error.message);
      return [];
    }
  }

  async getAllClients() {
    try {
      return await this.leadfyService.getClients();
    } catch (error) {
      this.logger.error(`Erro ao buscar todos os clientes:`, error.message);
      return [];
    }
  }

  buildTicketData(
    clientId: string,
    clientName: string,
    formData: NewTaggingFormData,
  ): NewTaggingData {
    return {
      clientId,
      clientName,
      team: formData.team,
      priority: formData.priority,
      metaAccountId: formData.metaAccountId,
      googleAdsAccountId: formData.googleAdsAccountId,
      facebookPixelId: formData.facebookPixelId,
      additionalInfo: formData.additionalInfo,
    };
  }

  validateFormData(formData: NewTaggingFormData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!formData.metaAccountId || formData.metaAccountId.trim() === '') {
      errors.push('ID de Conta Meta é obrigatório');
    }

    if (
      !formData.googleAdsAccountId ||
      formData.googleAdsAccountId.trim() === ''
    ) {
      errors.push('ID de Conta Google Ads é obrigatório');
    }

    if (!formData.facebookPixelId || formData.facebookPixelId.trim() === '') {
      errors.push('ID de Pixel Facebook é obrigatório');
    }

    if (
      !formData.team ||
      !['suporte', 'cs', 'trafico'].includes(formData.team)
    ) {
      errors.push('Time responsável é obrigatório');
    }

    if (
      !formData.priority ||
      !['low', 'medium', 'high'].includes(formData.priority)
    ) {
      errors.push('Prioridade é obrigatória');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
