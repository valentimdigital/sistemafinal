import mongoose from 'mongoose';
import Atendimento from '../models/Atendimento.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Configura o caminho para o arquivo .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../../.env');

// Carrega as variáveis de ambiente
dotenv.config({ path: envPath });

// URL de conexão do MongoDB
const MONGODB_URI = 'mongodb://127.0.0.1:27017/valentimbot';

async function finalizarAtendimentosAtivos() {
    try {
        console.log('🚀 Iniciando finalização de todos os atendimentos ativos...');

        // Conecta ao MongoDB
        console.log('📡 Conectando ao MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conectado ao MongoDB com sucesso!');

        // Busca todos os atendimentos ativos
        const atendimentos = await Atendimento.find({
            $or: [
                { status: 'ativo' },
                { etapa: { $ne: 'finalizado' } }
            ]
        });

        console.log(`🔍 Encontrados ${atendimentos.length} atendimentos ativos`);

        // Atualiza todos os atendimentos para finalizado
        const resultado = await Atendimento.updateMany(
            {
                $or: [
                    { status: 'ativo' },
                    { etapa: { $ne: 'finalizado' } }
                ]
            },
            {
                $set: {
                    status: 'finalizado',
                    etapa: 'finalizado',
                    dataFinalizacao: new Date()
                }
            }
        );

        console.log('✅ Atendimentos finalizados:', {
            encontrados: atendimentos.length,
            atualizados: resultado.modifiedCount
        });

        // Fecha a conexão com o MongoDB
        await mongoose.connection.close();
        console.log('✅ Conexão com MongoDB fechada');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao finalizar atendimentos:', error);
        try {
            await mongoose.connection.close();
        } catch (err) {
            console.error('❌ Erro ao fechar conexão com MongoDB:', err);
        }
        process.exit(1);
    }
}

finalizarAtendimentosAtivos(); 