export const teamsConfig = () => ({
  channels: {
    suporte: process.env.SUPORTE_CHANNEL_ID || '1405162714581438524',
    cs: process.env.CS_CHANNEL_ID || '1405162746122866798',
    trafego: process.env.TRAFEGO_CHANNEL_ID || '1405162779299549234',
  },
  roles: {
    suporte: process.env.SUPORTE_ROLE_ID || '1405155398247252008',
    cs: process.env.CS_ROLE_ID || '1405155496704475187',
    trafego: process.env.TRAFEGO_ROLE_ID || '1405155577134579742',
  },
});
