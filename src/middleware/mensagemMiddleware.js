import NumeroBloqueado from '../models/NumeroBloqueado.js';
import { verificarNumeroIgnorado, temEtiquetaAtencao } from '../utils/labelUtils.js';
import { iniciarTimeout, limparTimeout } from '../utils/timeoutUtils.js';
import { enviarMensagemComDigitacao } from '../utils/chatUtils.js';
import Atendimento from '../models/Atendimento.js';

export async function verificarNumeroBloqueado(numero) {
    try {
        const bloqueado = await NumeroBloqueado.findOne({ numero });
        return bloqueado !== null;
    } catch (error) {
        console.error('❌ Erro ao verificar número bloqueado:', error);
        return false;
    }
}

export async function processarMensagem(message) {
    try {
        // Verifica se o número está bloqueado
        const numeroBloqueado = await verificarNumeroBloqueado(message.from);
        if (numeroBloqueado) {
            console.log(`🚫 Mensagem ignorada - Número bloqueado: ${message.from}`);
            return null;
        }

        // Verifica se o número tem a etiqueta ATENCAO
        if (await temEtiquetaAtencao(message.from)) {
            console.log(`🚫 [${new Date().toLocaleString()}] Mensagem recebida de número com etiqueta ATENCAO`);
            console.log(`📱 Número: ${message.from}`);
            console.log(`💬 Mensagem: ${message.body || message.message}`);
            console.log('➖'.repeat(30));
            return null; // Ignora a mensagem silenciosamente
        }

        // Busca ou cria atendimento
        let atendimento = await Atendimento.findOne({ 
            numero: message.from,
            finalizado: false
        });

        if (!atendimento) {
            atendimento = new Atendimento({
                numero: message.from,
                etapa: 'inicio',
                mensagens: []
            });
        }

        // Processa a mensagem recebida
        const resposta = await processarEtapa(message, atendimento);

        if (resposta) {
            // Inicia/reinicia o timeout quando recebe mensagem
            iniciarTimeout(atendimento);

            // Envia resposta com simulação de digitação
            if (resposta.text) {
                await enviarMensagemComDigitacao(message.from, resposta.text);
                return null; // Retorna null pois a mensagem já foi enviada
            }
        } else {
            // Se não houver resposta (atendimento finalizado), limpa o timeout
            limparTimeout(atendimento.numero);
        }

        return resposta;

    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
        throw error;
    }
}

// Função para processar a resposta do timeout
export async function processarRespostaTimeout(message) {
    try {
        const resposta = message.body?.trim().toLowerCase();

        if (resposta === '1' || resposta === 'sim' || resposta === '1️⃣') {
            // Cliente quer continuar
            const atendimento = await Atendimento.findOne({ 
                numero: message.from,
                finalizado: false
            });

            if (atendimento) {
                // Reinicia o timeout
                iniciarTimeout(atendimento);
                await enviarMensagemComDigitacao(message.from, 'Ótimo! Vamos continuar de onde paramos. Em que posso ajudar?');
                return null;
            }
        } 
        else if (resposta === '2' || resposta === 'não' || resposta === 'nao' || resposta === '2️⃣') {
            // Cliente quer encerrar
            await Atendimento.updateMany(
                { numero: message.from, finalizado: false },
                { $set: { finalizado: true } }
            );

            limparTimeout(message.from);
            await enviarMensagemComDigitacao(message.from, 'Ok! Atendimento encerrado. Se precisar de algo mais, é só mandar mensagem. 👋');
            return null;
        }

        return null;

    } catch (error) {
        console.error('❌ Erro ao processar resposta do timeout:', error);
        return null;
    }
} 