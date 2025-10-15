import React, { useState } from 'react';
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
import { Lock as LockIcon } from '@mui/icons-material';
import apiService from '../../services/api';

interface ChangePasswordFormProps {
  onPasswordChange?: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onPasswordChange }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(null);
    setSuccess(false);
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      setError('Senha atual é obrigatória');
      return false;
    }

    if (!formData.newPassword) {
      setError('Nova senha é obrigatória');
      return false;
    }

    if (formData.newPassword.length < 8) {
      setError('Nova senha deve ter pelo menos 8 caracteres');
      return false;
    }

    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.newPassword)) {
      setError('Nova senha deve conter pelo menos uma letra e um número');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Confirmação de senha não confere');
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('Nova senha deve ser diferente da senha atual');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await apiService.changeMyPassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      onPasswordChange?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.currentPassword && formData.newPassword && formData.confirmPassword;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Alterar Senha
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Senha alterada com sucesso!
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Senha Atual"
            type="password"
            value={formData.currentPassword}
            onChange={handleInputChange('currentPassword')}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            fullWidth
            label="Nova Senha"
            type="password"
            value={formData.newPassword}
            onChange={handleInputChange('newPassword')}
            sx={{ mb: 2 }}
            helperText="Mínimo 8 caracteres com letras e números"
            required
          />

          <TextField
            fullWidth
            label="Confirmar Nova Senha"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            sx={{ mb: 3 }}
            required
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} /> : <LockIcon />}
            disabled={loading || !isFormValid}
            fullWidth
          >
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChangePasswordForm;















