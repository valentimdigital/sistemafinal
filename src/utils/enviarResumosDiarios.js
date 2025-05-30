import Atendimento from '../models/Atendimento.js';
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

// Função principal para enviar resumos
export async function enviarResumosDiarios() {
    try {
        // Pega a data de início do dia atual
        const inicioDia = new Date();
        inicioDia.setHours(0, 0, 0, 0);

        // Pega a data de fim do dia atual
        const fimDia = new Date();
        fimDia.setHours(23, 59, 59, 999);

        // Busca todos os atendimentos finalizados hoje
        const atendimentos = await Atendimento.find({
            $or: [
                { etapa: 'finalizado' },
                { status: 'finalizado' }
            ],
            timestamp: {
                $gte: inicioDia,
                $lte: fimDia
            }
        }).sort({ timestamp: 1 });

        console.log(`🔍 Encontrados ${atendimentos.length} atendimentos finalizados hoje`);

        // Envia os resumos com intervalo de 1 minuto
        for (const atendimento of atendimentos) {
            try {
                const resumo = gerarTextoResumo(atendimento);
                await sendMessage(GRUPO_ID, resumo);
                console.log(`✅ Resumo enviado para o atendimento ${atendimento._id}`);

                // Aguarda 1 minuto antes de enviar o próximo
                await new Promise(resolve => setTimeout(resolve, 60000));
            } catch (error) {
                console.error(`❌ Erro ao enviar resumo do atendimento ${atendimento._id}:`, error);
                continue; // Continua para o próximo atendimento mesmo se houver erro
            }
        }

        console.log('✅ Todos os resumos foram enviados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao enviar resumos diários:', error);
        throw error;
    }
} 