import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import {
  DashboardOverview,
  DashboardMetrics,
  PerformanceReport,
  DashboardKPIs,
  Alert,
  DateFilter,
  PeriodType,
} from '../types/dashboard';

// Hook para Overview do Dashboard
export const useDashboardOverview = () => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getDashboardOverview();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook para KPIs
export const useDashboardKPIs = () => {
  const [data, setData] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getDashboardKPIs();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar KPIs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook para Métricas do Dashboard
export const useDashboardMetrics = (filters?: DateFilter) => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let result: DashboardMetrics;

      if (filters?.period) {
        switch (filters.period) {
          case 'today':
            result = await apiService.getTodayMetrics();
            break;
          case 'week':
            result = await apiService.getWeekMetrics();
            break;
          case 'month':
            result = await apiService.getMonthMetrics();
            break;
          case 'quarter':
            result = await apiService.getQuarterMetrics();
            break;
          case 'year':
            result = await apiService.getYearMetrics();
            break;
          default:
            result = await apiService.getDashboardMetrics(filters);
        }
      } else {
        result = await apiService.getDashboardMetrics(filters);
      }

      setData(result);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook para Performance Report
export const usePerformanceReport = (filters?: DateFilter) => {
  const [data, setData] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let result: PerformanceReport;

      if (filters?.period) {
        switch (filters.period) {
          case 'month':
            result = await apiService.getCurrentMonthPerformance();
            break;
          case 'quarter':
            result = await apiService.getCurrentQuarterPerformance();
            break;
          case 'year':
            result = await apiService.getCurrentYearPerformance();
            break;
          default:
            result = await apiService.getPerformanceReport(filters);
        }
      } else {
        result = await apiService.getPerformanceReport(filters);
      }

      setData(result);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar relatório de performance');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook para Alertas
export const useAlerts = () => {
  const [data, setData] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getDashboardAlerts();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar alertas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Atualizar alertas a cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook para Distribuições
export const useDistributions = () => {
  const [statusDistribution, setStatusDistribution] = useState<
    Record<string, number>
  >({});
  const [priorityDistribution, setPriorityDistribution] = useState<
    Record<string, number>
  >({});
  const [categoryDistribution, setCategoryDistribution] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [status, priority, category] = await Promise.all([
        apiService.getStatusDistribution(),
        apiService.getPriorityDistribution(),
        apiService.getCategoryDistribution(),
      ]);

      setStatusDistribution(status);
      setPriorityDistribution(priority);
      setCategoryDistribution(category);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar distribuições');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    statusDistribution,
    priorityDistribution,
    categoryDistribution,
    loading,
    error,
    refetch: fetchData,
  };
};

// Hook para Performance de Agentes
export const useAgentPerformance = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getAgentPerformance();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar performance dos agentes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook para Health Check
export const useHealthCheck = () => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = useCallback(async () => {
    try {
      setLoading(true);
      const healthy = await apiService.healthCheck();
      setIsHealthy(healthy);
    } catch {
      setIsHealthy(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();

    // Verificar saúde a cada 60 segundos
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return { isHealthy, loading, checkHealth };
};
