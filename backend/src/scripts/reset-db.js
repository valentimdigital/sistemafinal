import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar caminho do .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

const MONGO_URI = "mongodb+srv://valentina:V8gdnmaxKc8K0F2R@valentina.gdcrr.mongodb.net/?retryWrites=true&w=majority&appName=valentina";

async function resetDatabase() {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Conectado ao MongoDB!');

        // Lista de coleções para limpar
        const collections = ['contatos', 'mensagens'];

        // Limpar cada coleção
        for (const collection of collections) {
            console.log(`Limpando coleção: ${collection}`);
            await mongoose.connection.collection(collection).deleteMany({});
            console.log(`Coleção ${collection} limpa com sucesso!`);
        }

        console.log('Banco de dados resetado com sucesso!');
    } catch (error) {
        console.error('Erro ao resetar banco de dados:', error);
    } finally {
        // Fechar conexão
        await mongoose.connection.close();
        console.log('Conexão com MongoDB fechada.');
        process.exit(0);
    }
}

// Executar o reset
resetDatabase(); 