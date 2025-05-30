import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { io } from './index.js';
import { getAIResponse } from './gemini-service.js';
import Contato from './models/Contato.js';
import Mensagem from './models/Mensagem.js';
import { Boom } from '@hapi/boom';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let globalSock = null;

// Função para iniciar o WhatsApp
const startWhatsApp = async () => {
    try {
        console.log('Iniciando conexão com WhatsApp...');
        const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, '../auth_info_baileys'));
        
        const sock = makeWASocket({
            printQRInTerminal: true,
            auth: state,
            defaultQueryTimeoutMs: undefined,
        });
        
        globalSock = sock;
        sock.isInit = true;
        console.log('Socket WhatsApp inicializado:', !!globalSock);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            console.log('Status da conexão:', connection);
            
            if (qr) {
                console.log('QR Code gerado');
                io.emit('qr-code', { qr });
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('Conexão fechada devido a:', lastDisconnect?.error);
                if (shouldReconnect) {
                    console.log('Tentando reconectar...');
                    startWhatsApp();
                }
            } else if (connection === 'open') {
                console.log('WhatsApp conectado!');
                io.emit('connection-status', { status: 'connected' });
                // Verificar se o socket está funcionando
                try {
                    const status = await sock.fetchStatus();
                    console.log('Status do WhatsApp:', status);
                } catch (error) {
                    console.error('Erro ao verificar status:', error);
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async (m) => {
            console.log('[Backend - WhatsApp] Evento messages.upsert recebido');
            if (m.type === 'notify') {
                for (const msg of m.messages) {
                    if (!msg.key.fromMe && msg.message) {
                        try {
                            const sender = msg.key.remoteJid;
                            console.log('[Backend - WhatsApp] Mensagem recebida de:', sender);
                            const numero = sender.replace('@s.whatsapp.net', '');
                            const nome = msg.pushName || numero;
                            const messageContent = msg.message?.conversation || 
                                                 msg.message?.extendedTextMessage?.text || 
                                                 'Mensagem não suportada';

                            console.log('[Backend - WhatsApp] Processando mensagem:', { numero, nome, messageContent });

                            // Buscar ou criar contato
                            let contato = await Contato.findOneAndUpdate(
                                { numero },
                                { nome },
                                { upsert: true, new: true }
                            );
                            console.log('[Backend - WhatsApp] Contato encontrado/criado:', contato._id);

                            // Salvar mensagem no banco
                            const novaMensagem = new Mensagem({
                                contato: contato._id,
                                de: numero,
                                para: 'atendente',
                                conteudo: messageContent,
                                tipo: 'text',
                                status: 'received',
                                data: new Date()
                            });

                            try {
                                await novaMensagem.save();
                                console.log('[Backend - WhatsApp] Mensagem salva no banco:', novaMensagem._id);

                                // Emitir para o frontend
                                if (io) {
                                    io.emit('nova-mensagem', { 
                                        contatoId: contato._id, 
                                        mensagem: novaMensagem 
                                    });
                                    console.log('[Backend - WhatsApp] Nova mensagem emitida para o frontend via Socket.IO');
                                }

                                // Se a IA estiver ativa, processar resposta
                                const { isAIActive: globalAIStatus } = await import('./index.js');
                                if (globalAIStatus) {
                                    console.log('[Backend - WhatsApp] IA está ativa globalmente. Processando resposta para:', numero);
                                    try {
                                        const respostaIA = await getAIResponse(messageContent);
                                        console.log('[Backend - WhatsApp] Resposta da IA gerada:', respostaIA);
                                        
                                        // Enviar resposta via WhatsApp
                                        console.log('[Backend - WhatsApp] Enviando resposta da IA para:', sender);
                                        await sock.sendMessage(sender, { text: respostaIA });
                                        console.log('[Backend - WhatsApp] Resposta da IA enviada com sucesso');

                                        // Salvar resposta no banco
                                        const respostaMensagem = new Mensagem({
                                            contato: contato._id,
                                            de: 'IA',
                                            para: numero,
                                            conteudo: respostaIA,
                                            tipo: 'text',
                                            status: 'sent',
                                            data: new Date()
                                        });
                                        await respostaMensagem.save();
                                        console.log('[Backend - WhatsApp] Resposta da IA salva no banco:', respostaMensagem._id);

                                        // Emitir resposta para o frontend
                                        if (io) {
                                            io.emit('nova-mensagem', { 
                                                contatoId: contato._id, 
                                                mensagem: respostaMensagem 
                                            });
                                            console.log('[Backend - WhatsApp] Resposta da IA emitida para o frontend');
                                        }
                                    } catch (error) {
                                        console.error('[Backend - WhatsApp] Erro ao processar resposta da IA:', error);
                                    }
                                }
                            } catch (error) {
                                console.error('[Backend - WhatsApp] Erro ao salvar mensagem recebida:', error);
                            }
                        } catch (error) {
                            console.error('[Backend - WhatsApp] Erro ao processar mensagem recebida:', error);
                        }
                    }
                }
            }
        });

        sock.ev.on('messages.update', async (updates) => {
            for (const update of updates) {
                console.log('Atualização de mensagem:', update);
                if (update.status) {
                    console.log('Status da mensagem atualizado:', update.status);
                    if (io) {
                        io.emit('mensagem-status', {
                            id: update.key.id,
                            status: update.status
                        });
                    }
                }
            }
        });

        // Adicionar listener para erros
        sock.ev.on('error', (error) => {
            console.error('Erro no socket do WhatsApp:', error);
        });

        return sock;
    } catch (error) {
        console.error('Erro ao iniciar WhatsApp:', error);
        setTimeout(startWhatsApp, 5000);
    }
};

// Exportar globalSock como um objeto que pode ser modificado
const getGlobalSock = () => {
    if (!globalSock) {
        console.log('Socket não disponível');
        return null;
    }
    if (!globalSock.user) {
        console.log('Usuário não autenticado');
        return null;
    }
    return globalSock;
};

// Função para verificar se o WhatsApp está conectado
const isWhatsAppConnected = () => {
    if (!globalSock) {
        console.log('Socket não inicializado');
        return false;
    }
    if (!globalSock.user) {
        console.log('Usuário não autenticado');
        return false;
    }
    return true;
};

// Função para enviar mensagem
const sendWhatsAppMessage = async (numero, mensagem) => {
    try {
        const sock = getGlobalSock();
        if (!sock) {
            throw new Error('Socket do WhatsApp não disponível');
        }

        const numeroFormatado = numero.includes('@s.whatsapp.net') ? numero : `${numero}@s.whatsapp.net`;
        console.log('Enviando mensagem para:', numeroFormatado);
        
        const result = await sock.sendMessage(numeroFormatado, { text: mensagem });
        console.log('Mensagem enviada com sucesso:', result);
        
        return result;
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw error;
    }
};

// Exportar todas as funções necessárias
export { startWhatsApp, getGlobalSock, isWhatsAppConnected, sendWhatsAppMessage }; 