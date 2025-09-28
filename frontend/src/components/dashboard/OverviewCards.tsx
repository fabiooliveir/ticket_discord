import React from 'react';
import {
  Grid,
  Box,
  useTheme,
} from '@mui/material';
import {
  Assignment,
  AssignmentTurnedIn,
  Schedule,
  Warning,
  CheckCircle,
  TrendingUp,
  AccessTime,
  Timer,
  Speed,
  Assessment,
} from '@mui/icons-material';
import MetricCard from '../common/MetricCard';
import { DashboardOverview } from '../../types/dashboard';

interface OverviewCardsProps {
  data: DashboardOverview;
  loading?: boolean;
}

const OverviewCards: React.FC<OverviewCardsProps> = ({ data, loading = false }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item}>
            <Box
              sx={{
                height: 200,
                backgroundColor: theme.palette.grey[100],
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.grey[300],
                }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  }

  const { summary, trends, performance } = data;

  const calculateComplianceTrend = () => {
    // Simulação de cálculo de tendência baseado em dados históricos
    const currentRate = summary.complianceRate;
    const previousRate = Math.max(0, currentRate - 5); // Simulação
    
    if (currentRate > previousRate) {
      return {
        value: Math.round(((currentRate - previousRate) / previousRate) * 100),
        isPositive: true,
      };
    } else if (currentRate < previousRate) {
      return {
        value: Math.round(((previousRate - currentRate) / previousRate) * 100),
        isPositive: false,
      };
    }
    
    return {
      value: 0,
      isPositive: true,
    };
  };

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

  return (
    <Grid container spacing={3}>
      {/* Total de Tickets */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Total de Tickets"
          value={summary.totalTickets}
          subtitle={`${trends.ticketsCreatedToday} criados hoje`}
          color="primary"
          icon={<Assignment />}
        />
      </Grid>

      {/* Tickets Abertos */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Tickets Abertos"
          value={summary.openTickets}
          subtitle={`${trends.ticketsCreatedThisWeek} esta semana`}
          color="secondary"
          icon={<AssignmentTurnedIn />}
        />
      </Grid>

      {/* Tickets Fechados */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Tickets Fechados"
          value={summary.closedTickets}
          subtitle={`${trends.ticketsClosedToday} fechados hoje`}
          color="success"
          icon={<CheckCircle />}
        />
      </Grid>

      {/* Taxa de Compliance */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Taxa de Compliance"
          value={`${summary.complianceRate}%`}
          subtitle="SLA em dia"
          trend={calculateComplianceTrend()}
          color={summary.complianceRate >= 90 ? 'success' : summary.complianceRate >= 70 ? 'warning' : 'error'}
          icon={<TrendingUp />}
        />
      </Grid>

      {/* Tempo Médio de Resposta */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Tempo Médio de Resposta"
          value={formatTime(summary.averageResponseTime)}
          subtitle="Primeira resposta"
          color="primary"
          icon={<Schedule />}
        />
      </Grid>

      {/* Violações SLA */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Violações SLA"
          value={summary.slaBreaches}
          subtitle={summary.slaBreaches === 0 ? 'Nenhuma violação' : 'Requer atenção'}
          color={summary.slaBreaches === 0 ? 'success' : 'error'}
          icon={<Warning />}
        />
      </Grid>

      {/* Fase 3: Cards de SLA de Duração */}
      
      {/* Duração Média Total */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Duração Média Total"
          value={formatTime(summary.durationSla.averageDurationTime)}
          subtitle="Criação até arquivamento"
          color="primary"
          icon={<AccessTime />}
        />
      </Grid>

      {/* Compliance de Duração */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Compliance de Duração"
          value={`${summary.durationSla.durationComplianceRate}%`}
          subtitle="SLA de duração em dia"
          color={summary.durationSla.durationComplianceRate >= 90 ? 'success' : summary.durationSla.durationComplianceRate >= 70 ? 'warning' : 'error'}
          icon={<Timer />}
        />
      </Grid>

      {/* Tickets com Duração */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Tickets com Duração"
          value={summary.durationSla.ticketsWithDuration}
          subtitle={`${summary.durationSla.ticketsWithoutDuration} sem duração`}
          color="info"
          icon={<Speed />}
        />
      </Grid>

      {/* Violações de Duração */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Violações de Duração"
          value={summary.durationSla.slaBreaches}
          subtitle={summary.durationSla.slaBreaches === 0 ? 'Nenhuma violação' : 'Requer atenção'}
          color={summary.durationSla.slaBreaches === 0 ? 'success' : 'error'}
          icon={<Assessment />}
        />
      </Grid>

      {/* Tickets em Risco de Duração */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Tickets em Risco"
          value={summary.durationSla.slaAtRisk}
          subtitle="Próximos de violar SLA"
          color={summary.durationSla.slaAtRisk === 0 ? 'success' : 'warning'}
          icon={<Warning />}
        />
      </Grid>
    </Grid>
  );
};

export default OverviewCards;
