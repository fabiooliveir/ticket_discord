import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardWebController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getDashboardOverview(@Req() req: Request, @Res() res: Response) {
    // Verificar se é requisição do navegador
    const isBrowserRequest = req.headers.accept?.includes('text/html');
    
    if (isBrowserRequest) {
      // Retornar página HTML do dashboard com validação via JavaScript
      const dashboardPage = await this.getDashboardPageWithValidation();
      res.setHeader('Content-Type', 'text/html');
      res.send(dashboardPage);
    } else {
      // Retornar JSON para API
      const data = await this.dashboardService.getDashboardOverview();
      res.json(data);
    }
  }

  private async getDashboardPageWithValidation(): Promise<string> {
    const dashboardData = await this.dashboardService.getDashboardOverview();
    
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Ticket Discord</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f7fa;
            color: #333;
        }
        
        .header {
            background: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: #667eea;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .user-badge {
            background: #667eea;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
        }
        
        .logout-btn {
            background: #dc3545;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            cursor: pointer;
        }
        
        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 2rem;
        }
        
        .welcome {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        
        .welcome h1 {
            color: #333;
            margin-bottom: 0.5rem;
        }
        
        .welcome p {
            color: #666;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stat-card h3 {
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #333;
        }
        
        .api-info {
            background: #e3f2fd;
            padding: 1.5rem;
            border-radius: 10px;
            margin-top: 2rem;
        }
        
        .api-info h3 {
            color: #1976d2;
            margin-bottom: 1rem;
        }
        
        .api-endpoints {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
        }
        
        .endpoint {
            background: white;
            padding: 1rem;
            border-radius: 5px;
            border-left: 4px solid #1976d2;
        }
        
        .endpoint-method {
            font-weight: bold;
            color: #1976d2;
        }
        
        .endpoint-url {
            font-family: monospace;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">📊 Ticket Discord Dashboard</div>
        <div class="user-info">
            <div class="user-badge" id="userBadge">Carregando...</div>
            <button class="logout-btn" onclick="logout()">Sair</button>
        </div>
    </div>
    
    <div class="container">
        <div class="welcome">
            <h1>Bem-vindo ao Dashboard!</h1>
            <p>Olá! Aqui você pode visualizar as métricas e gerenciar o sistema de tickets.</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total de Tickets</h3>
                <div class="stat-value">${dashboardData.summary.totalTickets}</div>
            </div>
            <div class="stat-card">
                <h3>Tickets Abertos</h3>
                <div class="stat-value">${dashboardData.summary.openTickets}</div>
            </div>
            <div class="stat-card">
                <h3>Taxa de Compliance</h3>
                <div class="stat-value">${dashboardData.summary.complianceRate}%</div>
            </div>
            <div class="stat-card">
                <h3>Tickets Hoje</h3>
                <div class="stat-value">${dashboardData.trends.ticketsCreatedToday}</div>
            </div>
        </div>
        
        <div class="api-info">
            <h3>🔌 APIs Disponíveis</h3>
            <p>O dashboard também está disponível via APIs REST. Aqui estão os principais endpoints:</p>
            
            <div class="api-endpoints">
                <div class="endpoint">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-url">/dashboard/overview</div>
                    <div>Visão geral completa</div>
                </div>
                <div class="endpoint">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-url">/dashboard/metrics</div>
                    <div>Métricas detalhadas</div>
                </div>
                <div class="endpoint">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-url">/dashboard/performance</div>
                    <div>Relatórios de performance</div>
                </div>
                <div class="endpoint">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-url">/dashboard/alerts</div>
                    <div>Alertas ativos</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function logout() {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = '/auth/login-page';
        }
        
        // Verificar se o token ainda é válido
        window.addEventListener('load', async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                window.location.href = '/auth/login-page';
                return;
            }
            
            try {
                const response = await fetch('/auth/profile', {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });
                
                if (!response.ok) {
                    window.location.href = '/auth/login-page';
                } else {
                    const user = await response.json();
                    // Atualizar informações do usuário na página
                    document.getElementById('userBadge').textContent = user.username + ' (' + user.role + ')';
                }
            } catch (error) {
                window.location.href = '/auth/login-page';
            }
        });
    </script>
</body>
</html>
    `;
  }
}
