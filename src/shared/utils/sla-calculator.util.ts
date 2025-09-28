import { SlaTargets, SlaStatus } from '../enums/sla-targets.enum';
import { TicketPriority, SlaCategories } from '../enums/sla-categories.enum';

export class SlaCalculator {
  /**
   * Calcula o tempo de resposta em minutos entre duas datas
   */
  static calculateResponseTime(
    createdAt: Date,
    firstResponseAt: Date,
    _slaCategory: SlaCategories = SlaCategories.BUSINESS_HOURS,
  ): number {
    if (!firstResponseAt) return 0;

    // Para simplicidade, usando diferença direta em minutos
    // Em produção, deveria considerar horário comercial
    const diffMs = firstResponseAt.getTime() - createdAt.getTime();
    return Math.round(diffMs / (1000 * 60)); // converter para minutos
  }

  /**
   * Calcula o tempo de resolução em minutos entre duas datas
   */
  static calculateResolutionTime(
    createdAt: Date,
    resolvedAt: Date,
    _slaCategory: SlaCategories = SlaCategories.BUSINESS_HOURS,
  ): number {
    if (!resolvedAt) return 0;

    const diffMs = resolvedAt.getTime() - createdAt.getTime();
    return Math.round(diffMs / (1000 * 60)); // converter para minutos
  }

  /**
   * Obtém o target de tempo de resposta baseado na prioridade
   */
  static getResponseTimeTarget(priority: TicketPriority): number {
    switch (priority) {
      case TicketPriority.CRITICAL:
        return 15; // 15 minutos para crítico
      case TicketPriority.HIGH:
        return SlaTargets.HIGH_PRIORITY_RESPONSE;
      case TicketPriority.MEDIUM:
        return SlaTargets.MEDIUM_PRIORITY_RESPONSE;
      case TicketPriority.LOW:
        return SlaTargets.LOW_PRIORITY_RESPONSE;
      default:
        return SlaTargets.MEDIUM_PRIORITY_RESPONSE;
    }
  }

  /**
   * Obtém o target de tempo de resolução baseado na prioridade
   */
  static getResolutionTimeTarget(priority: TicketPriority): number {
    switch (priority) {
      case TicketPriority.CRITICAL:
        return 120; // 2 horas para crítico
      case TicketPriority.HIGH:
        return SlaTargets.HIGH_PRIORITY_RESOLUTION;
      case TicketPriority.MEDIUM:
        return SlaTargets.MEDIUM_PRIORITY_RESOLUTION;
      case TicketPriority.LOW:
        return SlaTargets.LOW_PRIORITY_RESOLUTION;
      default:
        return SlaTargets.MEDIUM_PRIORITY_RESOLUTION;
    }
  }

  /**
   * Verifica o status do SLA de resposta
   */
  static getResponseSlaStatus(
    responseTimeMinutes: number,
    priority: TicketPriority,
  ): SlaStatus {
    if (!responseTimeMinutes) return SlaStatus.NOT_APPLICABLE;

    const target = this.getResponseTimeTarget(priority);
    const riskThreshold = target * 0.8; // 80% do target = em risco

    if (responseTimeMinutes <= target) {
      return SlaStatus.COMPLIANT;
    } else if (responseTimeMinutes <= riskThreshold * 1.25) {
      return SlaStatus.AT_RISK;
    } else {
      return SlaStatus.BREACHED;
    }
  }

  /**
   * Verifica o status do SLA de resolução
   */
  static getResolutionSlaStatus(
    resolutionTimeMinutes: number,
    priority: TicketPriority,
  ): SlaStatus {
    if (!resolutionTimeMinutes) return SlaStatus.NOT_APPLICABLE;

    const target = this.getResolutionTimeTarget(priority);
    const riskThreshold = target * 0.8; // 80% do target = em risco

    if (resolutionTimeMinutes <= target) {
      return SlaStatus.COMPLIANT;
    } else if (resolutionTimeMinutes <= riskThreshold * 1.25) {
      return SlaStatus.AT_RISK;
    } else {
      return SlaStatus.BREACHED;
    }
  }

  /**
   * Calcula o tempo de duração total em minutos entre criação e arquivamento
   */
  static calculateDurationTime(
    createdAt: Date,
    closedAt: Date,
    _slaCategory: SlaCategories = SlaCategories.BUSINESS_HOURS,
  ): number {
    if (!closedAt) return 0;

    const diffMs = closedAt.getTime() - createdAt.getTime();
    return Math.round(diffMs / (1000 * 60)); // converter para minutos
  }

  /**
   * Obtém o target de tempo de duração baseado na prioridade
   */
  static getDurationTimeTarget(priority: TicketPriority): number {
    switch (priority) {
      case TicketPriority.CRITICAL:
        return 240; // 4 horas para crítico
      case TicketPriority.HIGH:
        return SlaTargets.HIGH_PRIORITY_DURATION;
      case TicketPriority.MEDIUM:
        return SlaTargets.MEDIUM_PRIORITY_DURATION;
      case TicketPriority.LOW:
        return SlaTargets.LOW_PRIORITY_DURATION;
      default:
        return SlaTargets.MEDIUM_PRIORITY_DURATION;
    }
  }

  /**
   * Verifica o status do SLA de duração total
   */
  static getDurationSlaStatus(
    durationTimeMinutes: number,
    priority: TicketPriority,
  ): SlaStatus {
    if (!durationTimeMinutes) return SlaStatus.NOT_APPLICABLE;

    const target = this.getDurationTimeTarget(priority);
    const riskThreshold = target * 0.8; // 80% do target = em risco

    if (durationTimeMinutes <= target) {
      return SlaStatus.COMPLIANT;
    } else if (durationTimeMinutes <= target * 1.25) {
      // 125% do target = em risco
      return SlaStatus.AT_RISK;
    } else {
      return SlaStatus.BREACHED;
    }
  }

  /**
   * Calcula taxa de compliance geral
   */
  static calculateComplianceRate(compliant: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((compliant / total) * 100);
  }
}
