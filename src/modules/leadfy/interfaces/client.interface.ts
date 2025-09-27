export interface LeadfyClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

export interface LeadfyApiResponse {
  success: boolean;
  data?: LeadfyClient[];
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface LeadfySyncResult {
  success: boolean;
  clientsCount: number;
  lastSync: Date;
  errors?: string[];
}
