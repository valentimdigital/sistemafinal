import { enviarResumoAtendimento } from './atendimentoUtils.js';

// Função para gerenciar erros de fluxo
export async function gerenciarErroFluxo(atendimento, mensagemErro) {
    // Incrementa o contador de tentativas
    atendimento.tentativas = (atendimento.tentativas || 0) + 1;
    
    // Se atingiu 2 tentativas, finaliza e encaminha para atendente
    if (atendimento.tentativas >= 2) {
        atendimento.etapa = 'finalizado';
        atendimento.status = 'suspenso';
        atendimento.encaminhadoAtendente = true;
        await atendimento.save();
        
        // Envia o resumo do atendimento para o grupo
        await enviarResumoAtendimento(atendimento);
        
        return {
            success: false,
            mensagem: '❌ Percebi que você está tendo algumas dificuldades.\n\nPara melhor te atender, vou encaminhar seu atendimento para um de nossos especialistas. Em instantes alguém irá te atender. 😊\n\nAgradecemos sua compreensão! 🙏'
        };
    }
    
    // Se ainda não atingiu o limite, retorna a mensagem de erro normal
    await atendimento.save();
    return {
        success: false,
        mensagem: mensagemErro
    };
}

// Função para verificar se deve encerrar o atendimento
export async function verificarEncerramento(atendimento, mensagemErro) {
    // Incrementa o contador de tentativas
    atendimento.tentativas = (atendimento.tentativas || 0) + 1;
    await atendimento.save();

    // Se atingiu 2 tentativas, finaliza e encaminha para atendente
    if (atendimento.tentativas >= 2) {
        atendimento.etapa = 'finalizado';
        atendimento.status = 'suspenso';
        atendimento.encaminhadoAtendente = true;
        await atendimento.save();

        // Envia o resumo do atendimento para o grupo
        await enviarResumoAtendimento(atendimento);

        return {
            encerrado: true,
            mensagem: '❌ Percebi que você está tendo algumas dificuldades.\n\nPara melhor te atender, vou encaminhar seu atendimento para um de nossos especialistas. Em instantes alguém irá te atender. 😊\n\nAgradecemos sua compreensão! 🙏'
        };
    }

    return {
        encerrado: false,
        mensagem: mensagemErro
    };
} 