import Atendimento from '../models/Atendimento.js';
import axios from 'axios';
import { enviarResumoAtendimento } from '../utils/atendimentoUtils.js';
import { limparCNPJ, validarCNPJReceitaWS } from '../utils/cnpjUtils.js';
import { gerenciarErroFluxo } from '../utils/fluxoUtils.js';

// Função principal do fluxo CNPJ
export async function fluxoCNPJ(message, atendimento) {
    try {
        // Verifica se a mensagem existe e não está vazia
        if (!message || !message.mensagem || message.mensagem.trim() === '') {
            console.log('🔕 Ignorando mensagem vazia no fluxo CNPJ');
            return {
                success: false,
                mensagem: null // Não envia mensagem de erro para mensagens vazias
            };
        }

        const mensagem = message.mensagem.trim();
        console.log('📝 Processando mensagem no fluxo CNPJ:', { mensagem, etapa: atendimento.etapa });

        // Se estiver aguardando confirmação
        if (atendimento.etapa === 'aguardando_confirmacao_cnpj') {
            if (mensagem.toLowerCase() === 'sim') {
                // Confirmação positiva, finaliza o atendimento
                atendimento.etapa = 'finalizado';
                await atendimento.save();
                
                // Envia o resumo do atendimento para o grupo
                await enviarResumoAtendimento(atendimento);
                
                return {
                    success: true,
                    mensagem: '✅ Perfeito! Em instantes, um de nossos especialistas irá te atender diretamente. 💬',
                    proximaEtapa: 'finalizado'
                };
            } else {
                // Confirmação negativa, volta para aguardando CNPJ
                atendimento.etapa = 'aguardando_cnpj';
                await atendimento.save();
                
                return {
                    success: false,
                    mensagem: '❌ Por favor, envie o CNPJ correto da empresa.'
                };
            }
        }

        // Valida o formato do CNPJ
        const cnpjLimpo = limparCNPJ(mensagem);
        if (cnpjLimpo.length !== 14) {
            return await gerenciarErroFluxo(atendimento, '❌ O CNPJ deve conter 14 dígitos numéricos.\n\nPor favor, envie o CNPJ no formato correto (apenas números).\nExemplo: 12345678000199');
        }

        // Verifica se contém apenas números
        if (!/^\d+$/.test(cnpjLimpo)) {
            return await gerenciarErroFluxo(atendimento, '❌ O CNPJ deve conter apenas números.\n\nPor favor, envie o CNPJ no formato correto (apenas números).\nExemplo: 12345678000199');
        }

        // Consulta o CNPJ na API
        const validacao = await validarCNPJReceitaWS(mensagem);
        if (!validacao.valido) {
            return await gerenciarErroFluxo(atendimento, '❌ CNPJ não encontrado ou inválido. Por favor, verifique e envie novamente.');
        }

        // CNPJ válido, reseta as tentativas e continua o fluxo
        atendimento.tentativas = 0;
        atendimento.cnpj = cnpjLimpo;
        atendimento.dadosCNPJ = {
            razao_social: validacao.data.nome,
            nome_fantasia: validacao.data.fantasia,
            cidade: validacao.data.municipio,
            uf: validacao.data.uf,
            situacao: validacao.data.situacao
        };
        atendimento.etapa = 'aguardando_confirmacao_cnpj';
        await atendimento.save();

        return {
            success: true,
            mensagem: `✅ Encontrei a empresa: ${validacao.data.fantasia || validacao.data.nome}\n\nPor favor, confirme se esta é a empresa correta respondendo com "sim" ou "não".`,
            proximaEtapa: 'aguardando_confirmacao_cnpj'
        };

    } catch (error) {
        console.error('❌ Erro no fluxo CNPJ:', error);
        return {
            success: false,
            mensagem: '❌ Desculpe, ocorreu um erro. Por favor, tente novamente.'
        };
    }
} 