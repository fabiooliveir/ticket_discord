import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  Assessment,
  TrendingUp,
  People,
  Warning,
  Timeline,
  BarChart,
  Settings,
} from '@mui/icons-material';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const drawerWidth = 280;

const menuItems = [
  {
    id: 'overview',
    label: 'Visão Geral',
    icon: <Dashboard />,
    description: 'Dashboard principal com KPIs',
  },
  {
    id: 'metrics',
    label: 'Métricas',
    icon: <Assessment />,
    description: 'Métricas detalhadas de SLA',
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: <TrendingUp />,
    description: 'Performance dos agentes',
  },
  {
    id: 'agents',
    label: 'Agentes',
    icon: <People />,
    description: 'Gestão de agentes',
  },
  {
    id: 'alerts',
    label: 'Alertas',
    icon: <Warning />,
    description: 'Sistema de alertas',
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: <BarChart />,
    description: 'Relatórios avançados',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: <Timeline />,
    description: 'Linha do tempo',
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  currentPage,
  onPageChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handlePageChange = (pageId: string) => {
    onPageChange(pageId);
    if (isMobile) {
      onClose();
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header do Sidebar */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Dashboard />
          Menu
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Navegação do Dashboard
        </Typography>
      </Box>

      {/* Lista de Menu */}
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={currentPage === item.id}
              onClick={() => handlePageChange(item.id)}
              sx={{
                mx: 1,
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}15`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}25`,
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                  '& .MuiListItemText-primary': {
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                  },
                },
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: currentPage === item.id 
                    ? theme.palette.primary.main 
                    : theme.palette.text.secondary,
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={item.description}
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: currentPage === item.id ? 600 : 400,
                }}
                secondaryTypographyProps={{
                  fontSize: '0.75rem',
                  color: theme.palette.text.secondary,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Footer do Sidebar */}
      <Box sx={{ p: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          textAlign="center"
        >
          Ticket Dashboard v1.0.0
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          textAlign="center"
        >
          © 2025 - Sistema de SLA
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Melhor performance no mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          top: 64, // Altura do header
          height: 'calc(100% - 64px)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
