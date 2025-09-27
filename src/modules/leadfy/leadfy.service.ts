import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '../../shared/http/http.service';
import {
  LeadfyClient,
  LeadfyApiResponse,
  LeadfySyncResult,
} from './interfaces/client.interface';

@Injectable()
export class LeadfyService {
  private readonly logger = new Logger(LeadfyService.name);
  private clientsCache: Map<string, LeadfyClient> = new Map();
  private lastSync: Date | null = null;
  private syncInProgress = false;

  constructor(
    @Inject('LEADFY_CONFIG') private readonly config: any,
    private readonly httpService: HttpService,
  ) {}

  async getClients(): Promise<LeadfyClient[]> {
    try {
      this.logger.log('🔍 Buscando lista de clientes da Leadfy...');

      const response = await this.httpService.post<LeadfyApiResponse>(
        this.config.webhookUrl,
        {},
        {
          headers: {
            token: this.config.token,
          },
          timeout: this.config.timeout,
        },
      );

      // A API retorna um array diretamente, não um objeto com success/data
      const clients = Array.isArray(response.data)
        ? response.data
        : response.data.data;

      this.logger.log(
        `📊 Resposta da API: ${Array.isArray(response.data) ? 'array direto' : 'objeto com data'}, ${clients?.length || 0} clientes`,
      );

      if (clients && Array.isArray(clients) && clients.length > 0) {
        this.logger.log(`✅ ${clients.length} clientes carregados com sucesso`);

        // Atualizar cache
        this.updateCache(clients);
        this.lastSync = new Date();

        return clients;
      } else {
        this.logger.warn('⚠️ Resposta da API Leadfy não contém dados válidos');
        this.logger.warn(
          `📊 Detalhes: response.data=${JSON.stringify(response.data)}`,
        );
        return this.getCachedClients();
      }
    } catch (error) {
      this.logger.error('❌ Erro ao buscar clientes da Leadfy:', error.message);

      // Fallback para cache
      const cachedClients = this.getCachedClients();
      if (cachedClients.length > 0) {
        this.logger.log('📦 Usando dados do cache como fallback');
        return cachedClients;
      }

      throw new Error(`Falha ao buscar clientes: ${error.message}`);
    }
  }

  async getClientById(id: string): Promise<LeadfyClient | null> {
    try {
      // Verificar cache primeiro
      const cachedClient = this.clientsCache.get(id);
      if (cachedClient) {
        this.logger.debug(`📦 Cliente ${id} encontrado no cache`);
        return cachedClient;
      }

      // Se não estiver no cache, buscar todos os clientes
      const clients = await this.getClients();
      return clients.find((client) => client.id == id) || null;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar cliente ${id}:`, error.message);
      return null;
    }
  }

  async searchClients(query: string): Promise<LeadfyClient[]> {
    try {
      const clients = await this.getClients();

      const searchTerm = query.toLowerCase();
      const filteredClients = clients.filter(
        (client) =>
          client.name?.toLowerCase().includes(searchTerm) ||
          client.email?.toLowerCase().includes(searchTerm) ||
          client.company?.toLowerCase().includes(searchTerm),
      );

      this.logger.log(
        `🔍 Busca por "${query}" retornou ${filteredClients.length} resultados`,
      );
      return filteredClients;
    } catch (error) {
      this.logger.error(`❌ Erro na busca de clientes:`, error.message);
      return [];
    }
  }

  async syncClients(): Promise<LeadfySyncResult> {
    if (this.syncInProgress) {
      this.logger.warn('⚠️ Sincronização já em andamento');
      return {
        success: false,
        clientsCount: this.clientsCache.size,
        lastSync: this.lastSync || new Date(),
        errors: ['Sincronização já em andamento'],
      };
    }

    this.syncInProgress = true;
    const errors: string[] = [];

    try {
      this.logger.log('🔄 Iniciando sincronização de clientes...');

      const clients = await this.getClients();

      this.logger.log(`✅ Sincronização concluída: ${clients.length} clientes`);

      return {
        success: true,
        clientsCount: clients.length,
        lastSync: new Date(),
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error('❌ Erro durante sincronização:', error.message);
      errors.push(error.message);

      return {
        success: false,
        clientsCount: this.clientsCache.size,
        lastSync: this.lastSync || new Date(),
        errors,
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  async getClientStats(): Promise<{
    totalClients: number;
    lastSync: Date | null;
    cacheSize: number;
    syncInProgress: boolean;
  }> {
    return {
      totalClients: this.clientsCache.size,
      lastSync: this.lastSync,
      cacheSize: this.clientsCache.size,
      syncInProgress: this.syncInProgress,
    };
  }

  async validateClient(clientId: string): Promise<boolean> {
    try {
      const client = await this.getClientById(clientId);
      return client !== null;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao validar cliente ${clientId}:`,
        error.message,
      );
      return false;
    }
  }

  private updateCache(clients: LeadfyClient[]): void {
    this.clientsCache.clear();
    clients.forEach((client) => {
      this.clientsCache.set(String(client.id), client);
    });
    this.logger.debug(`📦 Cache atualizado com ${clients.length} clientes`);
  }

  private getCachedClients(): LeadfyClient[] {
    const cachedClients = Array.from(this.clientsCache.values());
    this.logger.log(`📦 Cache contém ${cachedClients.length} clientes`);
    return cachedClients;
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    lastSync: Date | null;
    clientsCount: number;
    apiReachable: boolean;
  }> {
    try {
      // Testar conectividade com a API
      await this.httpService.post(
        this.config.webhookUrl,
        {},
        {
          headers: {
            token: this.config.token,
          },
          timeout: 5000,
        },
      );

      return {
        status: 'healthy',
        lastSync: this.lastSync,
        clientsCount: this.clientsCache.size,
        apiReachable: true,
      };
    } catch (error) {
      this.logger.warn('⚠️ API Leadfy não acessível:', error.message);

      return {
        status: 'unhealthy',
        lastSync: this.lastSync,
        clientsCount: this.clientsCache.size,
        apiReachable: false,
      };
    }
  }
}
