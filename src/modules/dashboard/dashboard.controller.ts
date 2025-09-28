import {
  Controller,
  Get,
  Query,
  ParseEnumPipe,
  BadRequestException,
  DefaultValuePipe,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import {
  DashboardService,
  DashboardOverview,
  DashboardMetrics,
  PerformanceReport,
} from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

type PeriodType = 'today' | 'week' | 'month' | 'quarter' | 'year';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Obtém visão geral do dashboard
   */
  @Get('overview')
  async getDashboardOverview(
    @Req() req: any,
    @Res() res: any,
  ): Promise<DashboardOverview | void> {
    // Verificar se é requisição do navegador
    const isBrowserRequest = req.headers.accept?.includes('text/html');

    if (isBrowserRequest) {
      // Retornar página HTML do dashboard com validação via JavaScript
      const dashboardPage = await this.getDashboardPageWithValidation();
      res.setHeader('Content-Type', 'text/html');
      res.send(dashboardPage);
    } else {
      // Para API, verificar token no header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res
          .status(401)
          .json({ message: 'Unauthorized', statusCode: 401 });
      }

      // Retornar JSON para API
      const data = await this.dashboardService.getDashboardOverview();
      res.json(data);
    }
  }

  /**
   * Obtém métricas detalhadas do dashboard
   */
  @Get('metrics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getDashboardMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query(
      'period',
      new DefaultValuePipe('month'),
      new ParseEnumPipe(['today', 'week', 'month', 'quarter', 'year']),
    )
    period?: PeriodType,
  ): Promise<DashboardMetrics> {
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Datas inválidas');
      }

      if (start >= end) {
        throw new BadRequestException('startDate deve ser anterior a endDate');
      }
    } else {
      // Usar período padrão se não especificado
      const now = new Date();
      const { start: defaultStart, end: defaultEnd } = this.getDefaultDateRange(
        period || 'month',
      );
      start = defaultStart;
      end = defaultEnd;
    }

    return await this.dashboardService.getDashboardMetrics(start, end, period);
  }

  /**
   * Obtém métricas do dashboard para hoje
   */
  @Get('metrics/today')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getTodayMetrics(): Promise<DashboardMetrics> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return await this.dashboardService.getDashboardMetrics(
      startOfDay,
      endOfDay,
      'today',
    );
  }

  /**
   * Obtém métricas do dashboard para esta semana
   */
  @Get('metrics/week')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getWeekMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const endOfWeek = new Date(now);

    return await this.dashboardService.getDashboardMetrics(
      startOfWeek,
      endOfWeek,
      'week',
    );
  }

  /**
   * Obtém métricas do dashboard para este mês
   */
  @Get('metrics/month')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getMonthMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    return await this.dashboardService.getDashboardMetrics(
      startOfMonth,
      endOfMonth,
      'month',
    );
  }

  /**
   * Obtém métricas do dashboard para este trimestre
   */
  @Get('metrics/quarter')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getQuarterMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
    const endOfQuarter = new Date(
      now.getFullYear(),
      (quarter + 1) * 3,
      0,
      23,
      59,
      59,
      999,
    );

    return await this.dashboardService.getDashboardMetrics(
      startOfQuarter,
      endOfQuarter,
      'quarter',
    );
  }

  /**
   * Obtém métricas do dashboard para este ano
   */
  @Get('metrics/year')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getYearMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    return await this.dashboardService.getDashboardMetrics(
      startOfYear,
      endOfYear,
      'year',
    );
  }

  /**
   * Gera relatório de performance
   */
  @Get('performance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getPerformanceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<PerformanceReport> {
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Datas inválidas');
      }

      if (start >= end) {
        throw new BadRequestException('startDate deve ser anterior a endDate');
      }
    } else {
      // Usar último mês como padrão
      const now = new Date();
      end = new Date(now);
      start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    return await this.dashboardService.getPerformanceReport(start, end);
  }

  /**
   * Obtém relatório de performance do mês atual
   */
  @Get('performance/month')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getCurrentMonthPerformance(): Promise<PerformanceReport> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    return await this.dashboardService.getPerformanceReport(
      startOfMonth,
      endOfMonth,
    );
  }

  /**
   * Obtém relatório de performance do trimestre atual
   */
  @Get('performance/quarter')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getCurrentQuarterPerformance(): Promise<PerformanceReport> {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
    const endOfQuarter = new Date(
      now.getFullYear(),
      (quarter + 1) * 3,
      0,
      23,
      59,
      59,
      999,
    );

    return await this.dashboardService.getPerformanceReport(
      startOfQuarter,
      endOfQuarter,
    );
  }

  /**
   * Obtém relatório de performance do ano atual
   */
  @Get('performance/year')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getCurrentYearPerformance(): Promise<PerformanceReport> {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    return await this.dashboardService.getPerformanceReport(
      startOfYear,
      endOfYear,
    );
  }

  /**
   * Obtém KPIs principais do dashboard
   */
  @Get('kpis')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getDashboardKPIs(): Promise<{
    totalTickets: number;
    openTickets: number;
    complianceRate: number;
    averageResolutionTime: number;
    ticketsToday: number;
    ticketsThisWeek: number;
    slaBreaches: number;
    topPerformingAgent: {
      agentId: string;
      complianceRate: number;
    } | null;
  }> {
    const overview = await this.dashboardService.getDashboardOverview();

    const topAgent = overview.performance.topPerformingAgents[0] || null;

    return {
      totalTickets: overview.summary.totalTickets,
      openTickets: overview.summary.openTickets,
      complianceRate: overview.summary.complianceRate,
      averageResolutionTime: overview.summary.averageResolutionTime,
      ticketsToday: overview.trends.ticketsCreatedToday,
      ticketsThisWeek: overview.trends.ticketsCreatedThisWeek,
      slaBreaches: overview.summary.slaBreaches,
      topPerformingAgent: topAgent
        ? {
            agentId: topAgent.agentId,
            complianceRate: topAgent.complianceRate,
          }
        : null,
    };
  }

  /**
   * Obtém alertas ativos do dashboard
   */
  @Get('alerts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getDashboardAlerts(): Promise<
    Array<{
      type: 'breach' | 'at_risk' | 'high_volume';
      message: string;
      count: number;
      priority: 'high' | 'medium' | 'low';
    }>
  > {
    const overview = await this.dashboardService.getDashboardOverview();
    return overview.alerts;
  }

  /**
   * Obtém tendências do dashboard
   */
  @Get('trends')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getDashboardTrends(): Promise<{
    ticketsCreated: {
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
    ticketsClosed: {
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
    complianceTrend: {
      current: number;
      previous: number;
      change: number;
    };
  }> {
    const overview = await this.dashboardService.getDashboardOverview();

    // Calcular mudança de compliance (simulado)
    const complianceChange = 0; // Pode ser calculado comparando com período anterior

    return {
      ticketsCreated: {
        today: overview.trends.ticketsCreatedToday,
        thisWeek: overview.trends.ticketsCreatedThisWeek,
        thisMonth: overview.trends.ticketsCreatedThisMonth,
      },
      ticketsClosed: {
        today: overview.trends.ticketsClosedToday,
        thisWeek: overview.trends.ticketsClosedThisWeek,
        thisMonth: overview.trends.ticketsClosedThisMonth,
      },
      complianceTrend: {
        current: overview.summary.complianceRate,
        previous: overview.summary.complianceRate - complianceChange,
        change: complianceChange,
      },
    };
  }

  /**
   * Obtém distribuição de tickets por status
   */
  @Get('distribution/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getStatusDistribution(): Promise<{
    open: number;
    in_progress: number;
    pending: number;
    resolved: number;
    closed: number;
  }> {
    const metrics = await this.dashboardService.getDashboardMetrics(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
      new Date(),
      'month',
    );

    // Esta informação seria melhor calculada no service
    // Por simplicidade, retornando estrutura básica
    return {
      open: 0,
      in_progress: 0,
      pending: 0,
      resolved: 0,
      closed: 0,
    };
  }

  /**
   * Obtém distribuição de tickets por prioridade
   */
  @Get('distribution/priority')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getPriorityDistribution(): Promise<Record<string, number>> {
    const metrics = await this.dashboardService.getDashboardMetrics(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
      new Date(),
      'month',
    );

    const distribution: Record<string, number> = {};
    Object.keys(metrics.priorityMetrics).forEach((priority) => {
      distribution[priority] = metrics.priorityMetrics[priority].total;
    });

    return distribution;
  }

  /**
   * Obtém distribuição de tickets por categoria
   */
  @Get('distribution/category')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getCategoryDistribution(): Promise<Record<string, number>> {
    const metrics = await this.dashboardService.getDashboardMetrics(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
      new Date(),
      'month',
    );

    const distribution: Record<string, number> = {};
    Object.keys(metrics.categoryMetrics).forEach((category) => {
      distribution[category] = metrics.categoryMetrics[category].total;
    });

    return distribution;
  }

  /**
   * Obtém performance por agente
   */
  @Get('performance/agents')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getAgentPerformance(): Promise<
    Array<{
      agentId: string;
      agentName?: string;
      ticketsAssigned: number;
      ticketsResolved: number;
      averageResolutionTime: number;
      complianceRate: number;
    }>
  > {
    const metrics = await this.dashboardService.getDashboardMetrics(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
      new Date(),
      'month',
    );

    return metrics.agentMetrics;
  }

  /**
   * Obtém distribuição horária de tickets
   */
  @Get('distribution/hourly')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getHourlyDistribution(): Promise<
    Array<{
      hour: number;
      ticketsCreated: number;
      ticketsResolved: number;
    }>
  > {
    const metrics = await this.dashboardService.getDashboardMetrics(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 dias
      new Date(),
      'week',
    );

    return metrics.hourlyDistribution;
  }

  /**
   * Obtém métricas específicas de SLA de primeira resposta (Fase 3)
   */
  @Get('first-response')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getFirstResponseMetrics(): Promise<{
    slaMetrics: {
      averageFirstResponseTime: number;
      firstResponseComplianceRate: number;
      ticketsWithFirstResponse: number;
      ticketsWithoutFirstResponse: number;
      slaBreaches: number;
      slaAtRisk: number;
    };
    performanceByPriority: {
      critical: { avgTime: number; complianceRate: number; total: number; };
      high: { avgTime: number; complianceRate: number; total: number; };
      medium: { avgTime: number; complianceRate: number; total: number; };
      low: { avgTime: number; complianceRate: number; total: number; };
    };
    slaTargets: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  }> {
    const overview = await this.dashboardService.getDashboardOverview();
    
    return {
      slaMetrics: {
        averageFirstResponseTime: overview.summary.firstResponseSla.averageFirstResponseTime,
        firstResponseComplianceRate: overview.summary.firstResponseSla.firstResponseComplianceRate,
        ticketsWithFirstResponse: overview.summary.firstResponseSla.ticketsWithFirstResponse,
        ticketsWithoutFirstResponse: overview.summary.firstResponseSla.ticketsWithoutFirstResponse,
        slaBreaches: overview.summary.firstResponseSla.slaBreaches,
        slaAtRisk: overview.summary.firstResponseSla.slaAtRisk,
      },
      performanceByPriority: overview.summary.firstResponseSla.performanceByPriority,
      slaTargets: {
        critical: 15, // 15 minutos para crítico
        high: 60,     // 1 hora para alta
        medium: 240,  // 4 horas para média
        low: 480,     // 8 horas para baixa
      },
    };
  }

  /**
   * Obtém tendências diárias
   */
  @Get('trends/daily')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getDailyTrends(): Promise<
    Array<{
      date: string;
      ticketsCreated: number;
      ticketsClosed: number;
      complianceRate: number;
    }>
  > {
    const metrics = await this.dashboardService.getDashboardMetrics(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
      new Date(),
      'month',
    );

    return metrics.dailyTrends;
  }

  /**
   * Obtém métricas de SLA detalhadas
   */
  @Get('sla/details')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getSlaDetails(): Promise<{
    overallCompliance: number;
    averageResponseTime: number;
    averageResolutionTime: number;
    slaBreaches: number;
    slaAtRisk: number;
    performanceByPriority: Record<
      string,
      {
        total: number;
        compliant: number;
        complianceRate: number;
      }
    >;
  }> {
    const metrics = await this.dashboardService.getDashboardMetrics(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
      new Date(),
      'month',
    );

    const performanceByPriority: Record<string, any> = {};
    Object.keys(metrics.priorityMetrics).forEach((priority) => {
      const priorityMetrics = metrics.priorityMetrics[priority];
      performanceByPriority[priority] = {
        total: priorityMetrics.total,
        compliant: priorityMetrics.compliant,
        complianceRate: priorityMetrics.complianceRate,
      };
    });

    return {
      overallCompliance: metrics.slaMetrics.overallCompliance,
      averageResponseTime: metrics.slaMetrics.averageResponseTime,
      averageResolutionTime: metrics.slaMetrics.averageResolutionTime,
      slaBreaches: metrics.slaMetrics.slaBreaches,
      slaAtRisk: metrics.slaMetrics.slaAtRisk,
      performanceByPriority,
    };
  }

  /**
   * Obtém dados para gráficos de linha temporal
   */
  @Get('charts/timeline')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getTimelineCharts(
    @Query('days', new DefaultValuePipe(30)) days: number,
  ): Promise<{
    ticketsCreated: Array<{ date: string; count: number }>;
    ticketsClosed: Array<{ date: string; count: number }>;
    complianceRate: Array<{ date: string; rate: number }>;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const metrics = await this.dashboardService.getDashboardMetrics(
      startDate,
      new Date(),
      'month',
    );

    return {
      ticketsCreated: metrics.dailyTrends.map((trend) => ({
        date: trend.date,
        count: trend.ticketsCreated,
      })),
      ticketsClosed: metrics.dailyTrends.map((trend) => ({
        date: trend.date,
        count: trend.ticketsClosed,
      })),
      complianceRate: metrics.dailyTrends.map((trend) => ({
        date: trend.date,
        rate: trend.complianceRate,
      })),
    };
  }

  /**
   * Obtém dados para gráficos de distribuição
   */
  @Get('charts/distribution')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  async getDistributionCharts(): Promise<{
    byStatus: Array<{ status: string; count: number }>;
    byPriority: Array<{ priority: string; count: number }>;
    byCategory: Array<{ category: string; count: number }>;
    hourly: Array<{ hour: number; count: number }>;
  }> {
    const metrics = await this.dashboardService.getDashboardMetrics(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date(),
      'month',
    );

    return {
      byStatus: [
        { status: 'open', count: 0 },
        { status: 'in_progress', count: 0 },
        { status: 'pending', count: 0 },
        { status: 'resolved', count: 0 },
        { status: 'closed', count: 0 },
      ],
      byPriority: Object.entries(metrics.priorityMetrics).map(
        ([priority, data]) => ({
          priority,
          count: data.total,
        }),
      ),
      byCategory: Object.entries(metrics.categoryMetrics).map(
        ([category, data]) => ({
          category,
          count: data.total,
        }),
      ),
      hourly: metrics.hourlyDistribution.map((hour) => ({
        hour: hour.hour,
        count: hour.ticketsCreated,
      })),
    };
  }

  /**
   * Helper para obter range de datas padrão
   */
  private getDefaultDateRange(period: PeriodType): { start: Date; end: Date } {
    const now = new Date();

    switch (period) {
      case 'today':
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));
        return { start: startOfDay, end: endOfDay };

      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        return { start: startOfWeek, end: new Date(now) };

      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        return { start: startOfMonth, end: endOfMonth };

      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(
          now.getFullYear(),
          (quarter + 1) * 3,
          0,
          23,
          59,
          59,
          999,
        );
        return { start: startOfQuarter, end: endOfQuarter };

      case 'year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { start: startOfYear, end: endOfYear };

      default:
        throw new BadRequestException('Período inválido');
    }
  }

  private async getDashboardPageWithValidation(): Promise<string> {
    const dashboardData = await this.dashboardService.getDashboardOverview();

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Ticket Discord</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f7fa;
            color: #333;
        }
        
        .header {
            background: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: #667eea;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .user-badge {
            background: #667eea;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
        }
        
        .logout-btn {
            background: #dc3545;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            cursor: pointer;
        }
        
        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 2rem;
        }
        
        .welcome {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        
        .welcome h1 {
            color: #333;
            margin-bottom: 0.5rem;
        }
        
        .welcome p {
            color: #666;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stat-card h3 {
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">📊 Ticket Discord Dashboard</div>
        <div class="user-info">
            <div class="user-badge" id="userBadge">Carregando...</div>
            <button class="logout-btn" onclick="logout()">Sair</button>
        </div>
    </div>
    
    <div class="container">
        <div class="welcome">
            <h1>Bem-vindo ao Dashboard!</h1>
            <p>Olá! Aqui você pode visualizar as métricas e gerenciar o sistema de tickets.</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total de Tickets</h3>
                <div class="stat-value">${dashboardData.summary.totalTickets}</div>
            </div>
            <div class="stat-card">
                <h3>Tickets Abertos</h3>
                <div class="stat-value">${dashboardData.summary.openTickets}</div>
            </div>
            <div class="stat-card">
                <h3>Taxa de Compliance</h3>
                <div class="stat-value">${dashboardData.summary.complianceRate}%</div>
            </div>
            <div class="stat-card">
                <h3>Tickets Hoje</h3>
                <div class="stat-value">${dashboardData.trends.ticketsCreatedToday}</div>
            </div>
        </div>
        
        <!-- Fase 3: Métricas de SLA de Primeira Resposta -->
        <div class="welcome">
            <h2>⏱️ SLA de Primeira Resposta</h2>
            <p>Métricas de tempo para primeira resposta do agente que puxou o ticket</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>⏱️ Tempo Médio de Primeira Resposta</h3>
                <div class="stat-value">${dashboardData.summary.firstResponseSla.averageFirstResponseTime} min</div>
                <p>Tempo médio entre criação do ticket e primeira mensagem do agente</p>
            </div>
            <div class="stat-card">
                <h3>✅ Taxa de Compliance SLA</h3>
                <div class="stat-value">${dashboardData.summary.firstResponseSla.firstResponseComplianceRate}%</div>
                <p>% de tickets dentro do SLA de primeira resposta</p>
            </div>
            <div class="stat-card">
                <h3>❌ Violações de SLA</h3>
                <div class="stat-value">${dashboardData.summary.firstResponseSla.slaBreaches}</div>
                <p>Tickets que violaram o SLA de primeira resposta</p>
            </div>
            <div class="stat-card">
                <h3>⚠️ Em Risco</h3>
                <div class="stat-value">${dashboardData.summary.firstResponseSla.slaAtRisk}</div>
                <p>Tickets próximos de violar o SLA</p>
            </div>
        </div>
        
        <!-- Performance por Prioridade -->
        <div class="welcome">
            <h3>📊 Performance por Prioridade</h3>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>🚨 Crítica</h3>
                <div class="stat-value">${dashboardData.summary.firstResponseSla.performanceByPriority.critical.avgTime} min</div>
                <p>Tempo médio: ${dashboardData.summary.firstResponseSla.performanceByPriority.critical.avgTime}min | Compliance: ${dashboardData.summary.firstResponseSla.performanceByPriority.critical.complianceRate}% | Total: ${dashboardData.summary.firstResponseSla.performanceByPriority.critical.total}</p>
            </div>
            <div class="stat-card">
                <h3>🔴 Alta</h3>
                <div class="stat-value">${dashboardData.summary.firstResponseSla.performanceByPriority.high.avgTime} min</div>
                <p>Tempo médio: ${dashboardData.summary.firstResponseSla.performanceByPriority.high.avgTime}min | Compliance: ${dashboardData.summary.firstResponseSla.performanceByPriority.high.complianceRate}% | Total: ${dashboardData.summary.firstResponseSla.performanceByPriority.high.total}</p>
            </div>
            <div class="stat-card">
                <h3>🟡 Média</h3>
                <div class="stat-value">${dashboardData.summary.firstResponseSla.performanceByPriority.medium.avgTime} min</div>
                <p>Tempo médio: ${dashboardData.summary.firstResponseSla.performanceByPriority.medium.avgTime}min | Compliance: ${dashboardData.summary.firstResponseSla.performanceByPriority.medium.complianceRate}% | Total: ${dashboardData.summary.firstResponseSla.performanceByPriority.medium.total}</p>
            </div>
            <div class="stat-card">
                <h3>🟢 Baixa</h3>
                <div class="stat-value">${dashboardData.summary.firstResponseSla.performanceByPriority.low.avgTime} min</div>
                <p>Tempo médio: ${dashboardData.summary.firstResponseSla.performanceByPriority.low.avgTime}min | Compliance: ${dashboardData.summary.firstResponseSla.performanceByPriority.low.complianceRate}% | Total: ${dashboardData.summary.firstResponseSla.performanceByPriority.low.total}</p>
            </div>
        </div>
    </div>

    <script>
        // Verificar se o token ainda é válido
        window.addEventListener('load', async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                window.location.href = '/auth/login-page';
                return;
            }
            
            try {
                const response = await fetch('/auth/profile', {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });
                
                if (!response.ok) {
                    window.location.href = '/auth/login-page';
                } else {
                    const user = await response.json();
                    // Atualizar informações do usuário na página
                    document.getElementById('userBadge').textContent = user.username + ' (' + user.role + ')';
                }
            } catch (error) {
                window.location.href = '/auth/login-page';
            }
        });

        function logout() {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = '/auth/login-page';
        }
    </script>
</body>
</html>
    `;
  }
}
