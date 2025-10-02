## 2.2 Documento de Monitoramento

Este documento descreve como monitorar, operar e reiniciar o sistema de tickets em produção.

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
  # Quem escuta 80 e 3000
  sudo netstat -tlnp | grep -E ':(80|3000)' || ss -tlnp | grep -E ':(80|3000)'

  # Processos relevantes
  ps aux | grep -E '(nginx|node)' | grep -v grep
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
  systemctl status nginx | cat
  curl -I http://localhost                 # Frontend
  ss -tlnp | grep :3000                    # Backend ouvindo
  ```

- **Reiniciar Nginx**:
  ```bash
  sudo systemctl reload nginx
  ```

- **Reiniciar Backend (manual atual)**:
  ```bash
  pkill -f 'node .*dist/main.js'
  cd /opt/ticket_discord && nohup node dist/main.js > backend.out 2>&1 &
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


