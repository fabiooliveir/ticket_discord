export interface NewTaggingData {
  clientId: string;
  clientName: string;
  team: string;
  priority: 'low' | 'medium' | 'high';
  metaAccountId: string;
  googleAdsAccountId: string;
  facebookPixelId: string;
  additionalInfo?: string;
}

export interface NewTaggingFormData {
  metaAccountId: string;
  googleAdsAccountId: string;
  facebookPixelId: string;
  additionalInfo?: string;
  team: string;
  priority: 'low' | 'medium' | 'high';
}
