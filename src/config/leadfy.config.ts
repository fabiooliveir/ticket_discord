export const leadfyConfig = () => ({
  webhookUrl:
    process.env.LEADFY_WEBHOOK_URL ||
    'https://workflowinternal.leadfy.pro/webhook/241b97c5-f29c-4215-be94-531a4e490a7d',
  token:
    process.env.LEADFY_TOKEN ||
    '0GZf0zkLIR5RdK9goaFBrHRRZyvm4VplBtIABZ0q5clUg3H2h9XUiVwkVMhQfzbB',
  timeout: parseInt(process.env.LEADFY_TIMEOUT || '10000', 10),
  retryAttempts: parseInt(process.env.LEADFY_RETRY_ATTEMPTS || '3', 10),
  cacheTtl: parseInt(process.env.LEADFY_CACHE_TTL || '300000', 10), // 5 minutos
});
