## 2.2 Documento de Monitoramento

Este documento descreve como monitorar, operar e reiniciar o sistema de tickets em produção.

### Sumário dos Serviços

| Serviço | Porta | Status | Como Restartar | Dependências | Observações |
|---------|-------|--------|----------------|--------------|-------------|
| **MariaDB** | 3306 | systemctl | `sudo systemctl restart mariadb` | - | Banco de dados (primeiro a subir) |
| **Backend (PM2)** | 3000 | pm2 | `pm2 restart ticket_discord` | MariaDB | API Node.js/NestJS |
| **Frontend** | 80 | Nginx | Deploy + `sudo systemctl reload nginx` | Nginx | React estático (servido via Nginx) |
| **Nginx** | 80 | systemctl | `sudo systemctl restart nginx` | - | Servidor web + Proxy reverso |

**Ordem de Restart (se necessário):**
1. MariaDB → 2. Backend (PM2) → 3. Frontend (deploy) → 4. Nginx

**Comandos de Verificação Rápida:**
```bash
# Status geral
systemctl status mariadb nginx
pm2 status
ss -tlnp | grep -E ':(80|3000|3306)'
```

### Visão Geral

- **Diretório do projeto**: `/opt/ticket_discord`
- **Componentes**:
  - **Backend (Node/NestJS)**: porta 3000, processo Node.js executando `dist/main.js`
  - **Frontend (React estático via Nginx)**: porta 80 servindo `frontend/build`
  - **Nginx** como servidor web e proxy reverso para `/api` → `localhost:3000`

### Acesso à VM

- **SSH**:
  ```bash
  ssh -i ~/.ssh/id_rsa fboliveiran@34.39.185.159
  ```
- **Usuário**: `fboliveiran`
- **SO**: Debian GNU/Linux (GCE)

### Estrutura de Pastas

```text
/opt/ticket_discord
├─ frontend/
│  ├─ build/              (artefatos estáticos do React servidos pelo Nginx)
│  ├─ package.json
│  └─ ...
├─ dist/                  (build do backend NestJS)
├─ src/                   (código-fonte backend)
├─ package.json           (backend)
└─ ...
```

### Nginx (Frontend + Proxy)

- **Config do site**: `/etc/nginx/sites-available/ticket-dashboard` (link em `sites-enabled/`)
- **Root**: `/opt/ticket_discord/frontend/build`
- **Proxy**: `/api/` → `http://localhost:3000/`
- **Comandos úteis**:
  ```bash
  # Status
  sudo systemctl status nginx

  # Testar config
  sudo nginx -t

  # Reload (sem derrubar)
  sudo systemctl reload nginx

  # Restart
  sudo systemctl restart nginx

  # Logs
  sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
  ```

### MariaDB (Banco de Dados)

- **Porta**: `3306`
- **Serviço**: `mariadb.service`
- **Comandos úteis**:
  ```bash
  # Status
  sudo systemctl status mariadb

  # Restart
  sudo systemctl restart mariadb

  # Conectar ao banco
  mysql -u ticket_user -p ticket_discord

  # Verificar processos ativos
  sudo netstat -tlnp | grep :3306
  ```

### Backend (API)

- **Porta**: `3000`
- **Processo típico**: `node /opt/ticket_discord/dist/main.js`
- **Verificações**:
  ```bash
  ss -tlnp | grep :3000
  ps aux | grep 'node .*dist/main.js' | grep -v grep

  # Health-check (se disponível)
  curl -I http://localhost:3000
  # ou
  curl -s http://localhost:3000/api/health
  ```
- **Reinício manual (atual)**:
  ```bash
  # Encerrar
  pkill -f 'node .*dist/main.js'

  # Subir (foreground)
  cd /opt/ticket_discord && node dist/main.js

  # Subir (background temporário)
  cd /opt/ticket_discord && nohup node dist/main.js > backend.out 2>&1 &
  ```
- Observação: recomanda-se configurar gerenciador de processos (systemd/pm2) para restart automático.

### Frontend (estático)

- **Servido por**: Nginx na porta 80 a partir de `/opt/ticket_discord/frontend/build`
- **Verificar**:
  ```bash
  curl -I http://localhost
  ```
- **Atualizar build (deploy)** — recomendado compilar localmente e enviar somente a `build/`:
  ```bash
  # Na máquina local
  npm run build --prefix /home/SEU_USUARIO/Projetos/ticket_discord/frontend
  rsync -az --delete /home/SEU_USUARIO/Projetos/ticket_discord/frontend/build/ \
    -e "ssh -i ~/.ssh/id_rsa" fboliveiran@34.39.185.159:/opt/ticket_discord/frontend/build/

  # Na VM (opcional) validar
  ls -la /opt/ticket_discord/frontend/build
  ```
- Reinício do frontend: não é necessário; Nginx serve os novos arquivos imediatamente após a cópia.

### Monitoramento Operacional

- **Portas e processos**:
  ```bash
  # Quem escuta 80, 3000 e 3306
  sudo netstat -tlnp | grep -E ':(80|3000|3306)' || ss -tlnp | grep -E ':(80|3000|3306)'

  # Processos relevantes
  ps aux | grep -E '(nginx|node|mysql)' | grep -v grep
  ```

- **Recursos**:
  ```bash
  # Memória e swap
  free -h

  # CPU/Processos
  top    # ou htop se instalado

  # Disco
  df -h /
  ```

- **Logs**:
  - Frontend: Nginx (`/var/log/nginx/*`)
  - Backend: depende de como foi iniciado
    - `backend.out` (se iniciado via nohup conforme exemplo)
    - `journalctl -u <serviço>` (se systemd)
    - `pm2 logs` (se pm2)

### Firewall e Rede

- **Local (VM)**:
  - UFW: normalmente inativo
  - iptables: entradas aceitando 80/3000/8080
  ```bash
  sudo ufw status
  sudo iptables -S INPUT | head -n 50
  ```

- **GCP (VPC Firewall)**:
  - O acesso externo depende das regras de firewall do projeto.
  - Verifique se há regra para TCP 80 atingindo a instância (por tag, ex.: `http-server`, ou target "all instances in the network").
  - Checar tags da instância via metadata:
    ```bash
    curl -s -H 'Metadata-Flavor: Google' \
      http://metadata.google.internal/computeMetadata/v1/instance/tags
    ```

### Procedimentos de Rotina

- **Verificar tudo no ar**:
  ```bash
  systemctl status nginx mariadb | cat
  curl -I http://localhost                 # Frontend
  ss -tlnp | grep :3000                    # Backend ouvindo
  ss -tlnp | grep :3306                    # MariaDB ouvindo
  ```

- **Reiniciar MariaDB**:
  ```bash
  sudo systemctl restart mariadb
  ```

- **Atualizar Frontend (Deploy)**:
  ```bash
  # Na máquina local
  npm run build --prefix frontend
  rsync -az --delete frontend/build/ \
    -e "ssh -i ~/.ssh/id_rsa" fboliveiran@34.39.185.159:/opt/ticket_discord/frontend/build/
  
  # Reload Nginx (se necessário)
  ssh -i ~/.ssh/id_rsa fboliveiran@34.39.185.159 "sudo systemctl reload nginx"
  ```

- **Reiniciar Nginx**:
  ```bash
  sudo systemctl reload nginx
  ```

- **Reiniciar Backend (PM2)**:
  ```bash
  pm2 restart ticket_discord
  ```

### Troubleshooting

- **Timeout externo na 80**:
  - Verificar Nginx (status e listen 0.0.0.0:80)
  - Validar acesso local (HTTP 200 em `http://localhost`)
  - Confirmar regra de firewall do GCP (porta 80 liberada) e se a VM tem o network tag exigido

- **Memória baixa durante build**:
  - Compilar frontend localmente e enviar somente a pasta `build/` para a VM

- **Logs do Nginx**:
  - Inspecionar `error.log` para 4xx/5xx e problemas de proxy em `/api`


