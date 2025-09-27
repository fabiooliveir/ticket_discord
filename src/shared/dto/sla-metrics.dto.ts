import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { SlaCategories, TicketPriority } from '../enums/sla-categories.enum';
import { SlaStatus } from '../enums/sla-targets.enum';

export class SlaMetricsDto {
  @IsString()
  ticketId: string;

  @IsOptional()
  @IsDateString()
  firstResponseAt?: Date;

  @IsOptional()
  @IsDateString()
  resolvedAt?: Date;

  @IsOptional()
  @IsNumber()
  responseTimeMinutes?: number;

  @IsOptional()
  @IsNumber()
  resolutionTimeMinutes?: number;

  @IsOptional()
  @IsEnum(SlaStatus)
  responseSlaStatus?: SlaStatus;

  @IsOptional()
  @IsEnum(SlaStatus)
  resolutionSlaStatus?: SlaStatus;

  @IsOptional()
  @IsEnum(SlaCategories)
  slaCategory?: SlaCategories;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}

export class SlaConfigDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsEnum(TicketPriority)
  priority: TicketPriority;

  @IsNumber()
  responseTimeTarget: number;

  @IsNumber()
  resolutionTimeTarget: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class SlaMetricsResponseDto {
  totalTickets: number;
  compliantTickets: number;
  atRiskTickets: number;
  breachedTickets: number;
  complianceRate: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  metricsByPriority: Record<
    string,
    {
      total: number;
      compliant: number;
      atRisk: number;
      breached: number;
      complianceRate: number;
      avgResponseTime: number;
      avgResolutionTime: number;
    }
  >;
}
