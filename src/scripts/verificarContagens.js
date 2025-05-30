import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { gerarRelatorio } from '../utils/relatoriosAutomaticos.js';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

async function verificarContagens() {
    try {
        // Conecta ao MongoDB Atlas
        console.log('📡 Conectando ao MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://valentina:9Gm8hzZdwIauxkRP@valentina.gdcrr.mongodb.net/valentina_db');
        console.log('✅ Conectado ao MongoDB Atlas com sucesso!');

        // Gera o relatório atual
        const relatorio = await gerarRelatorio();
        console.log('\n📊 Relatório atual:');
        console.log(relatorio);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

verificarContagens(); 