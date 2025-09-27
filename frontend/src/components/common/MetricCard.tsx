import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';
import { MetricCardProps } from '../../types/dashboard';

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  color = 'primary',
  icon,
}) => {
  const theme = useTheme();

  const getColorValue = () => {
    switch (color) {
      case 'success':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      case 'secondary':
        return theme.palette.secondary.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const formatValue = (val: number | string): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString('pt-BR');
    }
    return val.toString();
  };

  const getTrendIcon = () => {
    if (!trend) return <TrendingFlat fontSize="small" />;

    if (trend.value > 0) {
      return <TrendingUp fontSize="small" />;
    } else if (trend.value < 0) {
      return <TrendingDown fontSize="small" />;
    }
    return <TrendingFlat fontSize="small" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'default';

    if (trend.value > 0) {
      return trend.isPositive ? 'success' : 'error';
    } else if (trend.value < 0) {
      return trend.isPositive ? 'error' : 'success';
    }
    return 'default';
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            component="h3"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {title}
          </Typography>
          {icon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: `${getColorValue()}15`,
                color: getColorValue(),
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        <Typography
          variant="h3"
          component="div"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            mb: 1,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          }}
        >
          {formatValue(value)}
        </Typography>

        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              mb: trend ? 1 : 0,
            }}
          >
            {subtitle}
          </Typography>
        )}

        {trend && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Chip
              icon={getTrendIcon()}
              label={`${Math.abs(trend.value)}%`}
              color={getTrendColor() as any}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.75rem',
                height: 24,
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
