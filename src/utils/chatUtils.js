import { getSocket } from '../config/socket.js';

const TEMPO_DIGITACAO = 3000; // 3 segundos

export async function enviarMensagemComDigitacao(numero, mensagem) {
    try {
        const sock = getSocket();
        if (!sock) {
            throw new Error('Socket não inicializado');
        }

        // Formata o número se necessário
        const numeroCompleto = numero.includes('@s.whatsapp.net') ? numero : `${numero}@s.whatsapp.net`;

        // Inicia a simulação de digitação
        await sock.sendPresenceUpdate('composing', numeroCompleto);
        
        // Aguarda 3 segundos
        await new Promise(resolve => setTimeout(resolve, TEMPO_DIGITACAO));
        
        // Para a simulação de digitação
        await sock.sendPresenceUpdate('paused', numeroCompleto);

        // Envia a mensagem
        await sock.sendMessage(numeroCompleto, { text: mensagem });

        console.log(`📤 Mensagem enviada para ${numeroCompleto} após simulação de digitação`);
        return true;

    } catch (error) {
        console.error('❌ Erro ao enviar mensagem com digitação:', error);
        return false;
    }
} 