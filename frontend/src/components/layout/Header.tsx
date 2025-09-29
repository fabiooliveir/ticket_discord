import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Badge,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Dashboard,
  Notifications,
  Refresh,
  Settings,
  Logout,
} from '@mui/icons-material';
import { useHealthCheck } from '../../hooks/useDashboard';

interface HeaderProps {
  onRefresh?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
  notificationCount?: number;
}

const Header: React.FC<HeaderProps> = ({
  onRefresh,
  onSettingsClick,
  onLogout,
  notificationCount = 0,
}) => {
  const theme = useTheme();
  const { isHealthy, loading } = useHealthCheck();

  const getHealthStatus = () => {
    if (loading) return { label: 'Verificando...', color: 'default' as const };
    if (isHealthy) return { label: 'Online', color: 'success' as const };
    return { label: 'Offline', color: 'error' as const };
  };

  const healthStatus = getHealthStatus();

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[1],
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Dashboard 
            sx={{ 
              color: theme.palette.primary.main,
              fontSize: 32,
            }} 
          />
          <Typography
            variant="h6"
            component="h1"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
            }}
          >
            Ticket Dashboard
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              ml: 1,
            }}
          >
            SLA Metrics
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Status de Saúde do Sistema */}
          <Chip
            label={healthStatus.label}
            color={healthStatus.color}
            size="small"
            variant="outlined"
          />

          {/* Botão de Atualizar */}
          {onRefresh && (
            <IconButton
              onClick={onRefresh}
              color="primary"
              title="Atualizar dados"
              sx={{
                backgroundColor: `${theme.palette.primary.main}10`,
                '&:hover': {
                  backgroundColor: `${theme.palette.primary.main}20`,
                },
              }}
            >
              <Refresh />
            </IconButton>
          )}

          {/* Notificações */}
          <IconButton
            color="inherit"
            title="Notificações"
            sx={{
              color: theme.palette.text.primary,
            }}
          >
            <Badge 
              badgeContent={notificationCount} 
              color="error"
              max={99}
            >
              <Notifications />
            </Badge>
          </IconButton>

          {/* Configurações */}
          {onSettingsClick && (
            <IconButton
              onClick={onSettingsClick}
              color="inherit"
              title="Configurações"
              sx={{
                color: theme.palette.text.primary,
              }}
            >
              <Settings />
            </IconButton>
          )}

          {/* Logout */}
          {onLogout && (
            <IconButton
              onClick={onLogout}
              color="inherit"
              title="Sair"
              sx={{
                color: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: `${theme.palette.error.main}10`,
                },
              }}
            >
              <Logout />
            </IconButton>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
