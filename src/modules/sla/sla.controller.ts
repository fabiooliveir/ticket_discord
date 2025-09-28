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

  /**
   * Obtém tickets com primeira resposta pendente de captura
   */
  @Get('capture/pending')
  async getPendingFirstResponseTickets() {
    const tickets = await this.slaService.getTicketsWithPendingFirstResponse();

    return {
      count: tickets.length,
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        title: ticket.title,
        assignedTo: ticket.assignedTo,
        createdAt: ticket.createdAt,
        priority: ticket.priority,
        status: ticket.status,
        threadId: ticket.metadata?.threadId,
      })),
    };
  }

  /**
   * Força captura de primeira resposta para tickets pendentes
   */
  @Post('capture/force-pending')
  async forceCapturePendingResponses() {
    const result = await this.slaService.forceCapturePendingResponses();

    return {
      message: 'Processamento de tickets pendentes concluído',
      processed: result.processed,
      errors: result.errors,
      timestamp: new Date(),
    };
  }

  /**
   * Obtém estatísticas de captura de primeira resposta (Fase 2 expandida)
   */
  @Get('capture/stats')
  async getCaptureStats() {
    // Usar método do SlaService que já tem acesso ao repositório
    const pendingTickets =
      await this.slaService.getTicketsWithPendingFirstResponse();

    // Calcular estatísticas básicas
    const totalTickets = await this.slaService['ticketRepository']
      .createQueryBuilder('ticket')
      .where('ticket.assignedTo IS NOT NULL')
      .getCount();

    const capturedResponses = await this.slaService['ticketRepository'].count({
      where: { firstResponseCaptured: true },
    });

    const pendingResponses = pendingTickets.length;
    const captureRate =
      totalTickets > 0 ? (capturedResponses / totalTickets) * 100 : 0;

    return {
      totalTickets,
      capturedResponses,
      pendingResponses,
      captureRate: Math.round(captureRate * 100) / 100,
      // Estatísticas da Fase 2
      cacheStats: {
        activeCachedTickets: 0, // Placeholder - seria do MessageHandlerService
        cacheHitRate: 0,
      },
      validationStats: {
        totalValidations: 0,
        rejectedMessages: 0,
        averageConfidence: 85.0,
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Valida contexto de uma thread específica (Fase 2)
   */
  @Get('capture/validate-thread/:threadId')
  async validateThreadContext(@Param('threadId') threadId: string) {
    // Buscar ticket pelo threadId
    const ticket = await this.slaService['ticketRepository']
      .createQueryBuilder('ticket')
      .where("ticket.metadata->>'threadId' = :threadId", { threadId })
      .getOne();

    if (!ticket) {
      return {
        threadId,
        validation: {
          isValid: false,
          reason: 'Ticket não encontrado',
          threadAge: 0,
          messageCount: 0,
        },
        timestamp: new Date(),
      };
    }

    // Calcular idade da thread
    const threadAge = Date.now() - ticket.createdAt.getTime();
    const threadAgeHours = threadAge / (1000 * 60 * 60);

    // Validações de contexto
    if (threadAgeHours > 168) {
      // 7 dias
      return {
        threadId,
        validation: {
          isValid: false,
          reason: 'Thread muito antiga',
          threadAge: threadAgeHours,
          messageCount: 0,
        },
        timestamp: new Date(),
      };
    }

    return {
      threadId,
      validation: {
        isValid: true,
        threadAge: threadAgeHours,
        messageCount: 0, // Placeholder
      },
      timestamp: new Date(),
    };
  }

  /**
   * Obtém estatísticas detalhadas de validação (Fase 2)
   */
  @Get('capture/validation-stats')
  async getValidationStats() {
    return {
      message: 'Estatísticas de validação da Fase 2',
      filters: {
        botMessages: 'Filtradas automaticamente',
        slashCommands: 'Filtradas automaticamente',
        emptyMessages: 'Filtradas automaticamente',
        emojiOnly: 'Filtradas automaticamente',
        systemMessages: 'Filtradas automaticamente',
        spamMessages: 'Filtradas automaticamente',
        contextValidation: 'Implementada',
      },
      confidenceThreshold: '70%',
      cacheEnabled: true,
      cacheTTL: '5 minutos',
      lastUpdated: new Date(),
    };
  }

  /**
   * Obtém estatísticas de captura automática (Fase 3)
   */
  @Get('capture/auto-stats')
  async getAutoCaptureStats() {
    const stats = await this.slaService.getAutoCaptureStats();

    return {
      success: true,
      data: stats,
      timestamp: new Date(),
    };
  }

  /**
   * Obtém logs de captura para análise (Fase 3)
   */
  @Get('capture/logs')
  async getCaptureLogs(@Query('limit') limit?: number) {
    const logs = await this.slaService.getCaptureLogs(limit || 50);

    return {
      success: true,
      data: {
        logs,
        total: logs.length,
        limit: limit || 50,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Recalcula métricas SLA para todos os tickets (Fase 3)
   */
  @Post('recalculate-all')
  async recalculateAllSlaMetrics() {
    const result = await this.slaService.recalculateAllSlaMetrics();

    return {
      success: true,
      message: 'Recálculo de métricas SLA executado',
      result,
      timestamp: new Date(),
    };
  }

  /**
   * Aplica fallbacks para tickets antigos (Fase 3)
   */
  @Post('fallback/apply-all')
  async applyFallbacksForOldTickets() {
    const result = await this.slaService.forceCapturePendingResponses();

    return {
      success: true,
      message: 'Fallbacks aplicados para tickets antigos',
      result,
      timestamp: new Date(),
    };
  }

  /**
   * Obtém resumo da integração SLA (Fase 3)
   */
  @Get('integration/summary')
  async getSlaIntegrationSummary() {
    const autoStats = await this.slaService.getAutoCaptureStats();
    const captureLogs = await this.slaService.getCaptureLogs(10);

    return {
      success: true,
      data: {
        autoCaptureStats: autoStats,
        recentCaptureLogs: captureLogs,
        integrationStatus: {
          phase: 'Fase 3: Integração com SLA',
          autoCaptureEnabled: true,
          fallbackEnabled: true,
          dataQuality: autoStats.dataQuality,
          lastUpdated: new Date(),
        },
      },
      timestamp: new Date(),
    };
  }
}
