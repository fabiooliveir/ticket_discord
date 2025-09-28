const { DataSource } = require('typeorm');
const { Ticket } = require('../dist/database/entities/ticket.entity');
const { SlaCalculator } = require('../dist/shared/utils/sla-calculator.util');
const { TicketPriority } = require('../dist/shared/enums/sla-categories.enum');

// Configuração do banco de dados
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  username: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'ticket_discord',
  entities: [Ticket],
  synchronize: false,
  logging: false,
});

async function recalculateDurationSla() {
  console.log('🔄 Iniciando recálculo de SLA de duração para tickets existentes...\n');

  try {
    // Conectar ao banco
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    const ticketRepository = dataSource.getRepository(Ticket);

    // Buscar tickets fechados que ainda não têm duração calculada
    const closedTickets = await ticketRepository.find({
      where: {
        status: 'closed',
        closedAt: Not(null),
        durationTimeMinutes: IsNull(),
      },
    });

    console.log(`📊 Encontrados ${closedTickets.length} tickets para recálculo`);

    let processed = 0;
    let updated = 0;
    const errors = [];

    for (const ticket of closedTickets) {
      try {
        // Calcular duração total
        const durationTimeMinutes = SlaCalculator.calculateDurationTime(
          ticket.createdAt,
          ticket.closedAt,
          ticket.slaCategory
        );

        // Calcular status do SLA de duração
        const durationSlaStatus = SlaCalculator.getDurationSlaStatus(
          durationTimeMinutes,
          ticket.priority || TicketPriority.MEDIUM
        );

        // Atualizar ticket
        await ticketRepository.update(ticket.id, {
          durationTimeMinutes,
          durationSlaStatus: durationSlaStatus,
          metadata: {
            ...ticket.metadata,
            durationSlaRecalculated: new Date().toISOString(),
            durationSlaMethod: 'historical_recalculation',
          },
        });

        updated++;
        console.log(`✅ Ticket ${ticket.id}: ${durationTimeMinutes}min - ${durationSlaStatus}`);

      } catch (error) {
        const errorMsg = `Erro no ticket ${ticket.id}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }

      processed++;
    }

    console.log('\n📈 Resumo do recálculo:');
    console.log(`   - Processados: ${processed}`);
    console.log(`   - Atualizados: ${updated}`);
    console.log(`   - Erros: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Erros encontrados:');
      errors.forEach(error => console.log(`   - ${error}`));
    }

  } catch (error) {
    console.error('❌ Erro durante recálculo:', error.message);
    process.exit(1);
  } finally {
    // Fechar conexão
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n✅ Conexão com banco fechada');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  recalculateDurationSla()
    .then(() => {
      console.log('\n🎉 Recálculo de SLA de duração concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha no recálculo:', error);
      process.exit(1);
    });
}

module.exports = { recalculateDurationSla };

