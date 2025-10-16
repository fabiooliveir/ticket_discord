export const appConfig = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: process.env.MYSQL_DATABASE || 'ticket_discord',
  },
  discord: {
    token: process.env.DISCORD_TOKEN,
    guildId: process.env.GUILD_ID,
    clientId: process.env.CLIENT_ID,
    channels: {
      suporte: process.env.SUPORTE_CHANNEL_ID,
      cs: process.env.CS_CHANNEL_ID,
      trafego: process.env.TRAFEGO_CHANNEL_ID,
      financeiro: process.env.FINANCEIRO_CHANNEL_ID,
      c7auto: process.env.DISCORD_C7AUTO_CHANNEL_ID,
      activation: process.env.DISCORD_ACTIVATION_CHANNEL_ID,
    },
    roles: {
      suporte: process.env.SUPORTE_ROLE_ID,
      cs: process.env.CS_ROLE_ID,
      trafego: process.env.TRAFEGO_ROLE_ID,
      financeiro: process.env.FINANCEIRO_ROLE_ID,
    },
  },
  leadfy: {
    webhookUrl:
      process.env.LEADFY_WEBHOOK_URL ||
      'https://workflowinternal.leadfy.pro/webhook/241b97c5-f29c-4215-be94-531a4e490a7d',
    token:
      process.env.LEADFY_TOKEN ||
      '0GZf0zkLIR5RdK9goaFBrHRRZyvm4VplBtIABZ0q5clUg3H2h9XUiVwkVMhQfzbB',
  },
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'your-refresh-secret-key-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
});
