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
   * Calcula métricas de SLA para todos os tickets
   */
  async calculateSlaMetrics(): Promise<SlaMetricsResponseDto> {
    const tickets = await this.ticketRepository.find({
      where: { status: 'closed' },
    });

    const metrics = this.processSlaMetrics(tickets);
    return metrics;
  }

  /**
   * Calcula métricas de SLA para tickets em um período específico
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

    const metrics = this.processSlaMetrics(tickets);
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
   * Obtém configurações de SLA ativas
   */
  async getActiveSlaConfigs(): Promise<SlaConfig[]> {
    return await this.slaConfigRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', priority: 'ASC' },
    });
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
