import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Ticket } from '../../database/entities/ticket.entity';
import { SlaConfig } from '../../database/entities/sla-config.entity';
import { SlaService } from '../sla/sla.service';
import { SlaCalculator } from '../../shared/utils/sla-calculator.util';
import {
  TicketPriority,
  SlaCategories,
} from '../../shared/enums/sla-categories.enum';
import { SlaStatus } from '../../shared/enums/sla-targets.enum';

export interface DashboardOverview {
  summary: {
    totalTickets: number;
    openTickets: number;
    closedTickets: number;
    complianceRate: number;
    averageResponseTime: number;
    averageResolutionTime: number;
    slaBreaches: number;
    // Fase 3: Métricas de SLA de Primeira Resposta
    firstResponseSla: {
      averageFirstResponseTime: number; // Tempo médio para primeira resposta (minutos)
      firstResponseComplianceRate: number; // % de tickets dentro do SLA de primeira resposta
      ticketsWithFirstResponse: number; // Tickets que receberam primeira resposta
      ticketsWithoutFirstResponse: number; // Tickets aguardando primeira resposta
      slaBreaches: number; // Tickets que violaram SLA de primeira resposta
      slaAtRisk: number; // Tickets próximos de violar SLA
      performanceByPriority: {
        critical: { avgTime: number; complianceRate: number; total: number; };
        high: { avgTime: number; complianceRate: number; total: number; };
        medium: { avgTime: number; complianceRate: number; total: number; };
        low: { avgTime: number; complianceRate: number; total: number; };
      };
    };
  };
  trends: {
    ticketsCreatedToday: number;
    ticketsClosedToday: number;
    ticketsCreatedThisWeek: number;
    ticketsClosedThisWeek: number;
    ticketsCreatedThisMonth: number;
    ticketsClosedThisMonth: number;
  };
  performance: {
    topPerformingAgents: Array<{
      agentId: string;
      ticketsResolved: number;
      averageResolutionTime: number;
      complianceRate: number;
    }>;
    slaPerformance: {
      critical: { compliant: number; total: number; rate: number };
      high: { compliant: number; total: number; rate: number };
      medium: { compliant: number; total: number; rate: number };
      low: { compliant: number; total: number; rate: number };
    };
  };
  alerts: Array<{
    type: 'breach' | 'at_risk' | 'high_volume';
    message: string;
    count: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface DashboardMetrics {
  timeRange: {
    start: Date;
    end: Date;
    period: 'today' | 'week' | 'month' | 'quarter' | 'year';
  };
  volumeMetrics: {
    totalTickets: number;
    ticketsCreated: number;
    ticketsClosed: number;
    ticketsResolved: number;
    ticketsPending: number;
  };
  slaMetrics: {
    overallCompliance: number;
    averageResponseTime: number;
    averageResolutionTime: number;
    slaBreaches: number;
    slaAtRisk: number;
  };
  categoryMetrics: Record<
    string,
    {
      total: number;
      compliant: number;
      averageResponseTime: number;
      averageResolutionTime: number;
      complianceRate: number;
    }
  >;
  priorityMetrics: Record<
    string,
    {
      total: number;
      compliant: number;
      averageResponseTime: number;
      averageResolutionTime: number;
      complianceRate: number;
    }
  >;
  agentMetrics: Array<{
    agentId: string;
    agentName?: string;
    ticketsAssigned: number;
    ticketsResolved: number;
    averageResponseTime: number;
    averageResolutionTime: number;
    complianceRate: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    ticketsCreated: number;
    ticketsResolved: number;
  }>;
  dailyTrends: Array<{
    date: string;
    ticketsCreated: number;
    ticketsClosed: number;
    complianceRate: number;
  }>;
}

export interface PerformanceReport {
  period: string;
  summary: {
    totalAgents: number;
    activeAgents: number;
    totalTickets: number;
    resolvedTickets: number;
    overallCompliance: number;
  };
  agentPerformance: Array<{
    agentId: string;
    agentName?: string;
    metrics: {
      ticketsAssigned: number;
      ticketsResolved: number;
      averageResponseTime: number;
      averageResolutionTime: number;
      complianceRate: number;
      slaBreaches: number;
    };
    trends: {
      weekOverWeek: number;
      monthOverMonth: number;
    };
  }>;
  teamPerformance: {
    teamName: string;
    metrics: {
      totalTickets: number;
      resolvedTickets: number;
      averageResponseTime: number;
      averageResolutionTime: number;
      complianceRate: number;
    };
  };
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(SlaConfig)
    private readonly slaConfigRepository: Repository<SlaConfig>,
    private readonly slaService: SlaService,
  ) {}

  /**
   * Obtém visão geral do dashboard
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 7);
    const endOfWeek = new Date(today);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Buscar tickets
    const [allTickets, todayTickets, weekTickets, monthTickets] =
      await Promise.all([
        this.ticketRepository.find(),
        this.ticketRepository.find({
          where: {
            createdAt: Between(startOfDay, endOfDay),
          },
        }),
        this.ticketRepository.find({
          where: {
            createdAt: Between(startOfWeek, endOfWeek),
          },
        }),
        this.ticketRepository.find({
          where: {
            createdAt: Between(startOfMonth, endOfMonth),
          },
        }),
      ]);

    // Calcular métricas SLA
    const slaMetrics = await this.slaService.calculateSlaMetrics();

    // Fase 3: Calcular métricas de SLA de primeira resposta
    const firstResponseSlaMetrics = await this.calculateFirstResponseSlaMetrics(allTickets);

    // Calcular tendências
    const trends = {
      ticketsCreatedToday: todayTickets.length,
      ticketsClosedToday: todayTickets.filter((t) => t.status === 'closed')
        .length,
      ticketsCreatedThisWeek: weekTickets.length,
      ticketsClosedThisWeek: weekTickets.filter((t) => t.status === 'closed')
        .length,
      ticketsCreatedThisMonth: monthTickets.length,
      ticketsClosedThisMonth: monthTickets.filter((t) => t.status === 'closed')
        .length,
    };

    // Calcular performance por agente
    const agentPerformance = await this.calculateAgentPerformance();

    // Calcular performance SLA por prioridade
    const slaPerformance = await this.calculateSlaPerformanceByPriority();

    // Gerar alertas
    const alerts = await this.generateAlerts();

    return {
      summary: {
        totalTickets: allTickets.length,
        openTickets: allTickets.filter(
          (t) => t.status === 'open' || t.status === 'in_progress',
        ).length,
        closedTickets: allTickets.filter((t) => t.status === 'closed').length,
        complianceRate: slaMetrics.complianceRate,
        averageResponseTime: slaMetrics.averageResponseTime,
        averageResolutionTime: slaMetrics.averageResolutionTime,
        slaBreaches: slaMetrics.breachedTickets,
        // Fase 3: Métricas de SLA de Primeira Resposta
        firstResponseSla: firstResponseSlaMetrics,
      },
      trends,
      performance: {
        topPerformingAgents: agentPerformance.slice(0, 5),
        slaPerformance,
      },
      alerts,
    };
  }

  /**
   * Calcula métricas de SLA de primeira resposta (Fase 3)
   */
  private async calculateFirstResponseSlaMetrics(tickets: Ticket[]): Promise<{
    averageFirstResponseTime: number;
    firstResponseComplianceRate: number;
    ticketsWithFirstResponse: number;
    ticketsWithoutFirstResponse: number;
    slaBreaches: number;
    slaAtRisk: number;
    performanceByPriority: {
      critical: { avgTime: number; complianceRate: number; total: number; };
      high: { avgTime: number; complianceRate: number; total: number; };
      medium: { avgTime: number; complianceRate: number; total: number; };
      low: { avgTime: number; complianceRate: number; total: number; };
    };
  }> {
    const ticketsWithAgent = tickets.filter(t => t.assignedTo);
    const ticketsWithFirstResponse = ticketsWithAgent.filter(t => t.firstResponseCaptured && t.firstResponseAt);
    const ticketsWithoutFirstResponse = ticketsWithAgent.filter(t => !t.firstResponseCaptured || !t.firstResponseAt);

    // Calcular tempo médio de primeira resposta
    let totalResponseTime = 0;
    let compliantTickets = 0;
    let breachedTickets = 0;
    let atRiskTickets = 0;

    const performanceByPriority = {
      critical: { avgTime: 0, complianceRate: 0, total: 0, compliant: 0 },
      high: { avgTime: 0, complianceRate: 0, total: 0, compliant: 0 },
      medium: { avgTime: 0, complianceRate: 0, total: 0, compliant: 0 },
      low: { avgTime: 0, complianceRate: 0, total: 0, compliant: 0 },
    };

    ticketsWithFirstResponse.forEach(ticket => {
      if (ticket.firstResponseAt && ticket.responseTimeMinutes !== null) {
        const responseTime = ticket.responseTimeMinutes;
        const priority = ticket.priority?.toLowerCase() as keyof typeof performanceByPriority;
        
        if (priority && performanceByPriority[priority]) {
          performanceByPriority[priority].total++;
          performanceByPriority[priority].avgTime += responseTime;
        }

        totalResponseTime += responseTime;

        // Calcular status SLA baseado na prioridade
        const slaStatus = SlaCalculator.getResponseSlaStatus(
          responseTime,
          ticket.priority as TicketPriority
        );

        if (slaStatus === SlaStatus.COMPLIANT) {
          compliantTickets++;
          if (priority && performanceByPriority[priority]) {
            performanceByPriority[priority].compliant++;
          }
        } else if (slaStatus === SlaStatus.BREACHED) {
          breachedTickets++;
        } else if (slaStatus === SlaStatus.AT_RISK) {
          atRiskTickets++;
        }
      }
    });

    // Calcular médias por prioridade
    Object.keys(performanceByPriority).forEach(priority => {
      const p = priority as keyof typeof performanceByPriority;
      if (performanceByPriority[p].total > 0) {
        performanceByPriority[p].avgTime = Math.round(performanceByPriority[p].avgTime / performanceByPriority[p].total);
        performanceByPriority[p].complianceRate = Math.round((performanceByPriority[p].compliant / performanceByPriority[p].total) * 100);
      }
    });

    const averageFirstResponseTime = ticketsWithFirstResponse.length > 0 
      ? Math.round(totalResponseTime / ticketsWithFirstResponse.length) 
      : 0;

    const firstResponseComplianceRate = ticketsWithFirstResponse.length > 0 
      ? Math.round((compliantTickets / ticketsWithFirstResponse.length) * 100) 
      : 0;

    return {
      averageFirstResponseTime,
      firstResponseComplianceRate,
      ticketsWithFirstResponse: ticketsWithFirstResponse.length,
      ticketsWithoutFirstResponse: ticketsWithoutFirstResponse.length,
      slaBreaches: breachedTickets,
      slaAtRisk: atRiskTickets,
      performanceByPriority: {
        critical: {
          avgTime: performanceByPriority.critical.avgTime,
          complianceRate: performanceByPriority.critical.complianceRate,
          total: performanceByPriority.critical.total,
        },
        high: {
          avgTime: performanceByPriority.high.avgTime,
          complianceRate: performanceByPriority.high.complianceRate,
          total: performanceByPriority.high.total,
        },
        medium: {
          avgTime: performanceByPriority.medium.avgTime,
          complianceRate: performanceByPriority.medium.complianceRate,
          total: performanceByPriority.medium.total,
        },
        low: {
          avgTime: performanceByPriority.low.avgTime,
          complianceRate: performanceByPriority.low.complianceRate,
          total: performanceByPriority.low.total,
        },
      },
    };
  }

  /**
   * Obtém métricas detalhadas do dashboard
   */
  async getDashboardMetrics(
    startDate: Date,
    endDate: Date,
    period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month',
  ): Promise<DashboardMetrics> {
    const tickets = await this.ticketRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    // Calcular métricas de volume
    const volumeMetrics = {
      totalTickets: tickets.length,
      ticketsCreated: tickets.length,
      ticketsClosed: tickets.filter((t) => t.status === 'closed').length,
      ticketsResolved: tickets.filter((t) => t.status === 'resolved').length,
      ticketsPending: tickets.filter((t) => t.status === 'pending').length,
    };

    // Calcular métricas SLA
    const slaMetrics = await this.calculateSlaMetricsForPeriod(tickets);

    // Calcular métricas por categoria
    const categoryMetrics = await this.calculateCategoryMetrics(tickets);

    // Calcular métricas por prioridade
    const priorityMetrics = await this.calculatePriorityMetrics(tickets);

    // Calcular métricas por agente
    const agentMetrics = await this.calculateAgentMetricsForPeriod(tickets);

    // Calcular distribuição horária
    const hourlyDistribution = await this.calculateHourlyDistribution(tickets);

    // Calcular tendências diárias
    const dailyTrends = await this.calculateDailyTrends(tickets);

    return {
      timeRange: {
        start: startDate,
        end: endDate,
        period,
      },
      volumeMetrics,
      slaMetrics,
      categoryMetrics,
      priorityMetrics,
      agentMetrics,
      hourlyDistribution,
      dailyTrends,
    };
  }

  /**
   * Gera relatório de performance
   */
  async getPerformanceReport(
    startDate: Date,
    endDate: Date,
  ): Promise<PerformanceReport> {
    const tickets = await this.ticketRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    // Calcular métricas gerais
    const summary = {
      totalAgents: new Set(tickets.map((t) => t.assignedTo).filter(Boolean))
        .size,
      activeAgents: new Set(
        tickets
          .filter((t) => t.assignedTo && t.status !== 'closed')
          .map((t) => t.assignedTo),
      ).size,
      totalTickets: tickets.length,
      resolvedTickets: tickets.filter(
        (t) => t.status === 'closed' || t.status === 'resolved',
      ).length,
      overallCompliance: 0, // Será calculado abaixo
    };

    // Calcular performance por agente
    const agentPerformance =
      await this.calculateDetailedAgentPerformance(tickets);

    // Calcular performance da equipe
    const teamPerformance = await this.calculateTeamPerformance(tickets);

    // Calcular compliance geral
    const slaMetrics = await this.calculateSlaMetricsForPeriod(tickets);
    summary.overallCompliance = slaMetrics.overallCompliance;

    return {
      period: `${startDate.toISOString().split('T')[0]} a ${endDate.toISOString().split('T')[0]}`,
      summary,
      agentPerformance,
      teamPerformance,
    };
  }

  /**
   * Calcula performance por agente
   */
  private async calculateAgentPerformance(): Promise<
    Array<{
      agentId: string;
      ticketsResolved: number;
      averageResolutionTime: number;
      complianceRate: number;
    }>
  > {
    const tickets = await this.ticketRepository.find({
      where: { status: 'closed' },
    });

    const agentMap = new Map<
      string,
      {
        ticketsResolved: number;
        totalResolutionTime: number;
        compliantTickets: number;
      }
    >();

    tickets.forEach((ticket) => {
      if (!ticket.assignedTo) return;

      const agentId = ticket.assignedTo;
      const resolutionTime = SlaCalculator.calculateResolutionTime(
        ticket.createdAt,
        ticket.resolvedAt,
        ticket.slaCategory as SlaCategories,
      );

      const slaStatus = SlaCalculator.getResolutionSlaStatus(
        resolutionTime,
        ticket.priority as TicketPriority,
      );

      if (!agentMap.has(agentId)) {
        agentMap.set(agentId, {
          ticketsResolved: 0,
          totalResolutionTime: 0,
          compliantTickets: 0,
        });
      }

      const agent = agentMap.get(agentId)!;
      agent.ticketsResolved++;
      agent.totalResolutionTime += resolutionTime;
      if (slaStatus === SlaStatus.COMPLIANT) {
        agent.compliantTickets++;
      }
    });

    return Array.from(agentMap.entries())
      .map(([agentId, metrics]) => ({
        agentId,
        ticketsResolved: metrics.ticketsResolved,
        averageResolutionTime:
          metrics.ticketsResolved > 0
            ? Math.round(metrics.totalResolutionTime / metrics.ticketsResolved)
            : 0,
        complianceRate:
          metrics.ticketsResolved > 0
            ? Math.round(
                (metrics.compliantTickets / metrics.ticketsResolved) * 100,
              )
            : 0,
      }))
      .sort((a, b) => b.complianceRate - a.complianceRate);
  }

  /**
   * Calcula performance SLA por prioridade
   */
  private async calculateSlaPerformanceByPriority(): Promise<{
    critical: { compliant: number; total: number; rate: number };
    high: { compliant: number; total: number; rate: number };
    medium: { compliant: number; total: number; rate: number };
    low: { compliant: number; total: number; rate: number };
  }> {
    const tickets = await this.ticketRepository.find({
      where: { status: 'closed' },
    });

    const priorityMap = new Map<string, { compliant: number; total: number }>();

    tickets.forEach((ticket) => {
      const priority = ticket.priority || 'unknown';
      const resolutionTime = SlaCalculator.calculateResolutionTime(
        ticket.createdAt,
        ticket.resolvedAt,
        ticket.slaCategory as SlaCategories,
      );

      const slaStatus = SlaCalculator.getResolutionSlaStatus(
        resolutionTime,
        ticket.priority as TicketPriority,
      );

      if (!priorityMap.has(priority)) {
        priorityMap.set(priority, { compliant: 0, total: 0 });
      }

      const metrics = priorityMap.get(priority)!;
      metrics.total++;
      if (slaStatus === SlaStatus.COMPLIANT) {
        metrics.compliant++;
      }
    });

    const result: any = {};
    ['critical', 'high', 'medium', 'low'].forEach((priority) => {
      const metrics = priorityMap.get(priority) || { compliant: 0, total: 0 };
      result[priority] = {
        ...metrics,
        rate:
          metrics.total > 0
            ? Math.round((metrics.compliant / metrics.total) * 100)
            : 0,
      };
    });

    return result;
  }

  /**
   * Gera alertas do sistema
   */
  private async generateAlerts(): Promise<
    Array<{
      type: 'breach' | 'at_risk' | 'high_volume';
      message: string;
      count: number;
      priority: 'high' | 'medium' | 'low';
    }>
  > {
    const alerts: Array<{
      type: 'breach' | 'at_risk' | 'high_volume';
      message: string;
      count: number;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // Buscar tickets em risco ou violados
    const openTickets = await this.ticketRepository.find({
      where: { status: 'open' },
    });

    let breachCount = 0;
    let atRiskCount = 0;

    for (const ticket of openTickets) {
      const resolutionTime = SlaCalculator.calculateResolutionTime(
        ticket.createdAt,
        new Date(), // Tempo atual
        ticket.slaCategory as SlaCategories,
      );

      const slaStatus = SlaCalculator.getResolutionSlaStatus(
        resolutionTime,
        ticket.priority as TicketPriority,
      );

      if (slaStatus === SlaStatus.BREACHED) {
        breachCount++;
      } else if (slaStatus === SlaStatus.AT_RISK) {
        atRiskCount++;
      }
    }

    if (breachCount > 0) {
      alerts.push({
        type: 'breach' as const,
        message: `${breachCount} tickets com SLA violado`,
        count: breachCount,
        priority: 'high' as const,
      });
    }

    if (atRiskCount > 0) {
      alerts.push({
        type: 'at_risk' as const,
        message: `${atRiskCount} tickets em risco de violar SLA`,
        count: atRiskCount,
        priority: 'medium' as const,
      });
    }

    // Verificar volume alto de tickets
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayTickets = await this.ticketRepository.count({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    if (todayTickets > 50) {
      alerts.push({
        type: 'high_volume' as const,
        message: `Volume alto: ${todayTickets} tickets criados hoje`,
        count: todayTickets,
        priority: 'medium' as const,
      });
    }

    return alerts;
  }

  /**
   * Calcula métricas SLA para um período específico
   */
  private async calculateSlaMetricsForPeriod(tickets: Ticket[]): Promise<{
    overallCompliance: number;
    averageResponseTime: number;
    averageResolutionTime: number;
    slaBreaches: number;
    slaAtRisk: number;
  }> {
    const closedTickets = tickets.filter((t) => t.status === 'closed');

    if (closedTickets.length === 0) {
      return {
        overallCompliance: 0,
        averageResponseTime: 0,
        averageResolutionTime: 0,
        slaBreaches: 0,
        slaAtRisk: 0,
      };
    }

    let compliantTickets = 0;
    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let responseTimeCount = 0;
    let resolutionTimeCount = 0;

    closedTickets.forEach((ticket) => {
      const responseTime = SlaCalculator.calculateResponseTime(
        ticket.createdAt,
        ticket.firstResponseAt,
        ticket.slaCategory as SlaCategories,
      );

      const resolutionTime = SlaCalculator.calculateResolutionTime(
        ticket.createdAt,
        ticket.resolvedAt,
        ticket.slaCategory as SlaCategories,
      );

      const slaStatus = SlaCalculator.getResolutionSlaStatus(
        resolutionTime,
        ticket.priority as TicketPriority,
      );

      if (slaStatus === SlaStatus.COMPLIANT) {
        compliantTickets++;
      }

      if (responseTime > 0) {
        totalResponseTime += responseTime;
        responseTimeCount++;
      }

      if (resolutionTime > 0) {
        totalResolutionTime += resolutionTime;
        resolutionTimeCount++;
      }
    });

    return {
      overallCompliance: Math.round(
        (compliantTickets / closedTickets.length) * 100,
      ),
      averageResponseTime:
        responseTimeCount > 0
          ? Math.round(totalResponseTime / responseTimeCount)
          : 0,
      averageResolutionTime:
        resolutionTimeCount > 0
          ? Math.round(totalResolutionTime / resolutionTimeCount)
          : 0,
      slaBreaches: closedTickets.filter((t) => {
        const resolutionTime = SlaCalculator.calculateResolutionTime(
          t.createdAt,
          t.resolvedAt,
          t.slaCategory as SlaCategories,
        );
        return (
          SlaCalculator.getResolutionSlaStatus(
            resolutionTime,
            t.priority as TicketPriority,
          ) === SlaStatus.BREACHED
        );
      }).length,
      slaAtRisk: closedTickets.filter((t) => {
        const resolutionTime = SlaCalculator.calculateResolutionTime(
          t.createdAt,
          t.resolvedAt,
          t.slaCategory as SlaCategories,
        );
        return (
          SlaCalculator.getResolutionSlaStatus(
            resolutionTime,
            t.priority as TicketPriority,
          ) === SlaStatus.AT_RISK
        );
      }).length,
    };
  }

  /**
   * Calcula métricas por categoria
   */
  private async calculateCategoryMetrics(tickets: Ticket[]): Promise<
    Record<
      string,
      {
        total: number;
        compliant: number;
        averageResponseTime: number;
        averageResolutionTime: number;
        complianceRate: number;
      }
    >
  > {
    const categoryMap = new Map<
      string,
      {
        total: number;
        compliant: number;
        totalResponseTime: number;
        totalResolutionTime: number;
        responseTimeCount: number;
        resolutionTimeCount: number;
      }
    >();

    tickets.forEach((ticket) => {
      const category = ticket.categoryId || 'uncategorized';

      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          total: 0,
          compliant: 0,
          totalResponseTime: 0,
          totalResolutionTime: 0,
          responseTimeCount: 0,
          resolutionTimeCount: 0,
        });
      }

      const metrics = categoryMap.get(category)!;
      metrics.total++;

      if (ticket.status === 'closed') {
        const responseTime = SlaCalculator.calculateResponseTime(
          ticket.createdAt,
          ticket.firstResponseAt,
          ticket.slaCategory as SlaCategories,
        );

        const resolutionTime = SlaCalculator.calculateResolutionTime(
          ticket.createdAt,
          ticket.resolvedAt,
          ticket.slaCategory as SlaCategories,
        );

        const slaStatus = SlaCalculator.getResolutionSlaStatus(
          resolutionTime,
          ticket.priority as TicketPriority,
        );

        if (slaStatus === SlaStatus.COMPLIANT) {
          metrics.compliant++;
        }

        if (responseTime > 0) {
          metrics.totalResponseTime += responseTime;
          metrics.responseTimeCount++;
        }

        if (resolutionTime > 0) {
          metrics.totalResolutionTime += resolutionTime;
          metrics.resolutionTimeCount++;
        }
      }
    });

    const result: Record<string, any> = {};
    categoryMap.forEach((metrics, category) => {
      result[category] = {
        total: metrics.total,
        compliant: metrics.compliant,
        averageResponseTime:
          metrics.responseTimeCount > 0
            ? Math.round(metrics.totalResponseTime / metrics.responseTimeCount)
            : 0,
        averageResolutionTime:
          metrics.resolutionTimeCount > 0
            ? Math.round(
                metrics.totalResolutionTime / metrics.resolutionTimeCount,
              )
            : 0,
        complianceRate:
          metrics.total > 0
            ? Math.round((metrics.compliant / metrics.total) * 100)
            : 0,
      };
    });

    return result;
  }

  /**
   * Calcula métricas por prioridade
   */
  private async calculatePriorityMetrics(tickets: Ticket[]): Promise<
    Record<
      string,
      {
        total: number;
        compliant: number;
        averageResponseTime: number;
        averageResolutionTime: number;
        complianceRate: number;
      }
    >
  > {
    const priorityMap = new Map<
      string,
      {
        total: number;
        compliant: number;
        totalResponseTime: number;
        totalResolutionTime: number;
        responseTimeCount: number;
        resolutionTimeCount: number;
      }
    >();

    tickets.forEach((ticket) => {
      const priority = ticket.priority || 'unknown';

      if (!priorityMap.has(priority)) {
        priorityMap.set(priority, {
          total: 0,
          compliant: 0,
          totalResponseTime: 0,
          totalResolutionTime: 0,
          responseTimeCount: 0,
          resolutionTimeCount: 0,
        });
      }

      const metrics = priorityMap.get(priority)!;
      metrics.total++;

      if (ticket.status === 'closed') {
        const responseTime = SlaCalculator.calculateResponseTime(
          ticket.createdAt,
          ticket.firstResponseAt,
          ticket.slaCategory as SlaCategories,
        );

        const resolutionTime = SlaCalculator.calculateResolutionTime(
          ticket.createdAt,
          ticket.resolvedAt,
          ticket.slaCategory as SlaCategories,
        );

        const slaStatus = SlaCalculator.getResolutionSlaStatus(
          resolutionTime,
          ticket.priority as TicketPriority,
        );

        if (slaStatus === SlaStatus.COMPLIANT) {
          metrics.compliant++;
        }

        if (responseTime > 0) {
          metrics.totalResponseTime += responseTime;
          metrics.responseTimeCount++;
        }

        if (resolutionTime > 0) {
          metrics.totalResolutionTime += resolutionTime;
          metrics.resolutionTimeCount++;
        }
      }
    });

    const result: Record<string, any> = {};
    priorityMap.forEach((metrics, priority) => {
      result[priority] = {
        total: metrics.total,
        compliant: metrics.compliant,
        averageResponseTime:
          metrics.responseTimeCount > 0
            ? Math.round(metrics.totalResponseTime / metrics.responseTimeCount)
            : 0,
        averageResolutionTime:
          metrics.resolutionTimeCount > 0
            ? Math.round(
                metrics.totalResolutionTime / metrics.resolutionTimeCount,
              )
            : 0,
        complianceRate:
          metrics.total > 0
            ? Math.round((metrics.compliant / metrics.total) * 100)
            : 0,
      };
    });

    return result;
  }

  /**
   * Calcula métricas por agente para um período
   */
  private async calculateAgentMetricsForPeriod(tickets: Ticket[]): Promise<
    Array<{
      agentId: string;
      agentName?: string;
      ticketsAssigned: number;
      ticketsResolved: number;
      averageResponseTime: number;
      averageResolutionTime: number;
      complianceRate: number;
    }>
  > {
    const agentMap = new Map<
      string,
      {
        ticketsAssigned: number;
        ticketsResolved: number;
        totalResponseTime: number;
        totalResolutionTime: number;
        compliantTickets: number;
        responseTimeCount: number;
        resolutionTimeCount: number;
      }
    >();

    tickets.forEach((ticket) => {
      if (!ticket.assignedTo) return;

      const agentId = ticket.assignedTo;

      if (!agentMap.has(agentId)) {
        agentMap.set(agentId, {
          ticketsAssigned: 0,
          ticketsResolved: 0,
          totalResponseTime: 0,
          totalResolutionTime: 0,
          compliantTickets: 0,
          responseTimeCount: 0,
          resolutionTimeCount: 0,
        });
      }

      const metrics = agentMap.get(agentId)!;
      metrics.ticketsAssigned++;

      if (ticket.status === 'closed' || ticket.status === 'resolved') {
        metrics.ticketsResolved++;

        const responseTime = SlaCalculator.calculateResponseTime(
          ticket.createdAt,
          ticket.firstResponseAt,
          ticket.slaCategory as SlaCategories,
        );

        const resolutionTime = SlaCalculator.calculateResolutionTime(
          ticket.createdAt,
          ticket.resolvedAt,
          ticket.slaCategory as SlaCategories,
        );

        const slaStatus = SlaCalculator.getResolutionSlaStatus(
          resolutionTime,
          ticket.priority as TicketPriority,
        );

        if (slaStatus === SlaStatus.COMPLIANT) {
          metrics.compliantTickets++;
        }

        if (responseTime > 0) {
          metrics.totalResponseTime += responseTime;
          metrics.responseTimeCount++;
        }

        if (resolutionTime > 0) {
          metrics.totalResolutionTime += resolutionTime;
          metrics.resolutionTimeCount++;
        }
      }
    });

    return Array.from(agentMap.entries()).map(([agentId, metrics]) => ({
      agentId,
      agentName: undefined, // Pode ser expandido para buscar nome do agente
      ticketsAssigned: metrics.ticketsAssigned,
      ticketsResolved: metrics.ticketsResolved,
      averageResponseTime:
        metrics.responseTimeCount > 0
          ? Math.round(metrics.totalResponseTime / metrics.responseTimeCount)
          : 0,
      averageResolutionTime:
        metrics.resolutionTimeCount > 0
          ? Math.round(
              metrics.totalResolutionTime / metrics.resolutionTimeCount,
            )
          : 0,
      complianceRate:
        metrics.ticketsResolved > 0
          ? Math.round(
              (metrics.compliantTickets / metrics.ticketsResolved) * 100,
            )
          : 0,
    }));
  }

  /**
   * Calcula distribuição horária
   */
  private async calculateHourlyDistribution(tickets: Ticket[]): Promise<
    Array<{
      hour: number;
      ticketsCreated: number;
      ticketsResolved: number;
    }>
  > {
    const hourlyMap = new Map<number, { created: number; resolved: number }>();

    // Inicializar mapa com todas as horas
    for (let hour = 0; hour < 24; hour++) {
      hourlyMap.set(hour, { created: 0, resolved: 0 });
    }

    tickets.forEach((ticket) => {
      const createdHour = ticket.createdAt.getHours();
      const createdMetrics = hourlyMap.get(createdHour)!;
      createdMetrics.created++;

      if (ticket.resolvedAt) {
        const resolvedHour = ticket.resolvedAt.getHours();
        const resolvedMetrics = hourlyMap.get(resolvedHour)!;
        resolvedMetrics.resolved++;
      }
    });

    return Array.from(hourlyMap.entries()).map(([hour, metrics]) => ({
      hour,
      ticketsCreated: metrics.created,
      ticketsResolved: metrics.resolved,
    }));
  }

  /**
   * Calcula tendências diárias
   */
  private async calculateDailyTrends(tickets: Ticket[]): Promise<
    Array<{
      date: string;
      ticketsCreated: number;
      ticketsClosed: number;
      complianceRate: number;
    }>
  > {
    const dailyMap = new Map<
      string,
      {
        created: number;
        closed: number;
        compliant: number;
        totalClosed: number;
      }
    >();

    tickets.forEach((ticket) => {
      const date = ticket.createdAt.toISOString().split('T')[0];

      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          created: 0,
          closed: 0,
          compliant: 0,
          totalClosed: 0,
        });
      }

      const metrics = dailyMap.get(date)!;
      metrics.created++;

      if (ticket.status === 'closed') {
        metrics.closed++;
        metrics.totalClosed++;

        const resolutionTime = SlaCalculator.calculateResolutionTime(
          ticket.createdAt,
          ticket.resolvedAt,
          ticket.slaCategory as SlaCategories,
        );

        const slaStatus = SlaCalculator.getResolutionSlaStatus(
          resolutionTime,
          ticket.priority as TicketPriority,
        );

        if (slaStatus === SlaStatus.COMPLIANT) {
          metrics.compliant++;
        }
      }
    });

    return Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, metrics]) => ({
        date,
        ticketsCreated: metrics.created,
        ticketsClosed: metrics.closed,
        complianceRate:
          metrics.totalClosed > 0
            ? Math.round((metrics.compliant / metrics.totalClosed) * 100)
            : 0,
      }));
  }

  /**
   * Calcula performance detalhada por agente
   */
  private async calculateDetailedAgentPerformance(tickets: Ticket[]): Promise<
    Array<{
      agentId: string;
      agentName?: string;
      metrics: {
        ticketsAssigned: number;
        ticketsResolved: number;
        averageResponseTime: number;
        averageResolutionTime: number;
        complianceRate: number;
        slaBreaches: number;
      };
      trends: {
        weekOverWeek: number;
        monthOverMonth: number;
      };
    }>
  > {
    const agentMetrics = await this.calculateAgentMetricsForPeriod(tickets);

    return agentMetrics.map((agent) => ({
      agentId: agent.agentId,
      agentName: agent.agentName,
      metrics: {
        ticketsAssigned: agent.ticketsAssigned,
        ticketsResolved: agent.ticketsResolved,
        averageResponseTime: agent.averageResponseTime,
        averageResolutionTime: agent.averageResolutionTime,
        complianceRate: agent.complianceRate,
        slaBreaches: 0, // Pode ser calculado se necessário
      },
      trends: {
        weekOverWeek: 0, // Pode ser calculado com dados históricos
        monthOverMonth: 0, // Pode ser calculado com dados históricos
      },
    }));
  }

  /**
   * Calcula performance da equipe
   */
  private async calculateTeamPerformance(tickets: Ticket[]): Promise<{
    teamName: string;
    metrics: {
      totalTickets: number;
      resolvedTickets: number;
      averageResponseTime: number;
      averageResolutionTime: number;
      complianceRate: number;
    };
  }> {
    const slaMetrics = await this.calculateSlaMetricsForPeriod(tickets);

    return {
      teamName: 'Equipe Geral',
      metrics: {
        totalTickets: tickets.length,
        resolvedTickets: tickets.filter(
          (t) => t.status === 'closed' || t.status === 'resolved',
        ).length,
        averageResponseTime: slaMetrics.averageResponseTime,
        averageResolutionTime: slaMetrics.averageResolutionTime,
        complianceRate: slaMetrics.overallCompliance,
      },
    };
  }
}
