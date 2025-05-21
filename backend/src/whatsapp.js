 import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { io } from './index.js';
import { getAIResponse } from './gemini-service.js';
import Contato from './models/Contato.js';
import Mensagem from './models/Mensagem.js';

let globalSock = null;

async function startWhatsApp() {
    try {
        console.log('Iniciando conexão com WhatsApp...');
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        
        const sock = makeWASocket({ 
            auth: state,
            printQRInTerminal: true,
            browser: ['Valentina IA', 'Chrome', '1.0.0'],
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            emitOwnEvents: true,
            markOnlineOnConnect: true
        });
        
        globalSock = sock;
        sock.isInit = true;

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            console.log('Status da conexão:', connection);
            
            if (qr) {
                console.log('QR Code recebido');
                io.emit('qr-code', { qr });
            }
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                console.log('Conexão fechada devido a:', lastDisconnect?.error);
                if (shouldReconnect) {
                    console.log('Tentando reconectar...');
                    startWhatsApp();
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async (m) => {
            if (m.messages) {
                for (const msg of m.messages) {
                    if (!msg.key.fromMe) {
                        const numero = msg.key.remoteJid.replace('@s.whatsapp.net', '');
                        const nome = msg.pushName || numero;
                        let conteudo = '';
                        
                        if (msg.message?.conversation) {
                            conteudo = msg.message.conversation;
                        } else if (msg.message?.extendedTextMessage?.text) {
                            conteudo = msg.message.extendedTextMessage.text;
                        } else if (msg.message?.imageMessage?.caption) {
                            conteudo = msg.message.imageMessage.caption;
                        }

                        if (conteudo && conteudo.trim() !== '') {
                            let contato = await Contato.findOneAndUpdate(
                                { numero },
                                { nome },
                                { upsert: true, new: true }
                            );

                            const novaMensagem = new Mensagem({
                                contato: contato._id,
                                de: numero,
                                para: 'me',
                                conteudo,
                                tipo: 'text',
                                protocolo: contato.protocolo || ''
                            });

                            await novaMensagem.save();
                            io.emit('nova-mensagem', { contatoId: contato._id, mensagem: novaMensagem });
                            io.emit('atualizar-contatos');

                            if (contato.iaAtiva) {
                                try {
                                    const historico = await Mensagem.find({ contato: contato._id })
                                        .sort({ createdAt: 1 })
                                        .limit(100);
                                    
                                    const contexto = `Histórico da conversa:\n\n${
                                        historico.map(msg => {
                                            const autor = msg.de === 'me' ? 'Valentina' : nome;
                                            return `${autor}: ${msg.conteudo}`;
                                        }).join('\n')
                                    }\n\nMensagem atual do cliente: ${conteudo}`;

                                    const respostaIA = await getAIResponse(contexto);
                                    
                                    if (globalSock && globalSock.sendMessage) {
                                        await globalSock.sendMessage(
                                            msg.key.remoteJid,
                                            { text: respostaIA }
                                        );

                                        const respostaMensagem = new Mensagem({
                                            contato: contato._id,
                                            de: 'me',
                                            para: numero,
                                            conteudo: respostaIA,
                                            tipo: 'text',
                                            protocolo: contato.protocolo || ''
                                        });

                                        await respostaMensagem.save();
                                        io.emit('nova-mensagem', { contatoId: contato._id, mensagem: respostaMensagem });
                                        io.emit('atualizar-contatos');
                                    }
                                } catch (err) {
                                    console.error('Erro ao processar resposta da IA:', err);
                                }
                            }
                        }
                    }
                }
            }
        });

        return sock;
    } catch (error) {
        console.error('Erro ao iniciar WhatsApp:', error);
        setTimeout(startWhatsApp, 5000);
    }
}

export { startWhatsApp, globalSock }; 