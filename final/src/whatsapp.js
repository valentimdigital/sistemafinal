import pkg from '@whiskeysockets/baileys';
const { 
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = pkg;

// Importando o store diretamente do módulo
const { makeInMemoryStore } = await import('@whiskeysockets/baileys/lib/Store/make-in-memory-store.js').catch(() => {
    return { makeInMemoryStore: () => {
        return {
            bind: () => {},
            loadMessage: () => null,
            loadMessages: () => [],
            chats: { all: () => [] },
            writeToFile: () => {},
            readFromFile: () => {}
        };
    }};
});

import { io } from './socket.js';
import Contato from './models/Contato.js';
import Mensagem from './models/Mensagem.js';
import { Boom } from '@hapi/boom';
import path from 'path';
import { fileURLToPath } from 'url';
import { processMessage } from './atendimento/menuFlow.js';
import pino from 'pino';
import Atendimento from './models/Atendimento.js';
import qrcode from 'qrcode-terminal';
import { verificarAtivacaoBot, ativarBot, desativarBot, atualizarUltimoContato, isBotAtivo } from './utils/botManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let globalSock = null;
let store = makeInMemoryStore({});
store.readFromFile('./baileys_store.json');

setInterval(() => {
    store.writeToFile('./baileys_store.json');
}, 10000);

    let retryCount = 0;
const MAX_RETRIES = 5;
const RATE_LIMIT_DELAY = 2000;
const messageQueue = [];
let isProcessingQueue = false;

// Set para armazenar IDs de mensagens do bot
const botMessageIds = new Set();

// Função para processar a fila de mensagens
async function processMessageQueue() {
    if (isProcessingQueue || messageQueue.length === 0) return;
    
    isProcessingQueue = true;
    
    while (messageQueue.length > 0) {
        const { message, sock } = messageQueue.shift();
        try {
            await processMessage(message, sock);
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        } catch (error) {
            console.error('❌ Erro ao processar mensagem da fila:', error);
        }
    }
    
    isProcessingQueue = false;
}

// Função para inicializar o WhatsApp
async function initializeWhatsApp() {
    try {
        const logger = pino({ level: 'silent' });
            const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
            const { version } = await fetchLatestBaileysVersion();
            
        const sock = makeWASocket({
                version,
                printQRInTerminal: true,
                auth: state,
            logger,
            msgRetryCounterMap: {},
            defaultQueryTimeoutMs: undefined,
            connectTimeoutMs: 60_000,
            emitOwnEvents: true,
            markOnlineOnConnect: true,
            browser: ['Valentim Digital', 'Chrome', '120.0.0'],
            syncFullHistory: false,
            generateHighQualityLinkPreview: false,
            getMessage: async () => {
                return { conversation: 'hello' };
            }
        });
        
        sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                qrcode.generate(qr, { small: true });
                console.log('🔄 Novo QR Code gerado');
                        io.emit('qr-code', { qr });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('❌ Conexão fechada devido a ', lastDisconnect.error, ', reconectando ', shouldReconnect);
                
                if (shouldReconnect && retryCount < MAX_RETRIES) {
                    retryCount++;
                    console.log(`🔄 Tentativa de reconexão ${retryCount} de ${MAX_RETRIES}`);
                    setTimeout(async () => {
                        await initializeWhatsApp();
                    }, 5000 * retryCount);
                } else if (retryCount >= MAX_RETRIES) {
                    console.log('❌ Número máximo de tentativas de reconexão atingido');
                    io.emit('connection-status', { status: 'max_retries' });
                }
            } else if (connection === 'open') {
                console.log('✅ Conectado ao WhatsApp!');
                globalSock = sock;
                        retryCount = 0;
                io.emit('connection-status', { status: 'connected' });
            }
        });
        
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            try {
                for (const message of messages) {
                    if (!message.message) continue;
                    
                    const jid = message.key.remoteJid;
                    const messageId = message.key.id;
                    
                    // Ignora mensagens de grupos
                    if (jid.endsWith('@g.us')) {
                        console.log(`[Ignorado] Mensagem de grupo ${jid}`);
                        continue;
                    }

                    // Se a mensagem foi enviada pelo bot (fromMe) mas está no registro de mensagens do bot, ignora
                    if (message.key.fromMe && botMessageIds.has(messageId)) {
                        console.log(`[Bot] Mensagem automática identificada, ignorando...`);
                        continue;
                    }

                    // Se a mensagem foi enviada manualmente (fromMe e não está no registro do bot)
                    if (message.key.fromMe) {
                        console.log(`[Manual] Mensagem enviada manualmente para ${jid}, finalizando atendimento...`);
                        const atendimento = await Atendimento.findOne({ 
                            jid: jid,
                            status: { $ne: 'suspenso' }
                        });

                        if (atendimento) {
                            atendimento.status = 'suspenso';
                            atendimento.etapa = 'finalizado';
                            atendimento.encaminhadoAtendente = true;
                            await atendimento.save();
                            console.log(`✅ Atendimento finalizado para ${jid}`);
                        }
                        continue;
                    }

                    // Verifica se já existe um atendimento suspenso antes de processar
                    const atendimentoExistente = await Atendimento.findOne({
                        jid: jid,
                        $or: [
                            { status: 'suspenso' },
                            { encaminhadoAtendente: true },
                            { etapa: 'finalizado' }
                        ]
                    });

                    if (atendimentoExistente) {
                        console.log(`[Ignorado] Atendimento já finalizado/suspenso para ${jid}`);
                        continue;
                    }
                    
                    // Se não foi manual e não está suspenso, processa normalmente
                    messageQueue.push({ message, sock });
                    console.log(`[Enfileirado] Mensagem de ${jid}`);
                }
                
                processMessageQueue();
            } catch (error) {
                console.error('❌ Erro ao processar mensagens:', error);
            }
        });
        
        sock.ev.on('creds.update', saveCreds);
        
        return { sock };
    } catch (error) {
        console.error('❌ Erro ao inicializar WhatsApp:', error);
        throw error;
    }
}

// Função para enviar mensagem com simulação de digitação
async function enviarMensagemComDigitacao(jid, mensagem) {
    if (!globalSock) return;
    
    try {
        await globalSock.presenceSubscribe(jid);
        await globalSock.sendPresenceUpdate('composing', jid);
        
        const mensagemTexto = typeof mensagem === 'string' 
            ? mensagem 
            : (mensagem && mensagem.text ? mensagem.text : String(mensagem));
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        await globalSock.sendPresenceUpdate('paused', jid);
        
        const result = await globalSock.sendMessage(jid, { 
            text: mensagemTexto
        });

        // Registra o ID da mensagem do bot
        if (result?.key?.id) {
            botMessageIds.add(result.key.id);
            // Remove o ID após 5 segundos para evitar crescimento infinito do Set
            setTimeout(() => {
                botMessageIds.delete(result.key.id);
            }, 5000);
        }

        return result;
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw error;
    }
}

// Função para verificar se o WhatsApp está conectado
const isWhatsAppConnected = () => globalSock && globalSock.user && globalSock.user.id;
const getGlobalSock = () => globalSock;

// Função para enviar mensagem simples
async function sendMessage(jid, content) {
    try {
        if (!globalSock) {
            throw new Error('Socket não inicializado');
        }

        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        
        const mensagemTexto = typeof content === 'string' 
            ? content 
            : (content && content.text ? content.text : String(content));
        
        const result = await globalSock.sendMessage(jid, {
            text: mensagemTexto
        });

        io.emit('nova-mensagem', {
            id: result.key.id,
            jid: jid,
            content: mensagemTexto,
            timestamp: Date.now()
        });

        return result;
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        throw error;
    }
}

// Função para verificar tag ARQUIVADO
async function verificarTagArquivado(jid) {
    try {
        if (!globalSock) {
            console.log('Socket não inicializado');
            return false;
        }

        const chat = await store.loadMessage(jid, 1);
        return chat && chat.archive === true;
    } catch (error) {
        console.error('Erro ao verificar status de arquivo:', error);
        return false;
    }
}

// Função para verificar histórico de mensagens
async function verificarHistorico(jid) {
    try {
        if (!globalSock || !store) return false;

        const msgs = await store.loadMessages(jid, 1);
        return msgs && msgs.length > 0;
    } catch (error) {
        console.error('Erro ao verificar histórico:', error);
        return false;
    }
}

// Função para arquivar todas as conversas existentes
async function arquivarTodasConversas() {
    try {
        if (!globalSock) {
            throw new Error('Socket não inicializado');
        }

        console.log('🔄 Iniciando arquivamento de todas as conversas...');

        const chats = await store.chats.all();
        console.log(`📝 Encontradas ${chats.length} conversas`);

        let arquivados = 0;

        for (const chat of chats) {
            const jid = chat.id;
            
            if (jid.endsWith('@g.us')) continue;

            try {
                await globalSock.chatModify({ archive: true }, jid);
                arquivados++;
                console.log(`✅ Chat ${jid} arquivado`);
            } catch (error) {
                console.error(`❌ Erro ao processar chat ${jid}:`, error);
            }
        }

        console.log(`
🎉 Processo finalizado:
- Total de conversas: ${chats.length}
- Arquivadas: ${arquivados}
`);

        return { total: chats.length, arquivados };
    } catch (error) {
        console.error('❌ Erro ao arquivar conversas:', error);
        throw error;
    }
}

// Exporta todas as funções necessárias
export {
    initializeWhatsApp,
    getGlobalSock,
    isWhatsAppConnected,
    enviarMensagemComDigitacao,
    sendMessage,
    verificarTagArquivado,
    verificarHistorico,
    arquivarTodasConversas,
    store
}; 