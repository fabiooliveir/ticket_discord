import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Chip,
  useTheme,
} from '@mui/material';
import {
  AccessTime,
  Timer,
  Speed,
  Assessment,
} from '@mui/icons-material';
import MetricCard from '../common/MetricCard';
import { DashboardOverview } from '../../types/dashboard';

interface DurationSlaSectionProps {
  data: DashboardOverview;
  loading?: boolean;
}

const DurationSlaSection: React.FC<DurationSlaSectionProps> = ({ data, loading = false }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          SLA de Duração Total
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: theme.palette.grey[300],
            }}
          />
        </Box>
      </Paper>
    );
  }

  const { durationSla } = data.summary;

  const formatTime = (minutes: number): string => {
    if (minutes === 0) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Crítica';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTime color="primary" />
        SLA de Duração Total
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Métricas de duração do atendimento desde a criação até o arquivamento
      </Typography>

      {/* Cards de Resumo */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Duração Média"
            value={formatTime(durationSla.averageDurationTime)}
            subtitle="Tempo médio total"
            color="primary"
            icon={<Timer />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Compliance"
            value={`${durationSla.durationComplianceRate}%`}
            subtitle="Taxa de compliance"
            color={durationSla.durationComplianceRate >= 90 ? 'success' : durationSla.durationComplianceRate >= 70 ? 'warning' : 'error'}
            icon={<Assessment />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Com Duração"
            value={durationSla.ticketsWithDuration}
            subtitle={`${durationSla.ticketsWithoutDuration} sem duração`}
            color="info"
            icon={<Speed />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Violações"
            value={durationSla.slaBreaches}
            subtitle={`${durationSla.slaAtRisk} em risco`}
            color={durationSla.slaBreaches === 0 ? 'success' : 'error'}
            icon={<Assessment />}
          />
        </Grid>
      </Grid>

      {/* Performance por Prioridade */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Performance por Prioridade
      </Typography>

      <Grid container spacing={2}>
        {Object.entries(durationSla.performanceByPriority).map(([priority, metrics]) => {
          if (metrics.total === 0) return null;

          return (
            <Grid item xs={12} sm={6} md={3} key={priority}>
              <Paper
                sx={{
                  p: 2,
                  border: `2px solid ${theme.palette[getPriorityColor(priority) as keyof typeof theme.palette].main}`,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {getPriorityLabel(priority)}
                  </Typography>
                  <Chip
                    label={priority.toUpperCase()}
                    color={getPriorityColor(priority) as any}
                    size="small"
                  />
                </Box>

                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Duração Média
                  </Typography>
                  <Typography variant="h6">
                    {formatTime(metrics.avgTime)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Compliance
                  </Typography>
                  <Typography 
                    variant="h6"
                    color={metrics.complianceRate >= 90 ? 'success.main' : metrics.complianceRate >= 70 ? 'warning.main' : 'error.main'}
                  >
                    {metrics.complianceRate}%
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total de Tickets
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {metrics.total}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {Object.values(durationSla.performanceByPriority).every(metrics => metrics.total === 0) && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Nenhum ticket com duração calculada por prioridade
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DurationSlaSection;

