import { Injectable } from '@nestjs/common';
import { techChecklist } from './tech';
import { trafegoChecklist } from './trafego';
import { suporteChecklist } from './suporte';

export type ChecklistData = {
  name: string;
  steps: readonly string[];
};

@Injectable()
export class ChecklistService {
  private readonly registry: Record<string, ChecklistData> = {
    tech: techChecklist,
    trafego: trafegoChecklist,
    suporte: suporteChecklist,
  };

  getCategories(): Array<{ name: string; value: string }> {
    return Object.entries(this.registry).map(([key, value]) => ({
      name: value.name,
      value: key,
    }));
  }

  getChecklistByCategory(category: string): ChecklistData | null {
    const key = (category || '').toLowerCase();
    return this.registry[key] || null;
  }
}


