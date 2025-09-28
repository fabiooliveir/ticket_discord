import { Injectable, Logger } from '@nestjs/common';
import { LeadfyService } from '../../../leadfy/leadfy.service';
import {
  BudgetAdjustmentData,
  BudgetAdjustmentFormData,
} from './budget-adjustment.interface';

@Injectable()
export class BudgetAdjustmentService {
  private readonly logger = new Logger(BudgetAdjustmentService.name);

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
    formData: BudgetAdjustmentFormData,
    team: string,
    priority: 'low' | 'medium' | 'high',
  ): BudgetAdjustmentData {
    return {
      clientId,
      clientName,
      team,
      priority,
      adjustmentReason: formData.adjustmentReason,
      requestedAmount: formData.requestedAmount,
      campaignInfo: formData.campaignInfo,
    };
  }

  validateFormData(formData: BudgetAdjustmentFormData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!formData.adjustmentReason || formData.adjustmentReason.trim() === '') {
      errors.push('Motivo do Ajuste é obrigatório');
    } else if (formData.adjustmentReason.trim().length < 10) {
      errors.push('Motivo do Ajuste deve ter pelo menos 10 caracteres');
    } else if (formData.adjustmentReason.trim().length > 1000) {
      errors.push('Motivo do Ajuste deve ter no máximo 1000 caracteres');
    }

    if (!formData.requestedAmount || formData.requestedAmount.trim() === '') {
      errors.push('Valor Solicitado é obrigatório');
    } else if (!this.isValidAmountFormat(formData.requestedAmount)) {
      errors.push('Valor Solicitado deve estar em formato válido (ex: R$ 1.500,00, 15%, 1500 reais)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isValidAmountFormat(amount: string): boolean {
    // Regex para validar formatos como: R$ 1.500,00, 15%, 1500 reais, R$1500, etc.
    const amountRegex = /^(R\$\s?)?[\d.,]+(\s?(reais?|%))?$/i;
    return amountRegex.test(amount.trim());
  }
}
