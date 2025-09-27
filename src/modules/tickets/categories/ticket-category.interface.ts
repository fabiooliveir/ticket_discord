export interface TicketCategory {
  id: string;
  name: string;
  description: string;
  team: 'suporte' | 'cs' | 'trafico';
  priority: 'low' | 'medium' | 'high';
  requiresClient: boolean;
  formFields: FormField[];
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'button';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

export interface CategoryTicketData {
  categoryId: string;
  clientId?: string;
  clientName?: string;
  team: string;
  priority: 'low' | 'medium' | 'high';
  [key: string]: any;
}
