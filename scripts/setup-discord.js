const { REST, Routes } = require('discord.js');
require('dotenv').config();

async function setupDiscordCommands() {
  const commands = [
    {
      name: 'criar-ticket',
      description: 'Cria um novo ticket para qualquer equipe',
      options: [
        {
          name: 'cliente',
          description: 'Selecione o cliente para o ticket',
          type: 3, // STRING
          required: true,
          autocomplete: true,
        },
      ],
    },
    {
      name: 'criar-ticket-c7auto',
      description: 'Cria um novo ticket para C7 Auto',
    },
    {
      name: 'ajuda',
      description: 'Como usar os tickets e os botões',
      options: [
        {
          name: 'topico',
          description: 'Escolha um tópico de ajuda',
          type: 3, // STRING
          required: false,
          choices: [
            { name: 'Geral', value: 'geral' },
            { name: 'Criar', value: 'criar' },
            { name: 'Botões', value: 'botoes' },
          ],
        },
      ],
    },
    {
      name: 'check-list',
      description: 'Exibe uma checklist por categoria',
      options: [
        {
          name: 'categoria',
          description: 'Categoria da checklist',
          type: 3, // STRING
          required: true,
          choices: [
            { name: 'Tech', value: 'tech' },
            { name: 'Tráfego', value: 'trafego' },
            { name: 'Suporte', value: 'suporte' },
          ],
        },
      ],
    },
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('🔧 Registrando comandos slash do Discord...');

    if (process.env.GUILD_ID) {
      // Registrar comandos para um servidor específico
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`✅ Comandos registrados para o servidor ${process.env.GUILD_ID}`);
    } else {
      // Registrar comandos globalmente
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log('✅ Comandos registrados globalmente');
    }

    console.log('🎉 Setup do Discord concluído!');
  } catch (error) {
    console.error('❌ Erro ao configurar comandos do Discord:', error);
    process.exit(1);
  }
}

setupDiscordCommands();