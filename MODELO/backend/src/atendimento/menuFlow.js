// Fluxo de menu para atendimento
import { saveMessage } from '../models/Mensagem.js';
import { findOrCreateContact } from '../models/Contato.js';
import Atendimento from '../models/Atendimento.js';
import { fluxoCNPJ } from './fluxoCNPJ.js';
import { fluxoFibra } from './fluxoFibra.js';
import { fluxoAtivacao } from './fluxoAtivacao.js';
import { processPortabilidadeMessage } from './portabilidadeFlow.js';
import { enviarResumoAtendimento } from '../utils/atendimentoUtils.js';
import { gerenciarErroFluxo } from '../utils/fluxoUtils.js';
import { enviarMensagemComDigitacao } from '../whatsapp.js';
import { verificarEncerramento } from '../utils/fluxoUtils.js';

// Mensagens do menu
const MENSAGENS = {
    BOAS_VINDAS: `Olá! 👋 É um prazer ter você por aqui na Parceria TIM Valentim Digital.\nPara iniciarmos, poderia me informar seu **nome**, por gentileza? 😊`,
    
    MENU_OPCOES: (nome) => `📩 Oi, ${nome}! 👋\nEstamos felizes em te ajudar! Qual solução você busca hoje?\nEnvie o número da opção desejada:\n\n1 - 💼 Atendimento Corporativo (CNPJ)\n2 - ⚡ Internet ULTRA Fibra\n3 - 📱 Ativação de Novas Linhas\n4 - 🔄 Portabilidade de Número\n5 - 👨‍💼 Já estou em atendimento`,
    
    ERRO_OPCAO: `Opção inválida. Por favor, escolha uma das opções disponíveis.`,

    HORARIO_ATENDIMENTO: `⏰ Nosso horário de atendimento é de Segunda a Sexta, das 09:00 às 18:30.\n\nFique tranquilo(a), nossos especialistas já foram notificados e em breve entrarão em contato com você.`
};

// Função principal para processar mensagens
export async function processMessage(message, sock) {
    try {
        // Extrai o número e a mensagem do formato do Baileys
        const jid = message.key.remoteJid;
        const mensagem = message.message?.extendedTextMessage?.text || message.message?.conversation || '';

        // Função local para enviar mensagem com digitação
        const enviarMensagem = async (to, text) => {
            try {
                return await enviarMensagemComDigitacao(to, text);
            } catch (error) {
                console.error('❌ Erro ao enviar mensagem:', error);
                throw error;
            }
        };

        // Ignora mensagens vazias
        if (!mensagem || mensagem.trim() === '') {
            console.log('🔕 Ignorando mensagem vazia');
            return;
        }

        // Ignora mensagens de grupos
        if (jid.endsWith('@g.us')) {
            console.log(`[Ignorado] Mensagem de grupo ${jid}`);
            return;
        }

        // Ignora mensagens do próprio bot
        if (message.key.fromMe) {
            console.log(`[Ignorado] Mensagem do próprio bot`);
            return;
        }

        console.log('📝 Processando mensagem:', { jid, mensagem });

        // Busca atendimento ativo
        const atendimento = await Atendimento.findOne({ 
            jid: jid,
            status: { $ne: 'suspenso' }
        });

        // Se o atendimento está suspenso, não processa mais mensagens
        if (atendimento && atendimento.status === 'suspenso') {
            console.log('❌ Atendimento suspenso, ignorando mensagem');
            return;
        }

        // Se o atendimento já foi encaminhado para atendente, ignora novas mensagens
        if (atendimento && atendimento.encaminhadoAtendente) {
            console.log('🔕 Atendimento já encaminhado para atendente, ignorando mensagem');
            return;
        }

        // Se o atendimento está finalizado, ignora novas mensagens
        if (atendimento && atendimento.etapa === 'finalizado') {
            console.log('🔕 Atendimento finalizado, ignorando mensagem');
            return;
        }

        if (!atendimento) {
            console.log('🔍 Estado atual do atendimento: Novo atendimento');
            
            // Cria novo atendimento
            const novoAtendimento = new Atendimento({
                jid: jid,
                etapa: 'aguardando_nome',
                status: 'ativo',
                fluxo: 'menu'
            });
            await novoAtendimento.save();
            console.log('✅ Novo atendimento criado');

            // Envia mensagem de boas-vindas
            console.log('📤 Enviando mensagem de boas-vindas:', MENSAGENS.BOAS_VINDAS);
            await enviarMensagem(jid, MENSAGENS.BOAS_VINDAS);
            return;
        }

        // Processa a mensagem de acordo com a etapa atual
        switch (atendimento.etapa) {
            case 'aguardando_nome':
                if (mensagem.trim().length < 2) {
                    const mensagemErro = 'Por favor, envie seu nome completo.';
                    await enviarMensagem(jid, mensagemErro);
                    return;
                }
                
                const nome = mensagem.trim();
                atendimento.nome = nome;
                atendimento.etapa = 'aguardando_opcao';
                await atendimento.save();

                // Envia menu de opções
                const menuOpcoes = MENSAGENS.MENU_OPCOES(nome);
                await enviarMensagem(jid, menuOpcoes);
                break;

            case 'aguardando_opcao':
                const opcao = mensagem.trim();

                // Processa a opção apenas se for válida
                switch (opcao) {
                    case '1':
                        atendimento.fluxo = 'CNPJ';
                        atendimento.etapa = 'aguardando_cnpj';
                        await atendimento.save();
                        await enviarMensagem(jid, 'Por favor, envie o CNPJ da empresa.');
                        break;

                    case '2':
                        atendimento.fluxo = 'Fibra';
                        atendimento.etapa = 'aguardando_cep';
                        await atendimento.save();
                        await enviarMensagem(jid, 'Por favor, envie o CEP do endereço de instalação.');
                        break;

                    case '3':
                        atendimento.fluxo = 'Ativacao';
                        atendimento.etapa = 'aguardando_cnpj';
                        await atendimento.save();
                        await enviarMensagem(jid, 'Por favor, envie o CNPJ da empresa.');
                        break;

                    case '4':
                        atendimento.fluxo = 'Portabilidade';
                        atendimento.etapa = 'aguardando_cnpj';
                        await atendimento.save();
                        await enviarMensagem(jid, 'Por favor, envie o CNPJ da empresa.');
                        break;

                    case '5':
                        atendimento.fluxo = 'EmAtendimento';
                        atendimento.etapa = 'finalizado';
                        atendimento.status = 'suspenso';
                        atendimento.encaminhadoAtendente = true;
                        await atendimento.save();
                        await enviarMensagem(jid, MENSAGENS.HORARIO_ATENDIMENTO);
                        break;

                    default:
                        await enviarMensagem(jid, MENSAGENS.ERRO_OPCAO);
                        break;
                }
                break;

            case 'aguardando_cnpj':
            case 'aguardando_confirmacao_cnpj':
            case 'aguardando_linhas_existentes':
            case 'aguardando_novas_linhas':
                if (atendimento.fluxo === 'Ativacao') {
                    const resultadoAtivacao = await fluxoAtivacao({ numero: jid, mensagem }, atendimento);
                    if (resultadoAtivacao.success) {
                        atendimento.etapa = resultadoAtivacao.proximaEtapa;
                        await atendimento.save();
                    }
                    if (resultadoAtivacao.mensagem) {
                        await enviarMensagem(jid, resultadoAtivacao.mensagem);
                    }
                } else {
                    const resultadoCNPJ = await fluxoCNPJ({ numero: jid, mensagem }, atendimento);
                    if (resultadoCNPJ.success) {
                        atendimento.etapa = resultadoCNPJ.proximaEtapa;
                        await atendimento.save();
                    }
                    if (resultadoCNPJ.mensagem) {
                        await enviarMensagem(jid, resultadoCNPJ.mensagem);
                    }
                }
                break;

            case 'aguardando_cep':
            case 'aguardando_confirmacao_endereco':
            case 'aguardando_numero':
            case 'aguardando_complemento':
                const resultadoFibra = await fluxoFibra({ numero: jid, mensagem }, atendimento);
                if (resultadoFibra.success) {
                    atendimento.etapa = resultadoFibra.proximaEtapa;
                    await atendimento.save();
                }
                if (resultadoFibra.mensagem) {
                    await enviarMensagem(jid, resultadoFibra.mensagem);
                }
                break;

            case 'aguardando_operadora':
            case 'aguardando_quantidade_portabilidade':
            case 'aguardando_cnpj':
            case 'aguardando_confirmacao_cnpj':
                if (atendimento.fluxo === 'Portabilidade') {
                    const mensagemResposta = await processPortabilidadeMessage(mensagem, atendimento);
                    if (mensagemResposta) {
                        await enviarMensagem(jid, mensagemResposta);
                    }
                }
                break;

            default:
                // Verifica se é uma solicitação de atendente
                if (mensagem.toUpperCase() === 'ATENDENTE') {
                    atendimento.status = 'suspenso';
                    atendimento.etapa = 'finalizado';
                    atendimento.encaminhadoAtendente = true;
                    await atendimento.save();

                    await enviarMensagem(jid, '✅ Entendi! Vou transferir seu atendimento para um de nossos especialistas. Em instantes alguém irá te atender.');
                    return;
                }

                console.log('❌ Etapa não reconhecida:', atendimento.etapa);
                await enviarMensagem(jid, 'Desculpe, ocorreu um erro. Por favor, inicie um novo atendimento.');
                break;
        }

    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
        throw error;
    }
}

// Exporta apenas as mensagens
export { MENSAGENS }; 

export async function processMenuMessage(mensagem, atendimento) {
    try {
        // Verifica se a mensagem é "ATENDENTE"
        if (mensagem.toUpperCase() === 'ATENDENTE') {
            atendimento.status = 'suspenso';
            atendimento.etapa = 'finalizado';
            atendimento.encaminhadoAtendente = true;
            await atendimento.save();
            return '✅ Entendi! Vou transferir seu atendimento para um de nossos especialistas. Em instantes alguém irá te atender.';
        }

        // Se estiver em um fluxo específico, encaminha para o processador correspondente
        if (atendimento.fluxo === 'portabilidade') {
            return await processPortabilidadeMessage(mensagem, atendimento);
        }

        // Processa a mensagem de acordo com a etapa atual
        switch (atendimento.etapa) {
            case 'menu_inicial':
                const opcao = parseInt(mensagem);
                if (isNaN(opcao) || opcao < 1 || opcao > 4) {
                    const resultado = await verificarEncerramento(atendimento, '❌ Por favor, escolha uma opção válida digitando um número de 1 a 4:');
                    return resultado.mensagem;
                }

                // Reseta as tentativas ao escolher uma opção válida
                atendimento.tentativas = 0;

                switch (opcao) {
                    case 1:
                        atendimento.fluxo = 'planos';
                        atendimento.etapa = 'aguardando_tipo_plano';
                        await atendimento.save();
                        return '📱 *PLANOS TIM*\n\nQual tipo de plano você tem interesse?\n\n1️⃣ Plano Controle\n2️⃣ Plano Pós-pago\n3️⃣ Plano Empresarial';

                    case 2:
                        atendimento.fluxo = 'cobertura';
                        atendimento.etapa = 'aguardando_cep';
                        await atendimento.save();
                        return '📍 *CONSULTA DE COBERTURA*\n\nPor favor, envie o CEP da localidade que deseja consultar a cobertura TIM.';

                    case 3:
                        atendimento.fluxo = 'suporte';
                        atendimento.etapa = 'aguardando_tipo_suporte';
                        await atendimento.save();
                        return '🛠️ *SUPORTE TÉCNICO*\n\nQual tipo de suporte você precisa?\n\n1️⃣ Internet não funciona\n2️⃣ Problemas com ligações\n3️⃣ Outros problemas';

                    case 4:
                        atendimento.fluxo = 'portabilidade';
                        atendimento.etapa = 'aguardando_cnpj';
                        await atendimento.save();
                        return '🔄 *PORTABILIDADE*\n\nPara iniciar o processo de portabilidade, por favor envie o CNPJ da sua empresa.';
                }
                break;

            default:
                // Se chegou aqui, algo deu errado
                atendimento.status = 'suspenso';
                atendimento.etapa = 'finalizado';
                atendimento.encaminhadoAtendente = true;
                await atendimento.save();
                return '❌ Desculpe, ocorreu um erro no atendimento. Um de nossos especialistas irá te atender em instantes.';
        }
    } catch (error) {
        console.error('❌ Erro ao processar mensagem do menu:', error);
        return '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
    }
} 