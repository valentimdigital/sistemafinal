import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { initializeWhatsApp } from './whatsapp.js';
import { enviarResumoAtendimento } from './utils/atendimentoUtils.js';
import Atendimento from './models/Atendimento.js';

// Configuração do Express
const app = express();
app.use(cors());
app.use(express.json());

// Configuração do servidor HTTP
const server = createServer(app);

// Configuração do Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Conexão com o MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/valentimbot', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Conectado ao MongoDB com sucesso!');
}).catch((error) => {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
});

// Função para enviar resumos dos atendimentos finalizados hoje
async function enviarResumosHoje() {
    try {
        console.log('🚀 Iniciando envio de resumos dos atendimentos de hoje...');

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
    } catch (error) {
        console.error('❌ Erro ao enviar resumos:', error);
    }
}

// Rota para enviar resumos dos atendimentos finalizados hoje
app.post('/api/enviar-resumos-hoje', async (req, res) => {
    try {
        enviarResumosHoje();
        res.json({ message: 'Processo de envio de resumos iniciado com sucesso!' });
    } catch (error) {
        console.error('❌ Erro ao iniciar envio de resumos:', error);
        res.status(500).json({ error: 'Erro ao iniciar envio de resumos' });
    }
});

// Rota para finalizar todos os atendimentos ativos
app.post('/api/finalizar-atendimentos-ativos', async (req, res) => {
    try {
        console.log('🚀 Iniciando finalização de todos os atendimentos ativos...');

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

        res.json({
            message: 'Atendimentos finalizados com sucesso',
            encontrados: atendimentos.length,
            atualizados: resultado.modifiedCount
        });
    } catch (error) {
        console.error('❌ Erro ao finalizar atendimentos:', error);
        res.status(500).json({ error: 'Erro ao finalizar atendimentos' });
    }
});

// Inicializa o WhatsApp
initializeWhatsApp(io);

// Inicia o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
}); 