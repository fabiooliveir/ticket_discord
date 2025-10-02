import { Injectable, Logger } from '@nestjs/common';
import { GeneralTicketData } from './general.interface';

@Injectable()
export class GeneralService {
  private readonly logger = new Logger(GeneralService.name);

  async createGeneralTicketData(
    formData: any,
    clientId: string,
    clientName: string,
    team: string,
    priority: string,
  ): Promise<GeneralTicketData> {
    this.logger.log(`Criando dados do ticket geral para cliente ${clientName}`);

    return {
      categoryId: 'general',
      clientId,
      clientName,
      team,
      priority: priority as 'low' | 'medium' | 'high',
      title: formData.title,
      description: formData.description,
    };
  }

  validateGeneralFormData(formData: any): boolean {
    if (!formData.title || formData.title.trim().length === 0) {
      this.logger.warn('Título do ticket geral é obrigatório');
      return false;
    }

    if (!formData.description || formData.description.trim().length === 0) {
      this.logger.warn('Descrição do ticket geral é obrigatória');
      return false;
    }

    if (formData.title.length > 100) {
      this.logger.warn('Título do ticket geral excede 100 caracteres');
      return false;
    }

    if (formData.description.length > 2000) {
      this.logger.warn('Descrição do ticket geral excede 2000 caracteres');
      return false;
    }

    return true;
  }
}








