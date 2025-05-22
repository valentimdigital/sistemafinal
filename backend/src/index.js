import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';
import vendasRoutes from './routes/vendas.js';
import contatosRoutes from './routes/contatos.js';
import mensagensRoutes from './routes/mensagens.js';
import analiseRoutes from './routes/analise.js';
import { getAIResponse } from './gemini-service.js';
import connectDB from './config/database.js';
import Contato from './models/Contato.js';
import Mensagem from './models/Mensagem.js';
import { makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import path from 'path';
import { fileURLToPath } from 'url';
import { startWhatsApp, getGlobalSock } from './whatsapp.js';

// Descobrir o caminho absoluto da raiz do projeto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

const app = express();
const httpServer = createServer(app);

// Configurações de performance
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração do CORS
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Compressão e cache
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=30');
  next();
});

// Conexão otimizada com MongoDB
mongoose.connect('mongodb+srv://discadoralivia:gHgsZuSTzUt5q3My@discadora.z7gzzrc.mongodb.net/?retryWrites=true&w=majority&appName=discadora', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB conectado com sucesso!'))
.catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Rotas
app.use('/api/vendas', vendasRoutes);
app.use('/api/contatos', contatosRoutes);
app.use('/api/mensagens', mensagensRoutes);
app.use('/api/analise', analiseRoutes);

// Socket.IO com configurações otimizadas
const io = new Server(httpServer, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 100 * 1024 * 1024,
  connectTimeout: 45000,
  allowEIO3: true,
  perMessageDeflate: {
    threshold: 2048
  }
});

// Gerenciamento de conexões Socket.IO
const connectedClients = new Set();

io.on('connection', (socket) => {
  connectedClients.add(socket.id);
  console.log(`Cliente conectado: ${socket.id}`);

  socket.on('disconnect', () => {
    connectedClients.delete(socket.id);
    console.log(`Cliente desconectado: ${socket.id}`);
  });

  // Evento para processar mensagens via Socket.IO
  socket.on('message', async (data) => {
    console.log('Mensagem recebida:', data);
    try {
      if (!isAIActive) {
        console.log('IA está desativada, ignorando mensagem');
        socket.emit('response', { 
          error: 'IA está desativada',
          isActive: false 
        });
        return;
      }

      const response = await getAIResponse(data.message);
      
      // Salvar mensagem da IA no banco
      const mensagem = new Mensagem({
        contato: data.contatoId,
        de: 'IA',
        para: data.contatoNumero,
        conteudo: response,
        tipo: 'text',
        status: 'sent'
      });
      await mensagem.save();

      // Emitir para todos os clientes
      io.emit('nova-mensagem', { 
        contatoId: data.contatoId,
        mensagem 
      });

      socket.emit('response', { 
        response,
        isActive: true 
      });
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      socket.emit('error', { 
        error: 'Erro ao processar a mensagem',
        isActive: isAIActive 
      });
    }
  });

  // Handler para gerar novo QR Code
  socket.on('gerar-qr', async () => {
    if (globalSock && globalSock.isInit) {
      if (globalSock?.ev?.buffer) {
        const lastQR = globalSock.lastQR;
        if (lastQR) {
          socket.emit('qr-code', { qr: lastQR });
        } else {
          globalSock.end();
        }
      } else {
        globalSock.end();
      }
    }
  });
});

let globalSock = null;
let isAIActive = false; // Estado global para controlar se a IA está ativa

// Iniciar WhatsApp
startWhatsApp();

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
});

// Adicionar rota para controlar o estado da IA
app.post('/api/ia/toggle', (req, res) => {
  isAIActive = !isAIActive;
  console.log('Estado da IA alterado:', isAIActive);
  io.emit('ia-status-changed', { isActive: isAIActive });
  res.json({ isActive: isAIActive });
});

app.get('/api/ia/status', (req, res) => {
  res.json({ isActive: isAIActive });
});

// Cache para mensagens
const mensagensCache = new Map();

// Rota otimizada para buscar mensagens
app.get('/api/mensagens/:contatoId', async (req, res) => {
  const { contatoId } = req.params;
  
  // Verificar cache
  if (mensagensCache.has(contatoId)) {
    const cachedData = mensagensCache.get(contatoId);
    if (Date.now() - cachedData.timestamp < 30000) { // 30 segundos
      return res.json(cachedData.mensagens);
    }
  }

  try {
    const mensagens = await Mensagem.find({ contato: contatoId })
      .sort({ createdAt: 1 })
      .lean();

    // Atualizar cache
    mensagensCache.set(contatoId, {
      mensagens,
      timestamp: Date.now()
    });

    res.json(mensagens);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// Limpar cache periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of mensagensCache.entries()) {
    if (now - value.timestamp > 300000) { // 5 minutos
      mensagensCache.delete(key);
    }
  }
}, 300000);

export { io, isAIActive }; 
