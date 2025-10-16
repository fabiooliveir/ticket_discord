export const trafegoChecklist = {
  name: 'Tráfego',
  steps: [
    'Criação Conta Meta + Pixel',
    'Config. Setup Facebook Ads',
    'Criação Conta Google',
    'Config. Setup Google Ads',
  ],
} as const;

export type TrafegoChecklist = typeof trafegoChecklist;

