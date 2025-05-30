import mongoose from 'mongoose';
import { MENSAGENS } from '../atendimento/config.js';

// Set para controlar bots ativos
const botsAtivos = new Set();

// Configurações
const TEMPO_INATIVIDADE = 15 * 60 * 1000; // 15 minutos

// Função para verificar se o bot deve ser ativado
async function verificarAtivacaoBot(jid) {
    try {
        const cliente = await mongoose.connection.collection("clientes").findOne({ jid });
        const agora = Date.now();

        const clienteNovo = !cliente;
        const inativo = cliente && agora - new Date(cliente.ultimoAtendimento || 0).getTime() > TEMPO_INATIVIDADE;
        const semResposta = cliente?.respondeu === false || clienteNovo;

        return (clienteNovo || inativo || semResposta) && !botsAtivos.has(jid);
    } catch (error) {
        console.error('Erro ao verificar ativação do bot:', error);
        return false;
    }
}

// Função para ativar o bot
async function ativarBot(jid, sock) {
    try {
        botsAtivos.add(jid);

        await mongoose.connection.collection("clientes").updateOne(
            { jid },
            {
                $set: {
                    jid,
                    ultimoAtendimento: new Date(),
                    status: "bot",
                    respondeu: false
                }
            },
            { upsert: true }
        );

        // Envia mensagem de boas-vindas
        await sock.sendMessage(jid, {
            text: MENSAGENS.BOAS_VINDAS
        });

        console.log(`🤖 Bot ativado para ${jid}`);
        return true;
    } catch (error) {
        console.error('Erro ao ativar bot:', error);
        return false;
    }
}

// Função para desativar o bot
async function desativarBot(jid) {
    try {
        botsAtivos.delete(jid);
        
        await mongoose.connection.collection("clientes").updateOne(
            { jid },
            {
                $set: {
                    status: "humano",
                    ultimoAtendimento: new Date()
                }
            },
            { upsert: true }
        );

        console.log(`🤖 Bot desativado para ${jid}`);
        return true;
    } catch (error) {
        console.error('Erro ao desativar bot:', error);
        return false;
    }
}

// Função para atualizar último contato do cliente
async function atualizarUltimoContato(jid) {
    try {
        await mongoose.connection.collection("clientes").updateOne(
            { jid },
            {
                $set: {
                    ultimoContato: new Date()
                }
            },
            { upsert: true }
        );
    } catch (error) {
        console.error('Erro ao atualizar último contato:', error);
    }
}

// Função para verificar se o bot está ativo
function isBotAtivo(jid) {
    return botsAtivos.has(jid);
}

export {
    verificarAtivacaoBot,
    ativarBot,
    desativarBot,
    atualizarUltimoContato,
    isBotAtivo
}; 