import { sendMessage } from '../whatsapp.js';

const GRUPO_ID = '120363399448772089@g.us';

// Função para formatar data para horário local em pt-BR
function formatarData(data) {
    return new Date(data).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Função para formatar número de telefone
function formatarTelefone(numero) {
    if (!numero) return 'Não informado';
    // Remove o prefixo 55 e formata o número
    const numeroLimpo = numero.replace('@s.whatsapp.net', '').replace('55', '');
    return `(${numeroLimpo.slice(0, 2)}) ${numeroLimpo.slice(2, 7)}-${numeroLimpo.slice(7)}`;
}

// Função para gerar o texto do resumo baseado no tipo de atendimento
function gerarTextoResumo(atendimento) {
    let resumo = `📋 *Resumo do Atendimento*\n\n`;
    resumo += `👤 *Cliente:* ${atendimento.nome}\n`;
    resumo += `📅 *Data:* ${formatarData(atendimento.timestamp)}\n`;
    resumo += `🔄 *Tipo de Atendimento:* ${atendimento.fluxo}\n\n`;

    switch (atendimento.fluxo) {
        case 'CNPJ':
            if (atendimento.dadosCNPJ) {
                resumo += `🏢 *Dados da Empresa:*\n`;
                resumo += `- Razão Social: ${atendimento.dadosCNPJ.razao_social}\n`;
                resumo += `- Nome Fantasia: ${atendimento.dadosCNPJ.nome_fantasia || 'Não informado'}\n`;
                resumo += `- Cidade: ${atendimento.dadosCNPJ.cidade}\n`;
                resumo += `- UF: ${atendimento.dadosCNPJ.uf}\n`;
            }
            break;

        case 'Fibra':
            if (atendimento.logradouro) {
                resumo += `📍 *Endereço de Instalação:*\n`;
                resumo += `${atendimento.logradouro}, ${atendimento.numero}`;
                if (atendimento.complemento) resumo += ` - ${atendimento.complemento}`;
                resumo += `\n${atendimento.bairro}\n`;
                resumo += `${atendimento.cidade} - ${atendimento.uf}\n`;
                resumo += `CEP: ${atendimento.cep}\n`;
            }
            break;

        case 'Ativacao':
            if (atendimento.dadosCNPJ) {
                resumo += `🏢 *Empresa:* ${atendimento.dadosCNPJ.nome_fantasia || atendimento.dadosCNPJ.razao_social}\n`;
                resumo += `📱 *Linhas existentes:* ${atendimento.linhas_existentes || 0}\n`;
                resumo += `➕ *Novas linhas:* ${atendimento.novas_linhas || 0}\n`;
            }
            break;

        case 'Portabilidade':
            if (atendimento.dadosCNPJ) {
                resumo += `🏢 *Empresa:* ${atendimento.dadosCNPJ.nome_fantasia || atendimento.dadosCNPJ.razao_social}\n`;
                resumo += `📱 *Operadora atual:* ${atendimento.operadora_atual || 'Não informada'}\n`;
                resumo += `🔄 *Linhas para portabilidade:* ${atendimento.quantidade_linhas || 0}\n`;
                resumo += `➕ *Novas linhas:* ${atendimento.novas_linhas || 0}\n`;
            }
            break;
    }

    return resumo;
}

// Função para enviar resumo do atendimento
export async function enviarResumoAtendimento(atendimento) {
    try {
        if (!atendimento) return false;

        let resumo = `📋 *RESUMO DO ATENDIMENTO*\n\n`;
        
        // Informações básicas
        resumo += `👤 *Cliente:* ${atendimento.nome || 'Não informado'}\n`;
        resumo += `📞 *Telefone:* ${formatarTelefone(atendimento.jid)}\n`;
        resumo += `📅 *Data:* ${formatarData(atendimento.timestamp)}\n`;
        resumo += `🔄 *Tipo:* ${atendimento.fluxo}\n`;
        resumo += `📊 *Status:* ${atendimento.status}\n\n`;

        // Informações específicas por tipo de fluxo
        switch (atendimento.fluxo) {
            case 'CNPJ':
                if (atendimento.dadosCNPJ) {
                    resumo += `🏢 *Dados da Empresa:*\n`;
                    resumo += `- Razão Social: ${atendimento.dadosCNPJ.razao_social}\n`;
                    resumo += `- Nome Fantasia: ${atendimento.dadosCNPJ.nome_fantasia || 'Não informado'}\n`;
                    resumo += `- CNPJ: ${atendimento.cnpj}\n`;
                    resumo += `- Cidade: ${atendimento.dadosCNPJ.cidade}\n`;
                    resumo += `- UF: ${atendimento.dadosCNPJ.uf}\n`;
                }
                break;

            case 'Fibra':
                if (atendimento.logradouro) {
                    resumo += `📍 *Endereço de Instalação:*\n`;
                    resumo += `${atendimento.logradouro}, ${atendimento.numero}`;
                    if (atendimento.complemento) resumo += ` - ${atendimento.complemento}`;
                    resumo += `\n${atendimento.bairro}\n`;
                    resumo += `${atendimento.cidade} - ${atendimento.uf}\n`;
                    resumo += `CEP: ${atendimento.cep}\n`;
                    resumo += `\n✅ *Viabilidade:* ${atendimento.temViabilidade ? 'Disponível' : 'Necessita análise'}\n`;
                }
                break;

            case 'Ativacao':
                if (atendimento.dadosCNPJ) {
                    resumo += `🏢 *Empresa:*\n`;
                    resumo += `- Nome: ${atendimento.dadosCNPJ.nome_fantasia || atendimento.dadosCNPJ.razao_social}\n`;
                    resumo += `- CNPJ: ${atendimento.cnpj}\n\n`;
                    resumo += `📱 *Informações:*\n`;
                    resumo += `- Linhas existentes: ${atendimento.linhas_existentes || 0}\n`;
                    resumo += `- Novas linhas: ${atendimento.novas_linhas || 0}\n`;
                }
                break;

            case 'Portabilidade':
                if (atendimento.dadosCNPJ) {
                    resumo += `🏢 *Empresa:*\n`;
                    resumo += `- Nome: ${atendimento.dadosCNPJ.nome_fantasia || atendimento.dadosCNPJ.razao_social}\n`;
                    resumo += `- CNPJ: ${atendimento.cnpj}\n\n`;
                    resumo += `📱 *Informações da Portabilidade:*\n`;
                    resumo += `- Operadora atual: ${atendimento.operadora_atual || 'Não informada'}\n`;
                    resumo += `- Linhas para portar: ${atendimento.quantidade_linhas || 0}\n`;
                    if (atendimento.novas_linhas) {
                        resumo += `- Novas linhas: ${atendimento.novas_linhas}\n`;
                    }
                }
                break;
        }

        // Adiciona informação de encaminhamento se aplicável
        if (atendimento.encaminhadoAtendente) {
            resumo += `\n⚠️ *Atendimento encaminhado para especialista*\n`;
        }

        await sendMessage(GRUPO_ID, resumo);
        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar resumo do atendimento:', error);
        return false;
    }
}

// Função para atualizar o status de um atendimento
export async function updateAtendimentoStatus(atendimento, novoStatus, novaEtapa = null) {
    try {
        if (!atendimento) return false;

        atendimento.status = novoStatus;
        if (novaEtapa) {
            atendimento.etapa = novaEtapa;
        }

        if (novoStatus === 'finalizado' || novaEtapa === 'finalizado') {
            atendimento.dataFinalizacao = new Date();
            // Envia o resumo quando o atendimento é finalizado
            await enviarResumoAtendimento(atendimento);
        }

        await atendimento.save();
        return true;
    } catch (error) {
        console.error('❌ Erro ao atualizar status do atendimento:', error);
        return false;
    }
}

// Função para verificar se um atendimento está ativo
export function isAtendimentoAtivo(atendimento) {
    return atendimento && atendimento.status === 'ativo';
}

// Função para verificar se um atendimento está finalizado
export function isAtendimentoFinalizado(atendimento) {
    return atendimento && (atendimento.status === 'finalizado' || atendimento.etapa === 'finalizado');
}

// Função para verificar se um atendimento está suspenso
export function isAtendimentoSuspenso(atendimento) {
    return atendimento && atendimento.status === 'suspenso';
} 