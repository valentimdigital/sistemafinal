import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { getAIResponse } from './gemini-service.js';
import connectDB from './config/database.js';
import Contato from './models/Contato.js';
import Mensagem from './models/Mensagem.js';
import contatosRouter from './routes/contatos.js';
import mensagensRouter from './routes/mensagens.js';
import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import io from './utils/io.js';

// Descobrir o caminho absoluto da raiz do projeto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

const app = express();
const server = http.createServer(app);

// Usar a instância do io que já foi criada
io.attach(server);

app.use(cors());
app.use(express.json());

// Rota de teste para verificar se o servidor está rodando
app.get('/', (req, res) => {
  res.send('Servidor rodando!');
});

// Rota para testar a integração com a IA
app.post('/test-ai', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Mensagem não fornecida' });
  }
  try {
    const response = await getAIResponse(message);
    res.json({ response });
  } catch (error) {
    console.error('Erro ao chamar IA:', error);
    res.status(500).json({ error: 'Erro ao processar a mensagem' });
  }
});

// Rota para forçar a geração do QR Code manualmente
app.get('/api/forcar-qr', (req, res) => {
  if (globalSock && globalSock.end) {
    globalSock.end(); // Força o Baileys a reiniciar e gerar um novo QR
    res.json({ ok: true, message: 'QR Code será gerado novamente.' });
  } else {
    res.status(500).json({ ok: false, message: 'Socket do WhatsApp não está inicializado.' });
  }
});

let globalSock = null; // Armazenar instância global do WhatsApp

// Configuração do Socket.IO para comunicação em tempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });

  // Exemplo de evento para processar mensagens via Socket.IO
  socket.on('message', async (data) => {
    console.log('Mensagem recebida:', data);
    try {
      const response = await getAIResponse(data.message);
      socket.emit('response', { response });
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      socket.emit('error', { error: 'Erro ao processar a mensagem' });
    }
  });

  // Handler para gerar novo QR Code
  socket.on('gerar-qr', async () => {
    if (globalSock && globalSock.isInit) {
      // Forçar reemissão do QR Code se possível
      if (globalSock?.ev?.buffer) {
        // Tenta emitir o último QR armazenado
        const lastQR = globalSock.lastQR;
        if (lastQR) {
          socket.emit('qr-code', { qr: lastQR });
        } else {
          // Não há QR armazenado, reinicia conexão
          globalSock.end();
        }
      } else {
        // Reinicia conexão para forçar novo QR
        globalSock.end();
      }
    }
  });
});

// Iniciar MongoDB antes do WhatsApp
connectDB();
// Iniciar WhatsApp
startWhatsApp();

app.use('/api/contatos', contatosRouter);
app.use('/api/mensagens', mensagensRouter);

async function startWhatsApp() {
    try {
        console.log('Iniciando conexão com WhatsApp...');
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        
        // Configuração mais robusta do Baileys
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

        // Melhor tratamento de eventos
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

        // Salvar credenciais quando atualizadas
        sock.ev.on('creds.update', saveCreds);

        // Mensagens recebidas do WhatsApp
        sock.ev.on('messages.upsert', async (m) => {
          console.log('\n================ NOVO EVENTO messages.upsert ================');
          if (m.messages) {
                for (const msg of m.messages) {
            if (!msg.key.fromMe) {
              const numero = msg.key.remoteJid.replace('@s.whatsapp.net', '');
              const nome = msg.pushName || numero;
              const idMensagem = msg.key.id;
                let conteudo = '';
                if (msg.message?.conversation) {
                  conteudo = msg.message.conversation;
                } else if (msg.message?.extendedTextMessage?.text) {
                  conteudo = msg.message.extendedTextMessage.text;
                } else if (msg.message?.imageMessage?.caption) {
                  conteudo = msg.message.imageMessage.caption;
                }
                const tipoMsg = conteudo ? 'text' : Object.keys(msg.message || {}).join(', ');
                console.log('--- Mensagem recebida ---');
                console.log('ID:', idMensagem);
                console.log('De:', numero);
                console.log('Nome:', nome);
                console.log('Tipo:', tipoMsg);
                console.log('Conteúdo:', conteudo);
                console.log('-------------------------');

                let avatar = '';
                try {
                  avatar = await sock.profilePictureUrl(msg.key.remoteJid, 'image');
                } catch (e) {
                  avatar = '';
                }

              // Salvar/atualizar contato
              let contato = await Contato.findOneAndUpdate(
                { numero },
                  { nome, avatar },
                { upsert: true, new: true }
              );
                console.log('[LOG] Contato salvo/atualizado:', contato);

                // Só salva mensagem se houver conteúdo
                if (conteudo && conteudo.trim() !== '') {
              const novaMensagem = new Mensagem({
                contato: contato._id,
                de: numero,
                para: 'me',
                conteudo,
                tipo: 'text',
                protocolo: contato.protocolo || '',
                metadados: { idMensagem }
              });
              await novaMensagem.save();
                  console.log('[LOG] Mensagem salva no MongoDB:', novaMensagem);

              // Emitir para o frontend
              io.emit('nova-mensagem', { contatoId: contato._id, mensagem: novaMensagem });
              io.emit('atualizar-contatos');
                  console.log('[LOG] Eventos emitidos para o frontend via Socket.IO');

                  // Verificar se a IA está ativa para este contato
                  if (contato.iaAtiva) {
                    console.log('[LOG IA] IA está ativa para este contato. Chamando Gemini...');
                    // === Resposta automática da IA Gemini com contexto ===
                    try {
                      // Buscar o histórico de conversa desse contato (últimas 100 mensagens)
                      const historico = await Mensagem.find({ contato: contato._id })
                        .sort({ createdAt: 1 })
                        .limit(100);
                      
                      // Formatar o contexto de forma mais clara
                      const contexto = `Histórico da conversa:\n\n${
                        historico.map(msg => {
                          const autor = msg.de === 'me' ? 'Valentina' : nome;
                          const timestamp = new Date(msg.createdAt).toLocaleString();
                          return `[${timestamp}] ${autor}: ${msg.conteudo}`;
                        }).join('\n')
                      }\n\nMensagem atual do cliente: ${conteudo}`;

                      console.log('[LOG IA] Contexto formatado para Gemini:', contexto);
                      const respostaIA = await getAIResponse(contexto);
                      console.log('[LOG IA] Resposta da Gemini:', respostaIA);
                      if (globalSock && globalSock.sendMessage) {
                        try {
                          // Simular "digitando" antes de responder
                          const tempoDigitando = Math.floor(Math.random() * (10000 - 2000 + 1)) + 2000; // entre 2 e 10 segundos
                          if (globalSock.sendPresenceUpdate) {
                            await globalSock.sendPresenceUpdate('composing', msg.key.remoteJid);
                            await new Promise(resolve => setTimeout(resolve, tempoDigitando));
                            await globalSock.sendPresenceUpdate('paused', msg.key.remoteJid);
                          }
                          // Agora envie a resposta normalmente
                          console.log('[LOG IA] Enviando resposta da IA para o WhatsApp...');
                          await globalSock.sendMessage(
                            msg.key.remoteJid,
                            { text: respostaIA }
                          );
                          console.log('[LOG] Resposta da IA enviada para o WhatsApp:', respostaIA);
                        } catch (err) {
                          console.error('[ERRO] Falha ao enviar resposta da IA para o WhatsApp:', err);
                        }

                        // Salvar resposta da IA no banco
                        const respostaMensagem = new Mensagem({
                          contato: contato._id,
                          de: 'me',
                          para: numero,
                          conteudo: respostaIA,
                          tipo: 'text',
                          protocolo: contato.protocolo || '',
                          metadados: { idMensagem: `ia-${idMensagem}` }
                        });
                        await respostaMensagem.save();
                        console.log('[LOG IA] Resposta da IA salva no MongoDB:', respostaMensagem);

                        // Emitir resposta da IA para o frontend
                        io.emit('nova-mensagem', { contatoId: contato._id, mensagem: respostaMensagem });
                        io.emit('atualizar-contatos');
                      }
                    } catch (err) {
                      console.error('[ERRO] Falha ao obter resposta da IA Gemini:', err);
                    }
                  } else {
                    console.log('[LOG] IA desativada para este contato');
                  }
                } else {
                  console.log('[LOG] Mensagem ignorada (sem conteúdo de texto).');
                }
                console.log('============================================================\n');
                    }
                }
            }
        });

        return sock;
    } catch (error) {
        console.error('Erro ao iniciar WhatsApp:', error);
        // Tenta reconectar após 5 segundos
        setTimeout(startWhatsApp, 5000);
    }
}

const PORT = process.env.PORT || 3001;

// Função para tentar iniciar o servidor em diferentes portas
async function startServer(port) {
    try {
        server.listen(port, () => {
            console.log(`Servidor rodando na porta ${port}`);
        });
    } catch (error) {
        if (error.code === 'EADDRINUSE') {
            console.log(`Porta ${port} em uso, tentando porta ${port + 1}...`);
            await startServer(port + 1);
        } else {
            console.error('Erro ao iniciar servidor:', error);
            process.exit(1);
        }
    }
}

// Iniciar o servidor
startServer(PORT);

export { globalSock, io }; 
