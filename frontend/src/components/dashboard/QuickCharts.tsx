import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, useTheme } from '@mui/material';
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const QuickCharts: React.FC = () => {
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
          apiService.getTimelineCharts(7), // Últimos 7 dias para gráfico mais compacto
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
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LoadingSpinner message="Carregando gráficos..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
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
    <Grid container spacing={2} sx={{ height: '100%' }}>
      {/* Gráfico de Timeline Compacto */}
      <Grid item xs={12} md={8}>
        <Box sx={{ height: 280 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Tickets (7 dias)
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.palette.divider}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={formatTooltipValue}
                labelStyle={{ color: theme.palette.text.primary }}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
                name="Tickets"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Grid>

      {/* Gráfico de Distribuição por Prioridade Compacto */}
      <Grid item xs={12} md={4}>
        <Box sx={{ height: 280 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Por Prioridade
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distributionData.byPriority || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={60}
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
              <Tooltip
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Grid>

      {/* Gráfico de Status Compacto */}
      <Grid item xs={12}>
        <Box sx={{ height: 200 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Status dos Tickets
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData.byStatus || []}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.palette.divider}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="value" fill="#00C49F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Grid>
    </Grid>
  );
};

export default QuickCharts;
