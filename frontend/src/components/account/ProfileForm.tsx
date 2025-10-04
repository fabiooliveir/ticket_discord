import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import apiService from '../../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role: string;
}

interface ProfileFormProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ user, onUserUpdate }) => {
  const [formData, setFormData] = useState({
    email: user.email || '',
    phone: user.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setFormData({
      email: user.email || '',
      phone: user.phone || '',
    });
  }, [user]);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updatedUser = await apiService.updateMyProfile(formData);
      onUserUpdate(updatedUser);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = formData.email !== user.email || formData.phone !== user.phone;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Informações do Perfil
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Perfil atualizado com sucesso!
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Nome de usuário"
            value={user.username}
            disabled
            sx={{ mb: 2 }}
            helperText="Nome de usuário não pode ser alterado"
          />

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            sx={{ mb: 2 }}
            helperText="Digite um email válido"
          />

          <TextField
            fullWidth
            label="Telefone"
            value={formData.phone}
            onChange={handleInputChange('phone')}
            placeholder="+5511999999999"
            sx={{ mb: 3 }}
            helperText="Formato: +5511999999999"
          />

          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={loading || !hasChanges}
            fullWidth
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;




