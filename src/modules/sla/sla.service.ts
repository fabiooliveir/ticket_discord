import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../../database/entities/ticket.entity';
import { SlaConfig } from '../../database/entities/sla-config.entity';
import { SlaCalculator } from '../../shared/utils/sla-calculator.util';
import {
  TicketPriority,
  SlaCategories,
} from '../../shared/enums/sla-categories.enum';
import { SlaStatus } from '../../shared/enums/sla-targets.enum';
import { SlaMetricsResponseDto } from '../../shared/dto/sla-metrics.dto';

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(SlaConfig)
    private readonly slaConfigRepository: Repository<SlaConfig>,
  ) {}

  /**
   * Calcula métricas de SLA para todos os tickets (Fase 3: Dados Automáticos)
   */
  async calculateSlaMetrics(): Promise<SlaMetricsResponseDto> {
    const tickets = await this.ticketRepository.find({
      where: { status: 'closed' },
    });

    // Fase 3: Usar dados automáticos da captura
    const metrics = await this.processSlaMetricsWithAutoCapture(tickets);
    
    this.logger.log(`📊 SLA Metrics calculadas para ${tickets.length} tickets usando captura automática`);
    return metrics;
  }

  /**
   * Calcula métricas de SLA para tickets em um período específico (Fase 3: Dados Automáticos)
   */
  async calculateSlaMetricsByPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<SlaMetricsResponseDto> {
    const tickets = await this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.status = :status', { status: 'closed' })
      .andWhere('ticket.closedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    // Fase 3: Usar dados automáticos da captura
    const metrics = await this.processSlaMetricsWithAutoCapture(tickets);
    
    this.logger.log(`📊 SLA Metrics calculadas para ${tickets.length} tickets no período ${startDate.toISOString()} - ${endDate.toISOString()}`);
    return metrics;
  }

  /**
   * Calcula métricas de SLA para um ticket específico
   */
  async calculateTicketSlaMetrics(ticketId: string): Promise<{
    responseTimeMinutes: number;
    resolutionTimeMinutes: number;
    responseSlaStatus: SlaStatus;
    resolutionSlaStatus: SlaStatus;
  }> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error(`Ticket ${ticketId} não encontrado`);
    }

    const responseTimeMinutes = SlaCalculator.calculateResponseTime(
      ticket.createdAt,
      ticket.firstResponseAt,
      ticket.slaCategory as SlaCategories,
    );

    const resolutionTimeMinutes = SlaCalculator.calculateResolutionTime(
      ticket.createdAt,
      ticket.resolvedAt,
      ticket.slaCategory as SlaCategories,
    );

    const responseSlaStatus = SlaCalculator.getResponseSlaStatus(
      responseTimeMinutes,
      ticket.priority as TicketPriority,
    );

    const resolutionSlaStatus = SlaCalculator.getResolutionSlaStatus(
      resolutionTimeMinutes,
      ticket.priority as TicketPriority,
    );

    return {
      responseTimeMinutes,
      resolutionTimeMinutes,
      responseSlaStatus,
      resolutionSlaStatus,
    };
  }

  /**
   * Atualiza os tempos de SLA de um ticket
   */
  async updateTicketSlaMetrics(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error(`Ticket ${ticketId} não encontrado`);
    }

    // Calcular tempos de SLA
    const responseTimeMinutes = SlaCalculator.calculateResponseTime(
      ticket.createdAt,
      ticket.firstResponseAt,
      ticket.slaCategory as SlaCategories,
    );

    const resolutionTimeMinutes = SlaCalculator.calculateResolutionTime(
      ticket.createdAt,
      ticket.resolvedAt,
      ticket.slaCategory as SlaCategories,
    );

    // Atualizar ticket com os tempos calculados
    ticket.responseTimeMinutes = responseTimeMinutes;
    ticket.resolutionTimeMinutes = resolutionTimeMinutes;

    return await this.ticketRepository.save(ticket);
  }

  /**
   * Obtém tickets com primeira resposta pendente de captura
   */
  async getTicketsWithPendingFirstResponse(): Promise<Ticket[]> {
    return await this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.assignedTo IS NOT NULL')
      .andWhere('ticket.firstResponseCaptured = :captured', { captured: false })
      .andWhere('ticket.status != :status', { status: 'closed' })
      .orderBy('ticket.createdAt', 'ASC')
      .getMany();
  }

  /**
   * Processa métricas de SLA usando dados automáticos da captura (Fase 3)
   */
  private async processSlaMetricsWithAutoCapture(tickets: Ticket[]): Promise<SlaMetricsResponseDto> {
    let totalTickets = 0;
    let compliantTickets = 0;
    let atRiskTickets = 0;
    let breachedTickets = 0;
    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let ticketsWithResponse = 0;
    let ticketsWithResolution = 0;

    const metricsByPriority: Record<string, any> = {};

    // Fase 3: Logs de captura detalhados
    this.logger.log(`🔄 Processando ${tickets.length} tickets para métricas SLA...`);

    tickets.forEach((ticket) => {
      totalTickets++;

      // Fase 3: Usar dados automáticos quando disponíveis
      let responseTimeMinutes = 0;
      let resolutionTimeMinutes = 0;

      if (ticket.firstResponseCaptured && ticket.firstResponseAt) {
        // Usar dados automáticos da captura
        responseTimeMinutes = ticket.responseTimeMinutes || 
          SlaCalculator.calculateResponseTime(
            ticket.createdAt,
            ticket.firstResponseAt,
            ticket.slaCategory as SlaCategories,
          );
        
        this.logger.debug(`✅ Ticket ${ticket.id}: Usando dados automáticos de captura - ${responseTimeMinutes}min`);
      } else {
        // Fallback para tickets antigos (Fase 3)
        if (ticket.firstResponseAt) {
          responseTimeMinutes = SlaCalculator.calculateResponseTime(
            ticket.createdAt,
            ticket.firstResponseAt,
            ticket.slaCategory as SlaCategories,
          );
          this.logger.debug(`⚠️ Ticket ${ticket.id}: Usando fallback para dados de captura - ${responseTimeMinutes}min`);
        } else {
          this.logger.debug(`❌ Ticket ${ticket.id}: Sem dados de primeira resposta`);
        }
      }

      // Calcular tempo de resolução
      if (ticket.resolvedAt) {
        resolutionTimeMinutes = ticket.resolutionTimeMinutes ||
          SlaCalculator.calculateResolutionTime(
            ticket.createdAt,
            ticket.resolvedAt,
            ticket.slaCategory as SlaCategories,
          );
      }

      // Calcular status de SLA
      const responseSlaStatus = SlaCalculator.getResponseSlaStatus(
        responseTimeMinutes,
        ticket.priority as TicketPriority,
      );

      const resolutionSlaStatus = SlaCalculator.getResolutionSlaStatus(
        resolutionTimeMinutes,
        ticket.priority as TicketPriority,
      );

      // Contar tickets por status
      if (responseSlaStatus === SlaStatus.COMPLIANT) {
        compliantTickets++;
      } else if (responseSlaStatus === SlaStatus.AT_RISK) {
        atRiskTickets++;
      } else if (responseSlaStatus === SlaStatus.BREACHED) {
        breachedTickets++;
      }

      // Acumular tempos
      if (responseTimeMinutes > 0) {
        totalResponseTime += responseTimeMinutes;
        ticketsWithResponse++;
      }

      if (resolutionTimeMinutes > 0) {
        totalResolutionTime += resolutionTimeMinutes;
        ticketsWithResolution++;
      }

      // Métricas por prioridade
      if (!metricsByPriority[ticket.priority]) {
        metricsByPriority[ticket.priority] = {
          total: 0,
          compliant: 0,
          atRisk: 0,
          breached: 0,
          totalResponseTime: 0,
          totalResolutionTime: 0,
          ticketsWithResponse: 0,
          ticketsWithResolution: 0,
        };
      }

      const priorityMetrics = metricsByPriority[ticket.priority];
      priorityMetrics.total++;
      
      if (responseSlaStatus === SlaStatus.COMPLIANT) {
        priorityMetrics.compliant++;
      } else if (responseSlaStatus === SlaStatus.AT_RISK) {
        priorityMetrics.atRisk++;
      } else if (responseSlaStatus === SlaStatus.BREACHED) {
        priorityMetrics.breached++;
      }

      if (responseTimeMinutes > 0) {
        priorityMetrics.totalResponseTime += responseTimeMinutes;
        priorityMetrics.ticketsWithResponse++;
      }

      if (resolutionTimeMinutes > 0) {
        priorityMetrics.totalResolutionTime += resolutionTimeMinutes;
        priorityMetrics.ticketsWithResolution++;
      }
    });

    // Calcular métricas finais
    const complianceRate = SlaCalculator.calculateComplianceRate(compliantTickets, totalTickets);
    const averageResponseTime = ticketsWithResponse > 0 ? Math.round(totalResponseTime / ticketsWithResponse) : 0;
    const averageResolutionTime = ticketsWithResolution > 0 ? Math.round(totalResolutionTime / ticketsWithResolution) : 0;

    // Calcular métricas por prioridade
    Object.keys(metricsByPriority).forEach((priority) => {
      const priorityMetrics = metricsByPriority[priority];
      priorityMetrics.complianceRate = SlaCalculator.calculateComplianceRate(
        priorityMetrics.compliant,
        priorityMetrics.total,
      );
      priorityMetrics.avgResponseTime = priorityMetrics.ticketsWithResponse > 0 
        ? Math.round(priorityMetrics.totalResponseTime / priorityMetrics.ticketsWithResponse) 
        : 0;
      priorityMetrics.avgResolutionTime = priorityMetrics.ticketsWithResolution > 0 
        ? Math.round(priorityMetrics.totalResolutionTime / priorityMetrics.ticketsWithResolution) 
        : 0;
    });

    // Fase 3: Log de resumo
    this.logger.log(`📈 SLA Metrics processadas - Total: ${totalTickets}, Compliant: ${compliantTickets}, Compliance: ${complianceRate}%`);

    return {
      totalTickets,
      compliantTickets,
      atRiskTickets,
      breachedTickets,
      complianceRate,
      averageResponseTime,
      averageResolutionTime,
      metricsByPriority,
    };
  }

  /**
   * Força captura de primeira resposta para tickets pendentes (Fase 3: Fallbacks Avançados)
   */
  async forceCapturePendingResponses(): Promise<{
    processed: number;
    errors: string[];
    fallbackApplied: number;
    autoCaptured: number;
  }> {
    const pendingTickets = await this.getTicketsWithPendingFirstResponse();
    const errors: string[] = [];
    let processed = 0;
    let fallbackApplied = 0;
    let autoCaptured = 0;

    this.logger.log(`🔄 Iniciando captura forçada para ${pendingTickets.length} tickets pendentes...`);

    for (const ticket of pendingTickets) {
      try {
        // Fase 3: Implementar fallbacks para tickets antigos
        const fallbackResult = await this.applyFallbackForOldTicket(ticket);
        
        if (fallbackResult.success) {
          if (fallbackResult.method === 'auto') {
            autoCaptured++;
            this.logger.log(`✅ Ticket ${ticket.id}: Captura automática aplicada via fallback`);
          } else {
            fallbackApplied++;
            this.logger.log(`⚠️ Ticket ${ticket.id}: Fallback manual aplicado - ${fallbackResult.method}`);
          }
        } else {
          this.logger.warn(
            `❌ Ticket ${ticket.id} possui primeira resposta pendente - Agente: ${ticket.assignedTo} - Thread: ${ticket.metadata?.threadId || 'N/A'}`,
          );
        }
        
        processed++;
      } catch (error) {
        const errorMsg = `Erro ao processar ticket ${ticket.id}: ${error.message}`;
        errors.push(errorMsg);
        this.logger.error(errorMsg);
      }
    }

    this.logger.log(`📊 Captura forçada concluída - Processados: ${processed}, Auto: ${autoCaptured}, Fallback: ${fallbackApplied}, Erros: ${errors.length}`);

    return { 
      processed, 
      errors, 
      fallbackApplied, 
      autoCaptured 
    };
  }

  /**
   * Aplica fallback para tickets antigos sem captura automática (Fase 3)
   */
  private async applyFallbackForOldTicket(ticket: Ticket): Promise<{
    success: boolean;
    method: string;
    responseTime?: number;
  }> {
    try {
      // Método 1: Tentar usar firstResponseAt se existir mas firstResponseCaptured for false
      if (ticket.firstResponseAt && !ticket.firstResponseCaptured) {
        const responseTime = SlaCalculator.calculateResponseTime(
          ticket.createdAt,
          ticket.firstResponseAt,
          ticket.slaCategory as SlaCategories,
        );

        // Atualizar ticket com dados de fallback
        ticket.firstResponseCaptured = true;
        ticket.responseTimeMinutes = responseTime;
        ticket.metadata = {
          ...ticket.metadata,
          firstResponseCapturedAt: new Date(),
          firstResponseFallback: true,
          fallbackMethod: 'existing_firstResponseAt',
        };
        await this.ticketRepository.save(ticket);

        return {
          success: true,
          method: 'existing_firstResponseAt',
          responseTime,
        };
      }

      // Método 2: Tentar usar resolvedAt como proxy para primeira resposta (último recurso)
      if (ticket.resolvedAt && !ticket.firstResponseCaptured) {
        const responseTime = SlaCalculator.calculateResponseTime(
          ticket.createdAt,
          ticket.resolvedAt,
          ticket.slaCategory as SlaCategories,
        );

        // Atualizar ticket com dados de fallback usando resolvedAt
        ticket.firstResponseAt = ticket.resolvedAt;
        ticket.firstResponseCaptured = true;
        ticket.responseTimeMinutes = responseTime;
        ticket.metadata = {
          ...ticket.metadata,
          firstResponseCapturedAt: new Date(),
          firstResponseFallback: true,
          fallbackMethod: 'resolvedAt_proxy',
        };
        await this.ticketRepository.save(ticket);

        return {
          success: true,
          method: 'resolvedAt_proxy',
          responseTime,
        };
      }

      // Método 3: Estimar primeira resposta baseada em padrões históricos
      if (!ticket.firstResponseAt && !ticket.firstResponseCaptured) {
        const estimatedResponseTime = await this.estimateResponseTimeFromPatterns(ticket);
        
        if (estimatedResponseTime > 0) {
          const estimatedFirstResponse = new Date(
            ticket.createdAt.getTime() + (estimatedResponseTime * 60 * 1000)
          );

          ticket.firstResponseAt = estimatedFirstResponse;
          ticket.firstResponseCaptured = true;
          ticket.responseTimeMinutes = estimatedResponseTime;
          ticket.metadata = {
            ...ticket.metadata,
            firstResponseCapturedAt: new Date(),
            firstResponseFallback: true,
            fallbackMethod: 'estimated_pattern',
            estimatedResponseTime,
          };
          await this.ticketRepository.save(ticket);

          return {
            success: true,
            method: 'estimated_pattern',
            responseTime: estimatedResponseTime,
          };
        }
      }

      return {
        success: false,
        method: 'none',
      };

    } catch (error) {
      this.logger.error(`Erro ao aplicar fallback para ticket ${ticket.id}:`, error);
      return {
        success: false,
        method: 'error',
      };
    }
  }

  /**
   * Estima tempo de resposta baseado em padrões históricos (Fase 3)
   */
  private async estimateResponseTimeFromPatterns(ticket: Ticket): Promise<number> {
    try {
      // Buscar tickets similares para estimar padrão
      const similarTickets = await this.ticketRepository
        .createQueryBuilder('ticket')
        .where('ticket.priority = :priority', { priority: ticket.priority })
        .andWhere('ticket.firstResponseCaptured = :captured', { captured: true })
        .andWhere('ticket.responseTimeMinutes IS NOT NULL')
        .andWhere('ticket.createdAt >= :date', { 
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // últimos 30 dias
        })
        .orderBy('ticket.createdAt', 'DESC')
        .limit(10)
        .getMany();

      if (similarTickets.length === 0) {
        // Usar targets padrão se não houver dados históricos
        return SlaCalculator.getResponseTimeTarget(ticket.priority as TicketPriority);
      }

      // Calcular média dos tempos de resposta similares
      const totalTime = similarTickets.reduce((sum, t) => sum + (t.responseTimeMinutes || 0), 0);
      const averageTime = Math.round(totalTime / similarTickets.length);

      this.logger.debug(`📊 Estimativa para ticket ${ticket.id}: ${averageTime}min baseado em ${similarTickets.length} tickets similares`);

      return averageTime;

    } catch (error) {
      this.logger.error(`Erro ao estimar tempo de resposta para ticket ${ticket.id}:`, error);
      // Fallback para target padrão
      return SlaCalculator.getResponseTimeTarget(ticket.priority as TicketPriority);
    }
  }

  /**
   * Obtém configurações de SLA ativas
   */
  async getActiveSlaConfigs(): Promise<SlaConfig[]> {
    return await this.slaConfigRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', priority: 'ASC' },
    });
  }

  /**
   * Obtém estatísticas de captura automática (Fase 3)
   */
  async getAutoCaptureStats(): Promise<{
    totalTickets: number;
    autoCaptured: number;
    fallbackApplied: number;
    pendingCaptures: number;
    captureRate: number;
    fallbackRate: number;
    dataQuality: {
      highQuality: number;    // Dados automáticos
      mediumQuality: number;  // Fallback aplicado
      lowQuality: number;     // Sem dados
    };
  }> {
    try {
      // Tickets com captura automática
      const autoCaptured = await this.ticketRepository
        .createQueryBuilder('ticket')
        .where('ticket.firstResponseCaptured = :captured', { captured: true })
        .andWhere("ticket.metadata->>'firstResponseFallback' IS NULL OR ticket.metadata->>'firstResponseFallback' != 'true'")
        .getCount();

      // Tickets com fallback aplicado
      const fallbackApplied = await this.ticketRepository
        .createQueryBuilder('ticket')
        .where("ticket.metadata->>'firstResponseFallback' = 'true'")
        .getCount();

      // Tickets pendentes
      const pendingCaptures = await this.ticketRepository
        .createQueryBuilder('ticket')
        .where('ticket.assignedTo IS NOT NULL')
        .andWhere('ticket.firstResponseCaptured = :captured', { captured: false })
        .andWhere('ticket.status != :status', { status: 'closed' })
        .getCount();

      // Total de tickets
      const totalTickets = await this.ticketRepository
        .createQueryBuilder('ticket')
        .where('ticket.assignedTo IS NOT NULL')
        .getCount();

      // Calcular taxas
      const captureRate = totalTickets > 0 ? (autoCaptured / totalTickets) * 100 : 0;
      const fallbackRate = totalTickets > 0 ? (fallbackApplied / totalTickets) * 100 : 0;

      // Calcular qualidade dos dados
      const highQuality = autoCaptured;
      const mediumQuality = fallbackApplied;
      const lowQuality = totalTickets - highQuality - mediumQuality;

      this.logger.log(`📊 Estatísticas de captura automática - Auto: ${autoCaptured}, Fallback: ${fallbackApplied}, Pendentes: ${pendingCaptures}`);

      return {
        totalTickets,
        autoCaptured,
        fallbackApplied,
        pendingCaptures,
        captureRate: Math.round(captureRate * 100) / 100,
        fallbackRate: Math.round(fallbackRate * 100) / 100,
        dataQuality: {
          highQuality,
          mediumQuality,
          lowQuality,
        },
      };

    } catch (error) {
      this.logger.error('Erro ao obter estatísticas de captura automática:', error);
      return {
        totalTickets: 0,
        autoCaptured: 0,
        fallbackApplied: 0,
        pendingCaptures: 0,
        captureRate: 0,
        fallbackRate: 0,
        dataQuality: {
          highQuality: 0,
          mediumQuality: 0,
          lowQuality: 0,
        },
      };
    }
  }

  /**
   * Obtém logs de captura para análise (Fase 3)
   */
  async getCaptureLogs(limit: number = 50): Promise<Array<{
    ticketId: string;
    captureMethod: string;
    captureDate: Date;
    responseTime: number;
    fallbackApplied: boolean;
    threadId?: string;
    agentId?: string;
  }>> {
    try {
      const tickets = await this.ticketRepository
        .createQueryBuilder('ticket')
        .where('ticket.firstResponseCaptured = :captured', { captured: true })
        .orderBy('ticket.updatedAt', 'DESC')
        .limit(limit)
        .getMany();

      const logs = tickets.map(ticket => {
        const metadata = ticket.metadata || {};
        const fallbackApplied = metadata.firstResponseFallback === true;
        
        return {
          ticketId: ticket.id,
          captureMethod: fallbackApplied ? metadata.fallbackMethod || 'unknown' : 'automatic',
          captureDate: metadata.firstResponseCapturedAt ? new Date(metadata.firstResponseCapturedAt) : ticket.updatedAt,
          responseTime: ticket.responseTimeMinutes || 0,
          fallbackApplied,
          threadId: metadata.threadId,
          agentId: ticket.assignedTo,
        };
      });

      this.logger.debug(`📋 Logs de captura obtidos: ${logs.length} registros`);

      return logs;

    } catch (error) {
      this.logger.error('Erro ao obter logs de captura:', error);
      return [];
    }
  }

  /**
   * Recalcula métricas SLA para todos os tickets (Fase 3: Atualização em Lote)
   */
  async recalculateAllSlaMetrics(): Promise<{
    processed: number;
    updated: number;
    errors: string[];
  }> {
    try {
      this.logger.log('🔄 Iniciando recálculo de métricas SLA para todos os tickets...');

      const tickets = await this.ticketRepository.find({
        where: { status: 'closed' },
      });

      let processed = 0;
      let updated = 0;
      const errors: string[] = [];

      for (const ticket of tickets) {
        try {
          // Recalcular usando dados automáticos
          const responseTimeMinutes = ticket.firstResponseCaptured && ticket.firstResponseAt
            ? (ticket.responseTimeMinutes || SlaCalculator.calculateResponseTime(
                ticket.createdAt,
                ticket.firstResponseAt,
                ticket.slaCategory as SlaCategories,
              ))
            : 0;

          const resolutionTimeMinutes = ticket.resolvedAt
            ? (ticket.resolutionTimeMinutes || SlaCalculator.calculateResolutionTime(
                ticket.createdAt,
                ticket.resolvedAt,
                ticket.slaCategory as SlaCategories,
              ))
            : 0;

          // Atualizar ticket se necessário
          if (ticket.responseTimeMinutes !== responseTimeMinutes || 
              ticket.resolutionTimeMinutes !== resolutionTimeMinutes) {
            
            ticket.responseTimeMinutes = responseTimeMinutes;
            ticket.resolutionTimeMinutes = resolutionTimeMinutes;
            ticket.metadata = {
              ...ticket.metadata,
              lastRecalculated: new Date(),
              recalculationMethod: 'phase3_automatic',
            };
            await this.ticketRepository.save(ticket);
            
            updated++;
            this.logger.debug(`✅ Ticket ${ticket.id}: Métricas recalculadas - Response: ${responseTimeMinutes}min, Resolution: ${resolutionTimeMinutes}min`);
          }

          processed++;

        } catch (error) {
          const errorMsg = `Erro ao recalcular métricas do ticket ${ticket.id}: ${error.message}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      this.logger.log(`📊 Recálculo concluído - Processados: ${processed}, Atualizados: ${updated}, Erros: ${errors.length}`);

      return { processed, updated, errors };

    } catch (error) {
      this.logger.error('Erro ao recalcular métricas SLA:', error);
      return { processed: 0, updated: 0, errors: [error.message] };
    }
  }

  /**
   * Obtém configuração de SLA por categoria e prioridade
   */
  async getSlaConfig(
    category: string,
    priority: string,
  ): Promise<SlaConfig | null> {
    return await this.slaConfigRepository.findOne({
      where: { category, priority, isActive: true },
    });
  }

  /**
   * Cria nova configuração de SLA
   */
  async createSlaConfig(configData: {
    name: string;
    category: string;
    priority: string;
    responseTimeTarget: number;
    resolutionTimeTarget: number;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<SlaConfig> {
    const config = this.slaConfigRepository.create(configData);
    return await this.slaConfigRepository.save(config);
  }

  /**
   * Processa métricas de SLA para uma lista de tickets
   */
  private processSlaMetrics(tickets: Ticket[]): SlaMetricsResponseDto {
    const totalTickets = tickets.length;
    let compliantTickets = 0;
    let atRiskTickets = 0;
    let breachedTickets = 0;
    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let ticketsWithResponse = 0;
    let ticketsWithResolution = 0;

    const metricsByPriority: Record<string, any> = {};

    tickets.forEach((ticket) => {
      const responseTimeMinutes = SlaCalculator.calculateResponseTime(
        ticket.createdAt,
        ticket.firstResponseAt,
        ticket.slaCategory as SlaCategories,
      );

      const resolutionTimeMinutes = SlaCalculator.calculateResolutionTime(
        ticket.createdAt,
        ticket.resolvedAt,
        ticket.slaCategory as SlaCategories,
      );

      const resolutionSlaStatus = SlaCalculator.getResolutionSlaStatus(
        resolutionTimeMinutes,
        ticket.priority as TicketPriority,
      );

      // Contar status geral (usando resolução como métrica principal)
      switch (resolutionSlaStatus) {
        case SlaStatus.COMPLIANT:
          compliantTickets++;
          break;
        case SlaStatus.AT_RISK:
          atRiskTickets++;
          break;
        case SlaStatus.BREACHED:
          breachedTickets++;
          break;
      }

      // Acumular tempos
      if (responseTimeMinutes > 0) {
        totalResponseTime += responseTimeMinutes;
        ticketsWithResponse++;
      }

      if (resolutionTimeMinutes > 0) {
        totalResolutionTime += resolutionTimeMinutes;
        ticketsWithResolution++;
      }

      // Agrupar por prioridade
      const priority = ticket.priority || 'unknown';
      if (!metricsByPriority[priority]) {
        metricsByPriority[priority] = {
          total: 0,
          compliant: 0,
          atRisk: 0,
          breached: 0,
          totalResponseTime: 0,
          totalResolutionTime: 0,
          ticketsWithResponse: 0,
          ticketsWithResolution: 0,
        };
      }

      const priorityMetrics = metricsByPriority[priority];
      priorityMetrics.total++;

      switch (resolutionSlaStatus) {
        case SlaStatus.COMPLIANT:
          priorityMetrics.compliant++;
          break;
        case SlaStatus.AT_RISK:
          priorityMetrics.atRisk++;
          break;
        case SlaStatus.BREACHED:
          priorityMetrics.breached++;
          break;
      }

      if (responseTimeMinutes > 0) {
        priorityMetrics.totalResponseTime += responseTimeMinutes;
        priorityMetrics.ticketsWithResponse++;
      }

      if (resolutionTimeMinutes > 0) {
        priorityMetrics.totalResolutionTime += resolutionTimeMinutes;
        priorityMetrics.ticketsWithResolution++;
      }
    });

    // Calcular métricas finais
    const complianceRate = SlaCalculator.calculateComplianceRate(
      compliantTickets,
      totalTickets,
    );

    const averageResponseTime =
      ticketsWithResponse > 0
        ? Math.round(totalResponseTime / ticketsWithResponse)
        : 0;

    const averageResolutionTime =
      ticketsWithResolution > 0
        ? Math.round(totalResolutionTime / ticketsWithResolution)
        : 0;

    // Processar métricas por prioridade
    Object.keys(metricsByPriority).forEach((priority) => {
      const metrics = metricsByPriority[priority];
      metrics.complianceRate = SlaCalculator.calculateComplianceRate(
        metrics.compliant,
        metrics.total,
      );
      metrics.avgResponseTime =
        metrics.ticketsWithResponse > 0
          ? Math.round(metrics.totalResponseTime / metrics.ticketsWithResponse)
          : 0;
      metrics.avgResolutionTime =
        metrics.ticketsWithResolution > 0
          ? Math.round(
              metrics.totalResolutionTime / metrics.ticketsWithResolution,
            )
          : 0;

      // Remover campos internos
      delete metrics.totalResponseTime;
      delete metrics.totalResolutionTime;
      delete metrics.ticketsWithResponse;
      delete metrics.ticketsWithResolution;
    });

    return {
      totalTickets,
      compliantTickets,
      atRiskTickets,
      breachedTickets,
      complianceRate,
      averageResponseTime,
      averageResolutionTime,
      metricsByPriority,
    };
  }
}
