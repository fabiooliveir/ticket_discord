import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { SlaService } from './sla.service';
import {
  SlaConfigDto,
  SlaMetricsResponseDto,
} from '../../shared/dto/sla-metrics.dto';

@Controller('sla')
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  /**
   * Obtém métricas gerais de SLA
   */
  @Get('metrics')
  async getSlaMetrics(): Promise<SlaMetricsResponseDto> {
    return await this.slaService.calculateSlaMetrics();
  }

  /**
   * Obtém métricas de SLA por período
   */
  @Get('metrics/period')
  async getSlaMetricsByPeriod(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<SlaMetricsResponseDto> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate e endDate são obrigatórios');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Datas inválidas');
    }

    if (start >= end) {
      throw new BadRequestException('startDate deve ser anterior a endDate');
    }

    return await this.slaService.calculateSlaMetricsByPeriod(start, end);
  }

  /**
   * Obtém métricas de SLA para um ticket específico
   */
  @Get('metrics/ticket/:id')
  async getTicketSlaMetrics(
    @Param('id', ParseUUIDPipe) ticketId: string,
  ): Promise<{
    responseTimeMinutes: number;
    resolutionTimeMinutes: number;
    responseSlaStatus: string;
    resolutionSlaStatus: string;
  }> {
    return await this.slaService.calculateTicketSlaMetrics(ticketId);
  }

  /**
   * Atualiza métricas de SLA de um ticket específico
   */
  @Post('metrics/ticket/:id/update')
  async updateTicketSlaMetrics(
    @Param('id', ParseUUIDPipe) ticketId: string,
  ): Promise<{
    message: string;
    ticketId: string;
  }> {
    await this.slaService.updateTicketSlaMetrics(ticketId);
    return {
      message: 'Métricas de SLA atualizadas com sucesso',
      ticketId,
    };
  }

  /**
   * Obtém configurações de SLA ativas
   */
  @Get('configs')
  async getActiveSlaConfigs(): Promise<any[]> {
    return await this.slaService.getActiveSlaConfigs();
  }

  /**
   * Obtém configuração de SLA por categoria e prioridade
   */
  @Get('configs/:category/:priority')
  async getSlaConfig(
    @Param('category') category: string,
    @Param('priority') priority: string,
  ): Promise<any> {
    const config = await this.slaService.getSlaConfig(category, priority);
    if (!config) {
      throw new BadRequestException(
        `Configuração de SLA não encontrada para categoria ${category} e prioridade ${priority}`,
      );
    }
    return config;
  }

  /**
   * Cria nova configuração de SLA
   */
  @Post('configs')
  async createSlaConfig(@Body() configData: SlaConfigDto): Promise<any> {
    return await this.slaService.createSlaConfig(configData);
  }

  /**
   * Obtém status atual de SLA (para monitoramento em tempo real)
   */
  @Get('status')
  async getCurrentSlaStatus(): Promise<{
    overall: {
      complianceRate: number;
      totalTickets: number;
      atRiskTickets: number;
      breachedTickets: number;
    };
    byPriority: Record<
      string,
      {
        complianceRate: number;
        totalTickets: number;
        avgResponseTime: number;
        avgResolutionTime: number;
      }
    >;
    lastUpdated: Date;
  }> {
    const metrics = await this.slaService.calculateSlaMetrics();

    const overall = {
      complianceRate: metrics.complianceRate,
      totalTickets: metrics.totalTickets,
      atRiskTickets: metrics.atRiskTickets,
      breachedTickets: metrics.breachedTickets,
    };

    const byPriority: Record<string, any> = {};
    Object.keys(metrics.metricsByPriority).forEach((priority) => {
      const priorityMetrics = metrics.metricsByPriority[priority];
      byPriority[priority] = {
        complianceRate: priorityMetrics.complianceRate,
        totalTickets: priorityMetrics.total,
        avgResponseTime: priorityMetrics.avgResponseTime,
        avgResolutionTime: priorityMetrics.avgResolutionTime,
      };
    });

    return {
      overall,
      byPriority,
      lastUpdated: new Date(),
    };
  }
}
