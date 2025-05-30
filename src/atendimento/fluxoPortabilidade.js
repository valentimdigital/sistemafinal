import Atendimento from '../models/Atendimento.js';
import axios from 'axios';
import { enviarResumoAtendimento } from '../utils/atendimentoUtils.js';
import { limparCNPJ, validarCNPJReceitaWS } from '../utils/cnpjUtils.js';
import { gerenciarErroFluxo } from '../utils/fluxoUtils.js';

// Função principal do fluxo de Portabilidade
export async function fluxoPortabilidade(message, atendimento) {
    try {
        // Verifica se a mensagem existe e não está vazia
        if (!message || !message.mensagem || message.mensagem.trim() === '') {
            console.log('🔕 Ignorando mensagem vazia no fluxo de Portabilidade');
            return {
                success: false,
                mensagem: null
            };
        }

        const mensagem = message.mensagem.trim();
        console.log('📝 Processando mensagem no fluxo de Portabilidade:', { mensagem, etapa: atendimento.etapa });

        // Se estiver aguardando CNPJ
        if (atendimento.etapa === 'aguardando_cnpj') {
            // Valida o formato do CNPJ
            const cnpjLimpo = limparCNPJ(mensagem);
            if (cnpjLimpo.length !== 14) {
                return {
                    success: false,
                    mensagem: '❌ O CNPJ deve conter 14 dígitos numéricos.\n\nPor favor, envie o CNPJ no formato correto (apenas números).\nExemplo: 12345678000199'
                };
            }

            // Consulta o CNPJ na API
            const validacao = await validarCNPJReceitaWS(mensagem);
            if (!validacao.valido) {
                return {
                    success: false,
                    mensagem: '❌ CNPJ não encontrado ou inválido. Por favor, verifique e envie novamente.'
                };
            }

            // CNPJ válido, atualiza o atendimento e pede confirmação
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
        }

        // Se estiver aguardando confirmação do CNPJ
        if (atendimento.etapa === 'aguardando_confirmacao_cnpj') {
            if (mensagem.toLowerCase() === 'sim') {
                atendimento.etapa = 'aguardando_operadora';
                await atendimento.save();
                
                return {
                    success: true,
                    mensagem: 'Qual é a operadora atual das linhas que você deseja portar?',
                    proximaEtapa: 'aguardando_operadora'
                };
            } else {
                atendimento.etapa = 'aguardando_cnpj';
                await atendimento.save();
                
                return {
                    success: false,
                    mensagem: '❌ Por favor, envie o CNPJ correto da empresa.'
                };
            }
        }

        // Se estiver aguardando operadora atual
        if (atendimento.etapa === 'aguardando_operadora') {
            atendimento.operadora_atual = mensagem;
            atendimento.etapa = 'aguardando_quantidade_portabilidade';
            await atendimento.save();

            return {
                success: true,
                mensagem: 'Quantas linhas você deseja portar para a TIM?',
                proximaEtapa: 'aguardando_quantidade_portabilidade'
            };
        }

        // Se estiver aguardando quantidade de linhas para portabilidade
        if (atendimento.etapa === 'aguardando_quantidade_portabilidade') {
            const quantidade = parseInt(mensagem);
            if (isNaN(quantidade) || quantidade <= 0) {
                atendimento.tentativas = (atendimento.tentativas || 0) + 1;
                await atendimento.save();

                if (atendimento.tentativas >= 2) {
                    return {
                        success: false,
                        mensagem: '❌ Notei que você está tendo dificuldades para informar a quantidade de linhas.\n\nPara sua comodidade, você pode falar diretamente com um de nossos atendentes.\n\n*Digite "ATENDENTE" para iniciar um atendimento personalizado.*'
                    };
                }

                return {
                    success: false,
                    mensagem: '❌ Por favor, envie um número válido de linhas.'
                };
            }

            // Quantidade válida, reseta as tentativas
            atendimento.tentativas = 0;
            atendimento.quantidade_linhas = quantidade;
            atendimento.etapa = 'aguardando_novas_linhas';
            await atendimento.save();

            return {
                success: true,
                mensagem: 'Além das linhas para portabilidade, você deseja ativar novas linhas? Responda com "sim" ou "não".',
                proximaEtapa: 'aguardando_novas_linhas'
            };
        }

        // Se estiver aguardando resposta sobre novas linhas
        if (atendimento.etapa === 'aguardando_novas_linhas') {
            const resposta = mensagem.toLowerCase();
            if (resposta !== 'sim' && resposta !== 'não' && resposta !== 'nao') {
                atendimento.tentativas = (atendimento.tentativas || 0) + 1;
                await atendimento.save();

                if (atendimento.tentativas >= 2) {
                    return {
                        success: false,
                        mensagem: '❌ Notei que você está tendo dificuldades para responder.\n\nPara sua comodidade, você pode falar diretamente com um de nossos atendentes.\n\n*Digite "ATENDENTE" para iniciar um atendimento personalizado.*'
                    };
                }

                return {
                    success: false,
                    mensagem: '❌ Por favor, responda apenas com "sim" ou "não".'
                };
            }

            // Resposta válida, reseta as tentativas
            atendimento.tentativas = 0;

            if (resposta === 'sim') {
                atendimento.etapa = 'aguardando_quantidade_novas_linhas';
                await atendimento.save();

                return {
                    success: true,
                    mensagem: 'Quantas novas linhas você deseja ativar?',
                    proximaEtapa: 'aguardando_quantidade_novas_linhas'
                };
            } else {
                atendimento.etapa = 'finalizado';
                await atendimento.save();

                // Envia o resumo do atendimento para o grupo
                await enviarResumoAtendimento(atendimento);

                return {
                    success: true,
                    mensagem: `✅ Perfeito! Resumo do pedido:\n\nEmpresa: ${atendimento.dadosCNPJ.nome_fantasia}\nOperadora atual: ${atendimento.operadora_atual}\nLinhas para portabilidade: ${atendimento.quantidade_linhas}\nNovas linhas: 0\n\nUm de nossos especialistas entrará em contato em breve para finalizar sua portabilidade.`,
                    proximaEtapa: 'finalizado'
                };
            }
        }

        // Se estiver aguardando quantidade de novas linhas
        if (atendimento.etapa === 'aguardando_quantidade_novas_linhas') {
            const quantidade = parseInt(mensagem);
            if (isNaN(quantidade) || quantidade <= 0) {
                atendimento.tentativas = (atendimento.tentativas || 0) + 1;
                await atendimento.save();

                if (atendimento.tentativas >= 2) {
                    return {
                        success: false,
                        mensagem: '❌ Notei que você está tendo dificuldades para informar a quantidade de novas linhas.\n\nPara sua comodidade, você pode falar diretamente com um de nossos atendentes.\n\n*Digite "ATENDENTE" para iniciar um atendimento personalizado.*'
                    };
                }

                return {
                    success: false,
                    mensagem: '❌ Por favor, envie um número válido de linhas.'
                };
            }

            // Quantidade válida, reseta as tentativas
            atendimento.tentativas = 0;
            atendimento.novas_linhas = quantidade;
            atendimento.etapa = 'finalizado';
            await atendimento.save();

            // Envia o resumo do atendimento para o grupo
            await enviarResumoAtendimento(atendimento);

            return {
                success: true,
                mensagem: `✅ Perfeito! Resumo do pedido:\n\nEmpresa: ${atendimento.dadosCNPJ.nome_fantasia}\nOperadora atual: ${atendimento.operadora_atual}\nLinhas para portabilidade: ${atendimento.quantidade_linhas}\nNovas linhas: ${atendimento.novas_linhas}\n\nUm de nossos especialistas entrará em contato em breve para finalizar sua portabilidade.`,
                proximaEtapa: 'finalizado'
            };
        }

        return {
            success: false,
            mensagem: '❌ Etapa não reconhecida no fluxo de Portabilidade.'
        };

    } catch (error) {
        console.error('❌ Erro no fluxo de Portabilidade:', error);
        return {
            success: false,
            mensagem: '❌ Desculpe, ocorreu um erro. Por favor, tente novamente.'
        };
    }
} 