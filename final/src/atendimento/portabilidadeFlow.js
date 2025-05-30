import { handleInterruption } from '../utils/interruptionHandler.js';
import { limparCNPJ, validarCNPJReceitaWS } from '../utils/cnpjUtils.js';
import { verificarEncerramento } from '../utils/fluxoUtils.js';

// Função principal para processar mensagens do fluxo de portabilidade
export async function processPortabilidadeMessage(mensagem, atendimento) {
    try {
        // Verifica se a mensagem é "ATENDENTE"
        if (mensagem.toUpperCase() === 'ATENDENTE') {
            atendimento.status = 'suspenso';
            atendimento.etapa = 'finalizado';
            atendimento.encaminhadoAtendente = true;
            await atendimento.save();
            return '✅ Entendi! Vou transferir seu atendimento para um de nossos especialistas. Em instantes alguém irá te atender.';
        }

        // Processa a mensagem de acordo com a etapa atual
        switch (atendimento.etapa) {
            case 'aguardando_cnpj':
                // Valida o formato do CNPJ
                const cnpjLimpo = limparCNPJ(mensagem);
                if (cnpjLimpo.length !== 14) {
                    const resultado = await verificarEncerramento(atendimento, '❌ O CNPJ deve conter 14 dígitos numéricos.\n\nPor favor, envie o CNPJ no formato correto (apenas números).\nExemplo: 12345678000199');
                    return resultado.mensagem;
                }

                // Consulta o CNPJ na API
                const validacao = await validarCNPJReceitaWS(mensagem);
                if (!validacao.valido) {
                    const resultado = await verificarEncerramento(atendimento, '❌ CNPJ não encontrado ou inválido. Por favor, verifique e envie novamente.');
                    return resultado.mensagem;
                }

                // CNPJ válido, atualiza o atendimento
                atendimento.cnpj = cnpjLimpo;
                atendimento.dadosCNPJ = {
                    razao_social: validacao.data.nome,
                    nome_fantasia: validacao.data.fantasia,
                    cidade: validacao.data.municipio,
                    uf: validacao.data.uf,
                    situacao: validacao.data.situacao
                };
                atendimento.etapa = 'aguardando_confirmacao_cnpj';
                atendimento.tentativas = 0;
                await atendimento.save();

                return `✅ Encontrei a empresa: ${validacao.data.fantasia || validacao.data.nome}\n\nPor favor, confirme se esta é a empresa correta respondendo com "sim" ou "não".`;

            case 'aguardando_confirmacao_cnpj':
                if (mensagem.toLowerCase() === 'sim') {
                    atendimento.etapa = 'aguardando_operadora';
                    atendimento.tentativas = 0;
                    await atendimento.save();
                    return 'Por favor, informe qual é a sua operadora atual.';
                } else if (mensagem.toLowerCase() === 'não' || mensagem.toLowerCase() === 'nao') {
                    atendimento.etapa = 'aguardando_cnpj';
                    atendimento.tentativas = 0;
                    await atendimento.save();
                    return '❌ Por favor, envie o CNPJ correto da empresa.';
                } else {
                    const resultado = await verificarEncerramento(atendimento, '❌ Por favor, responda apenas com "sim" ou "não".');
                    return resultado.mensagem;
                }

            case 'aguardando_operadora':
                const operadora = mensagem.trim();
                if (operadora.length < 2) {
                    const resultado = await verificarEncerramento(atendimento, '❌ Por favor, informe o nome da operadora atual.');
                    return resultado.mensagem;
                }
                
                atendimento.operadora_atual = operadora;
                atendimento.etapa = 'aguardando_quantidade_portabilidade';
                atendimento.tentativas = 0;
                await atendimento.save();
                return 'Quantas linhas você deseja portar para a TIM?';

            case 'aguardando_quantidade_portabilidade':
                const quantidade = parseInt(mensagem);
                if (isNaN(quantidade) || quantidade <= 0) {
                    const resultado = await verificarEncerramento(atendimento, '❌ Por favor, envie um número válido maior que zero.');
                    return resultado.mensagem;
                }

                // Quantidade válida, reseta as tentativas e finaliza o atendimento
                atendimento.tentativas = 0;
                atendimento.quantidade_linhas = quantidade;
                atendimento.etapa = 'finalizado';
                atendimento.status = 'finalizado';
                await atendimento.save();

                // Envia o resumo do atendimento
                await enviarResumoAtendimento(atendimento);

                // Formata o resumo do atendimento
                const resumo = [
                    '📱 *PORTABILIDADE*',
                    `🏢 *Empresa:* ${atendimento.dadosCNPJ.nome_fantasia || atendimento.dadosCNPJ.razao_social}`,
                    `👥 *Operadora atual:* ${atendimento.operadora_atual}`,
                    `📞 *Quantidade de linhas a portar:* ${quantidade}`,
                ].join('\n');

                return `✅ Perfeito! Registrei suas informações:\n\n${resumo}\n\n🔄 Um de nossos especialistas entrará em contato em breve para finalizar sua portabilidade.`;

            default:
                return null;
        }
    } catch (error) {
        console.error('❌ Erro ao processar mensagem de portabilidade:', error);
        return '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
    }
} 