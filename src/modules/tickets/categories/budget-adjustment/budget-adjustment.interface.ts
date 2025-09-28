export interface BudgetAdjustmentData {
  clientId: string;
  clientName: string;
  team: string;
  priority: 'low' | 'medium' | 'high';
  adjustmentReason: string;
  requestedAmount: string;
  campaignInfo?: string;
}

export interface BudgetAdjustmentFormData {
  adjustmentReason: string;
  requestedAmount: string;
  campaignInfo?: string;
}
