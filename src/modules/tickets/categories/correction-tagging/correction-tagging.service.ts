import { Injectable, Logger } from '@nestjs/common';
import { LeadfyService } from '../../../leadfy/leadfy.service';
import {
  CorrectionTaggingData,
  CorrectionTaggingFormData,
} from './correction-tagging.interface';

@Injectable()
export class CorrectionTaggingService {
  private readonly logger = new Logger(CorrectionTaggingService.name);

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
    formData: CorrectionTaggingFormData,
  ): CorrectionTaggingData {
    return {
      clientId,
      clientName,
      team: formData.team,
      priority: formData.priority,
      website: formData.website,
      problemDescription: formData.problemDescription,
      additionalInfo: formData.additionalInfo,
    };
  }

  validateFormData(formData: CorrectionTaggingFormData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!formData.website || formData.website.trim() === '') {
      errors.push('Site é obrigatório');
    }

    if (
      !formData.problemDescription ||
      formData.problemDescription.trim() === ''
    ) {
      errors.push('Descrição do problema é obrigatória');
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
