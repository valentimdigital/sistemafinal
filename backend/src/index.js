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
import { startWhatsApp } from './whatsapp.js';

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
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
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
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
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

// Iniciar WhatsApp
startWhatsApp();

// Iniciar servidor
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export { globalSock, io }; 
