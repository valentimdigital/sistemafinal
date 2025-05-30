import { getSocket } from '../config/socket.js';
import { temEtiquetaAtencao } from './labelUtils.js';
import { enviarMensagemComDigitacao } from './chatUtils.js';

const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutos em milissegundos
const timeouts = new Map();

export function iniciarTimeout(atendimento) {
    try {
        // Remove timeout anterior se existir
        if (timeouts.has(atendimento.numero)) {
            clearTimeout(timeouts.get(atendimento.numero));
        }

        // Cria novo timeout
        const timeoutId = setTimeout(async () => {
            await enviarMensagemRecuperacao(atendimento);
        }, TIMEOUT_DURATION);

        // Armazena o timeout
        timeouts.set(atendimento.numero, timeoutId);

        console.log(`⏰ Timeout iniciado para ${atendimento.numero}`);

    } catch (error) {
        console.error('❌ Erro ao iniciar timeout:', error);
    }
}

export function limparTimeout(numero) {
    try {
        if (timeouts.has(numero)) {
            clearTimeout(timeouts.get(numero));
            timeouts.delete(numero);
            console.log(`⏰ Timeout removido para ${numero}`);
        }
    } catch (error) {
        console.error('❌ Erro ao limpar timeout:', error);
    }
}

async function enviarMensagemRecuperacao(atendimento) {
    try {
        // Verifica se o número tem a etiqueta ATENCAO
        const temEtiqueta = await temEtiquetaAtencao(atendimento.numero);
        if (temEtiqueta) {
            console.log(`🚫 Número ${atendimento.numero} tem etiqueta ATENCAO. Não enviando mensagem de recuperação.`);
            return;
        }

        const mensagem = `Olá! 👋 Notei que nosso atendimento ficou parado. Posso ajudar com mais alguma coisa?\n\n1️⃣ - Sim, quero continuar\n2️⃣ - Não, pode encerrar`;

        await enviarMensagemComDigitacao(atendimento.numero, mensagem);

        // Remove o timeout após enviar a mensagem
        timeouts.delete(atendimento.numero);

    } catch (error) {
        console.error('❌ Erro ao enviar mensagem de recuperação:', error);
    }
} 