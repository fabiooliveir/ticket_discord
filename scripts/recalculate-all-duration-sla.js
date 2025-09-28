const { DataSource, Not, IsNull } = require('typeorm');
const { Ticket } = require('../dist/database/entities/ticket.entity');
const { SlaCalculator } = require('../dist/shared/utils/sla-calculator.util');
const { TicketPriority, SlaCategories } = require('../dist/shared/enums/sla-categories.enum');
const { SlaStatus } = require('../dist/shared/enums/sla-targets.enum');

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

async function recalculateAllDurationSla() {
  console.log('🔄 Iniciando recálculo completo de SLA de duração...\n');

  try {
    // Conectar ao banco
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    const ticketRepository = dataSource.getRepository(Ticket);

    // 1. Buscar todos os tickets fechados
    console.log('📊 1. Buscando tickets fechados...');
    const closedTickets = await ticketRepository.find({
      where: {
        status: 'closed',
        closedAt: Not(IsNull()),
      },
      order: { closedAt: 'ASC' },
    });

    console.log(`   Encontrados ${closedTickets.length} tickets fechados`);

    // 2. Buscar tickets que precisam de recálculo
    console.log('\n🔍 2. Identificando tickets que precisam de recálculo...');
    const ticketsToRecalculate = closedTickets.filter(ticket => 
      !ticket.durationTimeMinutes || !ticket.durationSlaStatus
    );

    console.log(`   ${ticketsToRecalculate.length} tickets precisam de recálculo`);

    // 3. Processar tickets em lotes
    const batchSize = 100;
    let processed = 0;
    let updated = 0;
    let errors = 0;
    const errorDetails = [];

    console.log(`\n⚙️ 3. Processando em lotes de ${batchSize} tickets...`);

    for (let i = 0; i < ticketsToRecalculate.length; i += batchSize) {
      const batch = ticketsToRecalculate.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(ticketsToRecalculate.length / batchSize);

      console.log(`\n📦 Processando lote ${batchNumber}/${totalBatches} (${batch.length} tickets)...`);

      for (const ticket of batch) {
        try {
          // Calcular duração total
          const durationTimeMinutes = SlaCalculator.calculateDurationTime(
            ticket.createdAt,
            ticket.closedAt,
            ticket.slaCategory || SlaCategories.BUSINESS_HOURS,
          );

          // Calcular status do SLA de duração
          const durationSlaStatus = SlaCalculator.getDurationSlaStatus(
            durationTimeMinutes,
            ticket.priority || TicketPriority.MEDIUM,
          );

          // Atualizar ticket
          await ticketRepository.update(ticket.id, {
            durationTimeMinutes,
            durationSlaStatus: durationSlaStatus,
            metadata: {
              ...ticket.metadata,
              durationSlaRecalculated: new Date().toISOString(),
              durationSlaMethod: 'bulk_recalculation',
              durationSlaBatch: batchNumber,
            },
          });

          updated++;
          
          if (processed % 50 === 0) {
            console.log(`   ✅ Processados: ${processed + 1}/${ticketsToRecalculate.length}`);
          }

        } catch (error) {
          errors++;
          const errorMsg = `Erro no ticket ${ticket.id}: ${error.message}`;
          errorDetails.push(errorMsg);
          console.error(`   ❌ ${errorMsg}`);
        }

        processed++;
      }

      console.log(`   📊 Lote ${batchNumber} concluído - Processados: ${batch.length}, Atualizados: ${batch.length - errors}, Erros: ${errors}`);
    }

    // 4. Estatísticas finais
    console.log('\n📈 4. Estatísticas finais:');
    console.log(`   - Total de tickets fechados: ${closedTickets.length}`);
    console.log(`   - Tickets processados: ${processed}`);
    console.log(`   - Tickets atualizados: ${updated}`);
    console.log(`   - Erros: ${errors}`);

    // 5. Verificar tickets por status de SLA
    console.log('\n🎯 5. Distribuição por status de SLA:');
    const statusCounts = {
      compliant: 0,
      atRisk: 0,
      breached: 0,
      notApplicable: 0,
    };

    const updatedTickets = await ticketRepository.find({
      where: {
        status: 'closed',
        durationSlaStatus: Not(IsNull()),
      },
    });

    updatedTickets.forEach(ticket => {
      switch (ticket.durationSlaStatus) {
        case SlaStatus.COMPLIANT:
          statusCounts.compliant++;
          break;
        case SlaStatus.AT_RISK:
          statusCounts.atRisk++;
          break;
        case SlaStatus.BREACHED:
          statusCounts.breached++;
          break;
        case SlaStatus.NOT_APPLICABLE:
          statusCounts.notApplicable++;
          break;
      }
    });

    console.log(`   - Compliant: ${statusCounts.compliant}`);
    console.log(`   - At Risk: ${statusCounts.atRisk}`);
    console.log(`   - Breached: ${statusCounts.breached}`);
    console.log(`   - Not Applicable: ${statusCounts.notApplicable}`);

    // 6. Calcular compliance rate geral
    const totalWithStatus = statusCounts.compliant + statusCounts.atRisk + statusCounts.breached;
    const complianceRate = totalWithStatus > 0 
      ? Math.round((statusCounts.compliant / totalWithStatus) * 100)
      : 0;

    console.log(`   - Compliance Rate: ${complianceRate}%`);

    // 7. Relatório de erros
    if (errorDetails.length > 0) {
      console.log('\n❌ 7. Detalhes dos erros:');
      errorDetails.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      
      if (errorDetails.length > 10) {
        console.log(`   ... e mais ${errorDetails.length - 10} erros`);
      }
    }

    console.log('\n🎉 Recálculo de SLA de duração concluído!');
    
    if (errors === 0) {
      console.log('✅ Todos os tickets foram processados com sucesso!');
    } else {
      console.log(`⚠️ ${errors} tickets tiveram problemas durante o processamento`);
    }

  } catch (error) {
    console.error('❌ Erro durante recálculo:', error.message);
    console.error(error.stack);
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
  recalculateAllDurationSla()
    .then(() => {
      console.log('\n🎯 Recálculo completo de SLA de duração finalizado!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha no recálculo:', error);
      process.exit(1);
    });
}

module.exports = { recalculateAllDurationSla };

