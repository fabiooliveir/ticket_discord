export interface CorrectionTaggingData {
  clientId: string;
  clientName: string;
  team: string;
  priority: 'low' | 'medium' | 'high';
  website: string;
  problemDescription: string;
  additionalInfo?: string;
}

export interface CorrectionTaggingFormData {
  website: string;
  problemDescription: string;
  additionalInfo?: string;
  team: string;
  priority: 'low' | 'medium' | 'high';
}
