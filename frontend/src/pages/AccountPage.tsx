import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Person as PersonIcon, Security as SecurityIcon } from '@mui/icons-material';
import ProfileForm from '../components/account/ProfileForm';
import ChangePasswordForm from '../components/account/ChangePasswordForm';
import apiService from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `account-tab-${index}`,
    'aria-controls': `account-tabpanel-${index}`,
  };
}

interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role: string;
}

const AccountPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handlePasswordChange = () => {
    // Pode adicionar lógica adicional se necessário
    console.log('Senha alterada com sucesso');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          {error || 'Erro ao carregar dados do usuário'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Configurações da Conta
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Gerencie suas informações pessoais e configurações de segurança
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="abas de configurações">
            <Tab
              icon={<PersonIcon />}
              label="Perfil"
              {...a11yProps(0)}
              sx={{ textTransform: 'none' }}
            />
            <Tab
              icon={<SecurityIcon />}
              label="Segurança"
              {...a11yProps(1)}
              sx={{ textTransform: 'none' }}
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <ProfileForm user={user} onUserUpdate={handleUserUpdate} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <ChangePasswordForm onPasswordChange={handlePasswordChange} />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default AccountPage;











