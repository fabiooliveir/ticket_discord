import React from 'react';

// Tipos para Dashboard Overview
export interface DashboardSummary {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  complianceRate: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  slaBreaches: number;
}

export interface DashboardTrends {
  ticketsCreatedToday: number;
  ticketsClosedToday: number;
  ticketsCreatedThisWeek: number;
  ticketsClosedThisWeek: number;
  ticketsCreatedThisMonth: number;
  ticketsClosedThisMonth: number;
}

export interface AgentPerformance {
  agentId: string;
  ticketsResolved: number;
  averageResolutionTime: number;
  complianceRate: number;
}

export interface SLAPerformance {
  critical: { compliant: number; total: number; rate: number };
  high: { compliant: number; total: number; rate: number };
  medium: { compliant: number; total: number; rate: number };
  low: { compliant: number; total: number; rate: number };
}

export interface Alert {
  type: 'breach' | 'at_risk' | 'high_volume';
  message: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
}

export interface DashboardOverview {
  summary: DashboardSummary;
  trends: DashboardTrends;
  performance: {
    topPerformingAgents: AgentPerformance[];
    slaPerformance: SLAPerformance;
  };
  alerts: Alert[];
}

// Tipos para Dashboard Metrics
export interface TimeRange {
  start: string;
  end: string;
  period: string;
}

export interface VolumeMetrics {
  totalTickets: number;
  ticketsCreated: number;
  ticketsClosed: number;
  ticketsResolved: number;
  ticketsPending: number;
}

export interface SLAMetrics {
  overallCompliance: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  slaBreaches: number;
  slaAtRisk: number;
}

export interface CategoryMetrics {
  total: number;
  compliant: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  complianceRate: number;
}

export interface PriorityMetrics {
  total: number;
  compliant: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  complianceRate: number;
}

export interface AgentMetrics {
  agentId: string;
  agentName?: string;
  ticketsAssigned: number;
  ticketsResolved: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  complianceRate: number;
}

export interface HourlyDistribution {
  hour: number;
  ticketsCreated: number;
  ticketsResolved: number;
}

export interface DailyTrends {
  date: string;
  ticketsCreated: number;
  ticketsClosed: number;
  complianceRate: number;
}

export interface DashboardMetrics {
  timeRange: TimeRange;
  volumeMetrics: VolumeMetrics;
  slaMetrics: SLAMetrics;
  categoryMetrics: Record<string, CategoryMetrics>;
  priorityMetrics: Record<string, PriorityMetrics>;
  agentMetrics: AgentMetrics[];
  hourlyDistribution: HourlyDistribution[];
  dailyTrends: DailyTrends[];
}

// Tipos para Performance Report
export interface PerformanceSummary {
  totalAgents: number;
  activeAgents: number;
  totalTickets: number;
  resolvedTickets: number;
  overallCompliance: number;
}

export interface AgentPerformanceMetrics {
  ticketsAssigned: number;
  ticketsResolved: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  complianceRate: number;
  slaBreaches: number;
}

export interface AgentPerformanceTrends {
  weekOverWeek: number;
  monthOverMonth: number;
}

export interface DetailedAgentPerformance {
  agentId: string;
  agentName?: string;
  metrics: AgentPerformanceMetrics;
  trends: AgentPerformanceTrends;
}

export interface TeamPerformance {
  teamName: string;
  metrics: {
    totalTickets: number;
    resolvedTickets: number;
    averageResponseTime: number;
    averageResolutionTime: number;
    complianceRate: number;
  };
}

export interface PerformanceReport {
  period: string;
  summary: PerformanceSummary;
  agentPerformance: DetailedAgentPerformance[];
  teamPerformance: TeamPerformance;
}

// Tipos para KPIs
export interface DashboardKPIs {
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
}

// Tipos para Charts
export interface ChartDataPoint {
  date: string;
  count: number;
}

export interface ComplianceChartData {
  date: string;
  rate: number;
}

export interface DistributionChartData {
  name: string;
  value: number;
}

export interface HourlyChartData {
  hour: number;
  count: number;
}

// Tipos para API Response
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  error: string;
}

// Tipos para filtros
export type PeriodType = 'today' | 'week' | 'month' | 'quarter' | 'year';

export interface DateFilter {
  startDate?: string;
  endDate?: string;
  period?: PeriodType;
}

// Tipos para componentes
export interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
}

export interface ChartProps {
  data: any[];
  title: string;
  height?: number;
  color?: string;
}

export interface TableColumn {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => string;
}
