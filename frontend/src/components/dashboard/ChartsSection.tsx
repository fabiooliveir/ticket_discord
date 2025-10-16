import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import LoadingSpinner from '../common/LoadingSpinner';
import apiService from '../../services/api';

interface ChartsSectionProps {
  period?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ChartsSection: React.FC<ChartsSectionProps> = ({ period = 'month' }) => {
  const theme = useTheme();
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [timeline, distribution] = await Promise.all([
          apiService.getTimelineCharts(30),
          apiService.getDistributionCharts(),
        ]);

        setTimelineData(timeline.ticketsCreated);
        setDistributionData(distribution);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados dos gráficos');
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [period]);

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2].map((item) => (
          <Grid item xs={12} key={item}>
            <Paper sx={{ p: 3, height: 400 }}>
              <LoadingSpinner message="Carregando gráficos..." />
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  const formatTooltipValue = (value: any, name: string) => {
    if (name === 'count' || name.includes('tickets')) {
      return [`${value} tickets`, name];
    }
    if (name.includes('rate') || name.includes('Rate')) {
      return [`${value}%`, name];
    }
    return [value, name];
  };

  return (
    <Grid container spacing={3}>
      {/* Gráfico de Timeline - Tickets Criados */}
      <Grid item xs={12} lg={8}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Evolução de Tickets
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={formatTooltipValue}
                labelStyle={{ color: theme.palette.text.primary }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="count"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
                name="Tickets Criados"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Gráfico de Distribuição por Prioridade */}
      <Grid item xs={12} lg={4}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Distribuição por Prioridade
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData.byPriority || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(distributionData.byPriority || []).map(
                  (entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ),
                )}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Gráfico de Compliance Rate */}
      <Grid item xs={12} lg={6}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Taxa de Compliance
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                formatter={(value: any) => [`${value}%`, 'Taxa de Compliance']}
                labelStyle={{ color: theme.palette.text.primary }}
              />
              <Line
                type="monotone"
                dataKey="complianceRate"
                stroke="#00C49F"
                strokeWidth={3}
                dot={{ fill: '#00C49F', strokeWidth: 2, r: 4 }}
                name="Taxa de Compliance (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Gráfico de Distribuição por Status */}
      <Grid item xs={12} lg={6}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Distribuição por Status
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distributionData.byStatus || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={formatTooltipValue} />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Gráfico de Distribuição Horária */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Distribuição Horária de Tickets
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distributionData.hourly || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}h`}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: any) => [`${value} tickets`, 'Tickets']}
                labelFormatter={(label) => `${label}h`}
              />
              <Bar dataKey="count" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ChartsSection;
