export enum SlaTargets {
  // Tempos de resposta em minutos
  HIGH_PRIORITY_RESPONSE = 30, // 30 minutos
  MEDIUM_PRIORITY_RESPONSE = 120, // 2 horas
  LOW_PRIORITY_RESPONSE = 480, // 8 horas

  // Tempos de resolução em minutos
  HIGH_PRIORITY_RESOLUTION = 240, // 4 horas
  MEDIUM_PRIORITY_RESOLUTION = 1440, // 24 horas
  LOW_PRIORITY_RESOLUTION = 4320, // 72 horas
}

export enum SlaStatus {
  COMPLIANT = 'compliant',
  AT_RISK = 'at_risk',
  BREACHED = 'breached',
  NOT_APPLICABLE = 'not_applicable',
}
