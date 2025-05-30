import Atendimento from '../models/Atendimento.js';
import axios from 'axios';
import { enviarResumoAtendimento } from '../utils/atendimentoUtils.js';
import { limparCEP, consultarViaCEP, verificarViabilidadeCEP } from '../utils/cepUtils.js';
import { gerenciarErroFluxo } from '../utils/fluxoUtils.js';

// Função principal do fluxo Fibra
export async function fluxoFibra(message, atendimento) {
    try {
        // Verifica se a mensagem existe e não está vazia
        if (!message || !message.mensagem || message.mensagem.trim() === '') {
            console.log('🔕 Ignorando mensagem vazia no fluxo Fibra');
            return {
                success: false,
                mensagem: null // Não envia mensagem de erro para mensagens vazias
            };
        }

        const mensagem = message.mensagem.trim();
        console.log('📝 Processando mensagem no fluxo Fibra:', { mensagem, etapa: atendimento.etapa });
        
        // Processa o CEP
        if (atendimento.etapa === 'aguardando_cep') {
            // Limpa e valida o CEP
            const cepLimpo = limparCEP(mensagem);
            
            if (cepLimpo.length !== 8) {
                return await gerenciarErroFluxo(atendimento, '❌ CEP inválido. Por favor, envie apenas os números do CEP.\nExemplo: Para CEP 12.345-678, envie 12345678');
            }

            // Consulta o CEP na API ViaCEP
            const validacao = await consultarViaCEP(cepLimpo);
            if (!validacao.valido) {
                return await gerenciarErroFluxo(atendimento, '❌ CEP não encontrado. Por favor, verifique e envie novamente.');
            }

            // CEP válido, reseta as tentativas e continua o fluxo
            atendimento.tentativas = 0;
            atendimento.cep = validacao.data.cep;
            atendimento.logradouro = validacao.data.logradouro;
            atendimento.bairro = validacao.data.bairro;
            atendimento.cidade = validacao.data.localidade;
            atendimento.uf = validacao.data.uf;
            atendimento.etapa = 'aguardando_confirmacao_endereco';
            await atendimento.save();

            return {
                success: true,
                mensagem: `Confirme se este é o endereço correto:\n\n${validacao.data.logradouro}, ${validacao.data.bairro}\n${validacao.data.localidade} - ${validacao.data.uf}\n\nResponda com "sim" ou "não".`,
                proximaEtapa: 'aguardando_confirmacao_endereco'
            };
        }

        // Processa a confirmação do endereço
        if (atendimento.etapa === 'aguardando_confirmacao_endereco') {
            const resposta = mensagem.toLowerCase();
            
            if (resposta !== 'sim' && resposta !== 'não' && resposta !== 'nao') {
                return await gerenciarErroFluxo(atendimento, 'Por favor, responda apenas com "sim" ou "não".');
            }
            
            if (resposta === 'sim') {
                // Resposta correta, reseta as tentativas
                atendimento.tentativas = 0;
                atendimento.etapa = 'aguardando_numero';
                await atendimento.save();
                
                return {
                    success: true,
                    mensagem: 'Por favor, envie o número do endereço.',
                    proximaEtapa: 'aguardando_numero'
                };
            } else if (resposta === 'não' || resposta === 'nao') {
                // Resposta válida mas negativa, reseta as tentativas
                atendimento.tentativas = 0;
                atendimento.etapa = 'aguardando_cep';
                await atendimento.save();
                
                return {
                    success: true,
                    mensagem: 'Por favor, envie o CEP correto.',
                    proximaEtapa: 'aguardando_cep'
                };
            }
        }

        // Processa o número do endereço
        if (atendimento.etapa === 'aguardando_numero') {
            if (!/^\d+$/.test(mensagem)) {
                return await gerenciarErroFluxo(atendimento, '❌ Número inválido. Por favor, envie apenas números.');
            }

            // Número válido, reseta as tentativas
            atendimento.tentativas = 0;
            atendimento.numero = mensagem;
            atendimento.etapa = 'aguardando_complemento';
            await atendimento.save();

            return {
                success: true,
                mensagem: 'Por favor, envie o complemento do endereço (apartamento, bloco, etc). Se não houver complemento, envie "não".',
                proximaEtapa: 'aguardando_complemento'
            };
        }

        // Processa o complemento
        if (atendimento.etapa === 'aguardando_complemento') {
            const complemento = mensagem.toLowerCase() === 'não' || mensagem.toLowerCase() === 'nao' ? '' : mensagem;
            atendimento.complemento = complemento;
            
            // Agora que temos o endereço completo, verificamos a viabilidade
            const temViabilidade = await verificarViabilidadeCEP(atendimento.cep);
            atendimento.temViabilidade = temViabilidade;
            atendimento.etapa = 'finalizado';
            await atendimento.save();

            const enderecoCompleto = `${atendimento.logradouro}, ${atendimento.numero}${complemento ? ` - ${complemento}` : ''}\n${atendimento.bairro}\n${atendimento.cidade} - ${atendimento.uf}`;

            // Envia o resumo do atendimento para o grupo
            await enviarResumoAtendimento(atendimento);

            const mensagemViabilidade = temViabilidade 
                ? '🎉 *Ótima notícia! Temos viabilidade técnica no seu endereço!*\n\n'
                : '⚠️ *Importante: Seu endereço precisará de uma análise mais detalhada.*\n\n';

            return {
                success: true,
                mensagem: `${mensagemViabilidade}Endereço confirmado:\n\n${enderecoCompleto}\n\nUm de nossos especialistas entrará em contato em breve para prosseguir com sua contratação.`,
                proximaEtapa: 'finalizado'
            };
        }

        return {
            success: false,
            mensagem: '❌ Etapa não reconhecida no fluxo Fibra.'
        };

    } catch (error) {
        console.error('❌ Erro no fluxo Fibra:', error);
        return {
            success: false,
            mensagem: '❌ Desculpe, ocorreu um erro. Por favor, tente novamente.'
        };
    }
} 