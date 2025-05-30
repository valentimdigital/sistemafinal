import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Carregar variáveis de ambiente do .env no diretório raiz do projeto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Ajuste o caminho se seu .env estiver em outro lugar

const DB_URI = process.env.MONGODB_URI; // Substitua MONGODB_URI pela sua variável de ambiente do Atlas

if (!DB_URI) {
  console.error('MONGODB_URI não definida no arquivo .env');
  process.exit(1);
}

async function resetDatabase() {
  try {
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado ao MongoDB Atlas.');

    const db = mongoose.connection.db;

    console.log('Dropando coleção de contatos...');
    await db.collection('contatos').drop().catch(err => {
        if (err.code === 26) { // Código 26 significa que a coleção não existe
            console.log('Coleção de contatos não encontrada, ignorando drop.');
        } else {
            throw err; // Outro erro, lançar novamente
        }
    });

    console.log('Dropando coleção de mensagens...');
     await db.collection('mensagens').drop().catch(err => {
        if (err.code === 26) { // Código 26 significa que a coleção não existe
            console.log('Coleção de mensagens não encontrada, ignorando drop.');
        } else {
            throw err; // Outro erro, lançar novamente
        }
    });

    console.log('Banco de dados resetado com sucesso!');

  } catch (error) {
    console.error('Erro ao resetar o banco de dados:', error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
    console.log('Conexão com MongoDB fechada.');
  }
}

resetDatabase(); 