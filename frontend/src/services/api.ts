import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  DashboardOverview,
  DashboardMetrics,
  PerformanceReport,
  DashboardKPIs,
  Alert,
  DateFilter,
  ChartDataPoint,
  DistributionChartData,
  HourlyChartData,
} from '../types/dashboard';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers = config.headers || {};
        (config.headers as any)['Authorization'] = `Bearer ${token}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error?.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async login(username: string, password: string): Promise<void> {
    const response = await this.api.post('/auth/login', { username, password });
    const data = response.data as any;
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  // Dashboard Overview
  async getDashboardOverview(): Promise<DashboardOverview> {
    const response = await this.api.get('/dashboard/overview');
    return response.data;
  }

  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const response = await this.api.get('/dashboard/kpis');
    return response.data;
  }

  async getDashboardAlerts(): Promise<Alert[]> {
    const response = await this.api.get('/dashboard/alerts');
    return response.data;
  }

  async getDashboardTrends(): Promise<any> {
    const response = await this.api.get('/dashboard/trends');
    return response.data;
  }

  // Dashboard Metrics
  async getDashboardMetrics(filters?: DateFilter): Promise<DashboardMetrics> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.period) params.append('period', filters.period);

    const response = await this.api.get(`/dashboard/metrics?${params.toString()}`);
    return response.data;
  }

  async getTodayMetrics(): Promise<DashboardMetrics> {
    const response = await this.api.get('/dashboard/metrics/today');
    return response.data;
  }

  async getWeekMetrics(): Promise<DashboardMetrics> {
    const response = await this.api.get('/dashboard/metrics/week');
    return response.data;
  }

  async getMonthMetrics(): Promise<DashboardMetrics> {
    const response = await this.api.get('/dashboard/metrics/month');
    return response.data;
  }

  async getQuarterMetrics(): Promise<DashboardMetrics> {
    const response = await this.api.get('/dashboard/metrics/quarter');
    return response.data;
  }

  async getYearMetrics(): Promise<DashboardMetrics> {
    const response = await this.api.get('/dashboard/metrics/year');
    return response.data;
  }

  // Performance Reports
  async getPerformanceReport(filters?: DateFilter): Promise<PerformanceReport> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await this.api.get(`/dashboard/performance?${params.toString()}`);
    return response.data;
  }

  async getCurrentMonthPerformance(): Promise<PerformanceReport> {
    const response = await this.api.get('/dashboard/performance/month');
    return response.data;
  }

  async getCurrentQuarterPerformance(): Promise<PerformanceReport> {
    const response = await this.api.get('/dashboard/performance/quarter');
    return response.data;
  }

  async getCurrentYearPerformance(): Promise<PerformanceReport> {
    const response = await this.api.get('/dashboard/performance/year');
    return response.data;
  }

  // Distributions
  async getStatusDistribution(): Promise<Record<string, number>> {
    const response = await this.api.get('/dashboard/distribution/status');
    return response.data;
  }

  async getPriorityDistribution(): Promise<Record<string, number>> {
    const response = await this.api.get('/dashboard/distribution/priority');
    return response.data;
  }

  async getCategoryDistribution(): Promise<Record<string, number>> {
    const response = await this.api.get('/dashboard/distribution/category');
    return response.data;
  }

  async getHourlyDistribution(): Promise<HourlyChartData[]> {
    const response = await this.api.get('/dashboard/distribution/hourly');
    return response.data;
  }

  // Agent Performance
  async getAgentPerformance(): Promise<any[]> {
    const response = await this.api.get('/dashboard/performance/agents');
    return response.data;
  }

  // Daily Trends
  async getDailyTrends(): Promise<any[]> {
    const response = await this.api.get('/dashboard/trends/daily');
    return response.data;
  }

  // SLA Details
  async getSLADetails(): Promise<any> {
    const response = await this.api.get('/dashboard/sla/details');
    return response.data;
  }

  // Charts Data
  async getTimelineCharts(days: number = 30): Promise<{
    ticketsCreated: ChartDataPoint[];
    ticketsClosed: ChartDataPoint[];
    complianceRate: ChartDataPoint[];
  }> {
    const response = await this.api.get(`/dashboard/charts/timeline?days=${days}`);
    return response.data;
  }

  async getDistributionCharts(): Promise<{
    byStatus: DistributionChartData[];
    byPriority: DistributionChartData[];
    byCategory: DistributionChartData[];
    hourly: HourlyChartData[];
  }> {
    const response = await this.api.get('/dashboard/charts/distribution');
    return response.data;
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      await this.api.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  // User Profile Management
  async getCurrentUser(): Promise<any> {
    const response = await this.api.get('/users/me');
    return response.data;
  }

  async updateMyProfile(data: { email?: string; phone?: string }): Promise<any> {
    const response = await this.api.patch('/users/me', data);
    return response.data;
  }

  async changeMyPassword(data: { currentPassword: string; newPassword: string }): Promise<any> {
    const response = await this.api.patch('/users/me/password', data);
    return response.data;
  }
}

// Instância singleton
const apiService = new ApiService();

export default apiService;
