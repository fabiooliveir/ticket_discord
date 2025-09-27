import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Alert,
  AlertTitle,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  NotificationsNone,
} from '@mui/icons-material';
import { Alert as AlertType } from '../../types/dashboard';

interface AlertsPanelProps {
  alerts: AlertType[];
  loading?: boolean;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, loading = false }) => {
  const theme = useTheme();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'breach':
        return <Error />;
      case 'at_risk':
        return <Warning />;
      case 'high_volume':
        return <Info />;
      default:
        return <NotificationsNone />;
    }
  };

  const getAlertSeverity = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'breach':
        return theme.palette.error.main;
      case 'at_risk':
        return theme.palette.warning.main;
      case 'high_volume':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getAlertTitle = (type: string) => {
    switch (type) {
      case 'breach':
        return 'Violação de SLA';
      case 'at_risk':
        return 'SLA em Risco';
      case 'high_volume':
        return 'Alto Volume';
      default:
        return 'Alerta';
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: 400 }}>
        <Typography variant="h6" gutterBottom>
          Alertas do Sistema
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 300,
          }}
        >
          <Typography color="text.secondary">
            Carregando alertas...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (alerts.length === 0) {
    return (
      <Paper sx={{ p: 3, height: 400 }}>
        <Typography variant="h6" gutterBottom>
          Alertas do Sistema
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 300,
            gap: 2,
          }}
        >
          <NotificationsNone
            sx={{
              fontSize: 64,
              color: theme.palette.success.main,
            }}
          />
          <Typography variant="h6" color="success.main">
            Nenhum alerta ativo
          </Typography>
          <Typography color="text.secondary" textAlign="center">
            Todos os sistemas estão funcionando normalmente
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: 400, overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Alertas do Sistema
        <Chip
          label={alerts.length}
          color="error"
          size="small"
          sx={{ ml: 1 }}
        />
      </Typography>

      <List sx={{ pt: 0 }}>
        {alerts.map((alert, index) => (
          <Alert
            key={index}
            severity={getAlertSeverity(alert.priority) as any}
            sx={{ mb: 2 }}
            icon={getAlertIcon(alert.type)}
          >
            <AlertTitle>
              {getAlertTitle(alert.type)}
              <Chip
                label={alert.priority.toUpperCase()}
                size="small"
                sx={{
                  ml: 1,
                  backgroundColor: getAlertColor(alert.type),
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            </AlertTitle>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {alert.message}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Afetados: {alert.count} tickets
              </Typography>
            </Box>
          </Alert>
        ))}
      </List>
    </Paper>
  );
};

export default AlertsPanel;
