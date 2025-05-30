// Função para verificar se uma mensagem é um comando de interrupção
export function isInterruptionCommand(message) {
    if (!message) return false;

    // Normaliza a mensagem (remove espaços, converte para minúsculas)
    const normalizedMessage = message.toLowerCase().trim().replace(/\s+/g, '');

    // Lista de comandos que indicam interrupção
    const interruptionCommands = [
        'iniciandoatendimento',
        '/iniciar',
        'iniciando',
        'atendimentoiniciando',
        'atendente',
        '/atendente',
        '#atendente'
    ];

    return interruptionCommands.includes(normalizedMessage);
}

// Função para processar uma interrupção
export async function handleInterruption(atendimento, sendMessage) {
    try {
        if (!atendimento) return false;

        // Atualiza o status do atendimento
        atendimento.status = 'suspenso';
        atendimento.etapa = 'finalizado';
        atendimento.dataFinalizacao = new Date();
        await atendimento.save();

        // Envia mensagem informando que um atendente irá assumir
        if (sendMessage && atendimento.jid) {
            await sendMessage(atendimento.jid, '✅ Entendi! Vou transferir seu atendimento para um de nossos especialistas. Em instantes alguém irá te atender.');
        }

        return true;
    } catch (error) {
        console.error('❌ Erro ao processar interrupção:', error);
        return false;
    }
}

// Função para verificar se um atendimento está suspenso
export function isAtendimentoSuspenso(atendimento) {
    return atendimento && atendimento.status === 'suspenso';
}

// Função para verificar se um atendimento está finalizado
export function isAtendimentoFinalizado(atendimento) {
    return atendimento && (atendimento.status === 'finalizado' || atendimento.etapa === 'finalizado');
} 