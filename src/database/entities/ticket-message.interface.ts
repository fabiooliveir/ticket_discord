export interface TicketMessage {
  id: string;              // ID da mensagem no Discord
  author: {
    id: string;            // ID do usuário Discord
    username: string;      // Nome do usuário
    tag: string;           // Tag completa (username#discriminator)
  };
  content: string;         // Conteúdo da mensagem
  timestamp: string;       // ISO string da data/hora
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
    size: number;
  }>;
  type: 'user' | 'system'; // Tipo da mensagem
}
