import Atendimento from '../models/Atendimento.js';
import { enviarResumoAtendimento } from '../utils/atendimentoUtils.js';
import mongoose from 'mongoose';
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

async function enviarResumosHoje() {
    try {
        console.log('🚀 Iniciando envio de resumos dos atendimentos de hoje...');

        // Conecta ao MongoDB
        console.log('📡 Conectando ao MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conectado ao MongoDB com sucesso!');

        // Pega a data de início do dia atual
        const inicioDia = new Date();
        inicioDia.setHours(0, 0, 0, 0);

        // Pega a data de fim do dia atual
        const fimDia = new Date();
        fimDia.setHours(23, 59, 59, 999);

        // Busca todos os atendimentos finalizados hoje
        const atendimentos = await Atendimento.find({
            $or: [
                { etapa: 'finalizado' },
                { status: 'finalizado' }
            ],
            timestamp: {
                $gte: inicioDia,
                $lte: fimDia
            }
        }).sort({ timestamp: 1 });

        console.log(`🔍 Encontrados ${atendimentos.length} atendimentos finalizados hoje`);

        // Envia os resumos com intervalo de 1 minuto
        for (const atendimento of atendimentos) {
            try {
                await enviarResumoAtendimento(atendimento);
                console.log(`✅ Resumo enviado para o atendimento ${atendimento._id}`);

                // Aguarda 1 minuto antes de enviar o próximo
                if (atendimentos.indexOf(atendimento) < atendimentos.length - 1) {
                    console.log('⏳ Aguardando 1 minuto antes do próximo envio...');
                    await new Promise(resolve => setTimeout(resolve, 60000));
                }
            } catch (error) {
                console.error(`❌ Erro ao enviar resumo do atendimento ${atendimento._id}:`, error);
                continue; // Continua para o próximo atendimento mesmo se houver erro
            }
        }

        console.log('✅ Todos os resumos foram enviados com sucesso!');
        
        // Fecha a conexão com o MongoDB
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao enviar resumos:', error);
        // Tenta fechar a conexão com o MongoDB em caso de erro
        try {
            await mongoose.connection.close();
        } catch (err) {
            console.error('❌ Erro ao fechar conexão com MongoDB:', err);
        }
        process.exit(1);
    }
}

enviarResumosHoje(); 