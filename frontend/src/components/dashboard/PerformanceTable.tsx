import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  IconButton,
  TableSortLabel,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Visibility,
} from '@mui/icons-material';
import { AgentPerformanceMetrics } from '../../types/dashboard';

interface PerformanceTableProps {
  data: any[];
  loading?: boolean;
}

type SortField =
  | 'agentId'
  | 'ticketsAssigned'
  | 'ticketsResolved'
  | 'complianceRate'
  | 'averageResponseTime'
  | 'averageResolutionTime';
type SortDirection = 'asc' | 'desc';

const PerformanceTable: React.FC<PerformanceTableProps> = ({
  data,
  loading = false,
}) => {
  const theme = useTheme();
  const [sortField, setSortField] = useState<SortField>('complianceRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a.metrics?.[sortField] || a[sortField] || 0;
    const bValue = b.metrics?.[sortField] || b[sortField] || 0;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    const numA = Number(aValue);
    const numB = Number(bValue);

    return sortDirection === 'asc' ? numA - numB : numB - numA;
  });

  const formatTime = (minutes: number): string => {
    if (minutes === 0) return '0 min';
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours < 24) {
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}min`
        : `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return 'success';
    if (rate >= 70) return 'warning';
    return 'error';
  };

  const getTrendIcon = (trends: any) => {
    if (!trends) return <TrendingFlat fontSize="small" />;

    const weekOverWeek = trends.weekOverWeek || 0;
    if (weekOverWeek > 0)
      return <TrendingUp fontSize="small" color="success" />;
    if (weekOverWeek < 0)
      return <TrendingDown fontSize="small" color="error" />;
    return <TrendingFlat fontSize="small" />;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Performance dos Agentes
        </Typography>
        <Box
          sx={{
            height: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="text.secondary">Carregando dados...</Typography>
        </Box>
      </Paper>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Performance dos Agentes
        </Typography>
        <Box
          sx={{
            height: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="text.secondary">
            Nenhum dado de performance disponível
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">Performance dos Agentes</Typography>
        <Typography variant="body2" color="text.secondary">
          {data.length} agentes
        </Typography>
      </Box>

      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'agentId'}
                  direction={sortField === 'agentId' ? sortDirection : 'asc'}
                  onClick={() => handleSort('agentId')}
                >
                  Agente
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'ticketsAssigned'}
                  direction={
                    sortField === 'ticketsAssigned' ? sortDirection : 'asc'
                  }
                  onClick={() => handleSort('ticketsAssigned')}
                >
                  Tickets Atribuídos
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'ticketsResolved'}
                  direction={
                    sortField === 'ticketsResolved' ? sortDirection : 'asc'
                  }
                  onClick={() => handleSort('ticketsResolved')}
                >
                  Resolvidos
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'complianceRate'}
                  direction={
                    sortField === 'complianceRate' ? sortDirection : 'asc'
                  }
                  onClick={() => handleSort('complianceRate')}
                >
                  Taxa de Compliance
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'averageResponseTime'}
                  direction={
                    sortField === 'averageResponseTime' ? sortDirection : 'asc'
                  }
                  onClick={() => handleSort('averageResponseTime')}
                >
                  Tempo de Resposta
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'averageResolutionTime'}
                  direction={
                    sortField === 'averageResolutionTime'
                      ? sortDirection
                      : 'asc'
                  }
                  onClick={() => handleSort('averageResolutionTime')}
                >
                  Tempo de Resolução
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Tendência</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((agent, index) => {
              const metrics = agent.metrics || agent;
              const trends = agent.trends || {};

              return (
                <TableRow key={agent.agentId || index} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {agent.agentName || `Agente ${agent.agentId}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {agent.agentId}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {metrics.ticketsAssigned || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {metrics.ticketsResolved || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${metrics.complianceRate || 0}%`}
                      color={
                        getComplianceColor(metrics.complianceRate || 0) as any
                      }
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatTime(metrics.averageResponseTime || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatTime(metrics.averageResolutionTime || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getTrendIcon(trends)}
                      {trends.weekOverWeek !== undefined && (
                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                          {trends.weekOverWeek > 0 ? '+' : ''}
                          {trends.weekOverWeek}%
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary">
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default PerformanceTable;
