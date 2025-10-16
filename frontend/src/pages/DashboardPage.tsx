import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Fab,
  useTheme,
} from '@mui/material';
import { Refresh, Menu } from '@mui/icons-material';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import OverviewCards from '../components/dashboard/OverviewCards';
import DurationSlaSection from '../components/dashboard/DurationSlaSection';
import AlertsPanel from '../components/dashboard/AlertsPanel';
import ChartsSection from '../components/dashboard/ChartsSection';
import QuickCharts from '../components/dashboard/QuickCharts';
import PerformanceTable from '../components/dashboard/PerformanceTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBoundary from '../components/common/ErrorBoundary';
import {
  useDashboardOverview,
  useAlerts,
  useAgentPerformance,
} from '../hooks/useDashboard';

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Hooks para dados
  const {
    data: overviewData,
    loading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useDashboardOverview();

  const {
    data: alertsData,
    loading: alertsLoading,
    refetch: refetchAlerts,
  } = useAlerts();

  const {
    data: agentData,
    loading: agentLoading,
    refetch: refetchAgents,
  } = useAgentPerformance();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchOverview(), refetchAlerts(), refetchAgents()]);
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const handleSettingsClick = () => {
    // Implementar modal de configurações
    console.log('Configurações clicadas');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'overview':
        return (
          <Grid container spacing={3}>
            {/* Cards de Overview */}
            <Grid item xs={12}>
              <ErrorBoundary>
                <OverviewCards data={overviewData!} loading={overviewLoading} />
              </ErrorBoundary>
            </Grid>

            {/* Seção de SLA de Duração */}
            <Grid item xs={12}>
              <ErrorBoundary>
                <DurationSlaSection
                  data={overviewData!}
                  loading={overviewLoading}
                />
              </ErrorBoundary>
            </Grid>

            {/* Alertas */}
            <Grid item xs={12} md={6}>
              <ErrorBoundary>
                <AlertsPanel
                  alerts={alertsData || []}
                  loading={alertsLoading}
                />
              </ErrorBoundary>
            </Grid>

            {/* Gráficos */}
            <Grid item xs={12} md={6}>
              <ErrorBoundary>
                <Paper
                  sx={{
                    p: 3,
                    height: 400,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Gráficos Rápidos
                  </Typography>
                  <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                    <QuickCharts />
                  </Box>
                </Paper>
              </ErrorBoundary>
            </Grid>
          </Grid>
        );

      case 'metrics':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Métricas Detalhadas
                </Typography>
                <ChartsSection period="month" />
              </Paper>
            </Grid>
          </Grid>
        );

      case 'performance':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ErrorBoundary>
                <PerformanceTable
                  data={agentData || []}
                  loading={agentLoading}
                />
              </ErrorBoundary>
            </Grid>
          </Grid>
        );

      case 'agents':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Gestão de Agentes
                </Typography>
                <ErrorBoundary>
                  <PerformanceTable
                    data={agentData || []}
                    loading={agentLoading}
                  />
                </ErrorBoundary>
              </Paper>
            </Grid>
          </Grid>
        );

      case 'alerts':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ErrorBoundary>
                <AlertsPanel
                  alerts={alertsData || []}
                  loading={alertsLoading}
                />
              </ErrorBoundary>
            </Grid>
          </Grid>
        );

      case 'reports':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Relatórios Avançados
                </Typography>
                <Typography color="text.secondary">
                  Funcionalidade de relatórios em desenvolvimento...
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        );

      case 'timeline':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Timeline de Atividades
                </Typography>
                <Typography color="text.secondary">
                  Timeline em desenvolvimento...
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        );

      default:
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Página não encontrada
            </Typography>
            <Typography color="text.secondary">
              A página "{currentPage}" não existe.
            </Typography>
          </Paper>
        );
    }
  };

  if (overviewError) {
    return (
      <Box>
        <Header onRefresh={handleRefresh} onLogout={handleLogout} />
        <Container maxWidth="xl" sx={{ mt: 2 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="error" gutterBottom>
              Erro ao carregar dashboard
            </Typography>
            <Typography color="text.secondary" paragraph>
              {overviewError}
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <Header
        onRefresh={handleRefresh}
        onSettingsClick={handleSettingsClick}
        onLogout={handleLogout}
        notificationCount={alertsData?.length || 0}
      />

      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            backgroundColor: theme.palette.background.default,
            minHeight: 'calc(100vh - 64px)',
            mt: sidebarOpen ? 0 : 0,
          }}
        >
          <Container maxWidth="xl" sx={{ py: 3 }}>
            {overviewLoading ? (
              <LoadingSpinner message="Carregando dashboard..." />
            ) : (
              renderPageContent()
            )}
          </Container>
        </Box>
      </Box>

      {/* Floating Action Button - Menu Mobile */}
      <Fab
        color="primary"
        aria-label="menu"
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          display: { xs: 'flex', md: 'none' },
        }}
        onClick={() => setSidebarOpen(true)}
      >
        <Menu />
      </Fab>

      {/* Floating Action Button - Refresh */}
      <Fab
        color="secondary"
        aria-label="refresh"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={handleRefresh}
        disabled={refreshing}
      >
        <Refresh />
      </Fab>
    </Box>
  );
};

export default DashboardPage;
