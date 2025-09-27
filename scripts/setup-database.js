const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  let connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
  });

  try {
    console.log('🔌 Conectando ao MySQL...');
    
    // Criar o banco de dados se não existir
    const databaseName = process.env.MYSQL_DATABASE || 'ticket_discord';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
    console.log(`✅ Banco de dados '${databaseName}' criado/verificado com sucesso`);
    
    // Conectar diretamente ao banco de dados
    await connection.end();
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'root',
      database: databaseName,
    });
    console.log(`✅ Conectado ao banco '${databaseName}'`);
    
    // Verificar se a tabela tickets existe
    const [tables] = await connection.execute('SHOW TABLES LIKE "tickets"');
    if (tables.length === 0) {
      console.log('ℹ️  Tabela tickets será criada automaticamente pela aplicação');
    } else {
      console.log('✅ Tabela tickets já existe');
    }
    
    console.log('🎉 Setup do banco de dados concluído!');
    
  } catch (error) {
    console.error('❌ Erro ao configurar o banco de dados:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

setupDatabase();
