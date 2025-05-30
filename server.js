import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import pkg from '@whiskeysockets/baileys';
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion
} = pkg;

import P from 'pino';
import dotenv from 'dotenv';
import { configurarRelatoriosAutomaticos } from './src/utils/relatoriosAutomaticos.js';
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// String de conexão do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://valentina:Q3zbZeyl9uBEBXSa@valentina.gdcrr.mongodb.net/?retryWrites=true&w=majority&appName=valentina';

// Conexão com MongoDB Atlas
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB Atlas');
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao MongoDB:', err);
  });

// Configuração do Baileys
const startWhatsApp = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    browser: ['Valentim', 'Chrome', '1.0'],
    logger: P({ level: 'info' })
  });

  sock.ev.on('creds.update', saveCreds);
  
  return sock;
};

const sock = await startWhatsApp();

// Configurar relatórios automáticos
configurarRelatoriosAutomaticos(async (destinatario, mensagem) => {
    try {
        if (!destinatario) {
            console.error('❌ Destinatário não fornecido');
            return;
        }
        
        await sock.sendMessage(destinatario, { text: mensagem });
        console.log('✅ Relatório enviado com sucesso para:', destinatario);
    } catch (error) {
        console.error('❌ Erro ao enviar relatório:', error);
    }
});

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/atendimentos', require('./routes/atendimentos'));
app.use('/api/discadora', require('./routes/discadora'));
app.use('/api/analise', require('./routes/analise'));
app.use('/api/contatos', require('./routes/contatos'));
app.use('/api/vendas', require('./routes/vendas'));

// Configuração do Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configurar eventos do Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Emitir atualizações periódicas para o dashboard
  const intervalId = setInterval(async () => {
    try {
      // Emitir estatísticas
      const estatisticas = await require('./routes/analise').getEstatisticas();
      socket.emit('atualizar-estatisticas', estatisticas);

      // Emitir contatos
      const contatos = await require('./routes/contatos').getContatos();
      socket.emit('atualizar-contatos', contatos);

      // Emitir vendas
      const vendas = await require('./routes/vendas').getVendas();
      socket.emit('atualizar-vendas', vendas);
    } catch (error) {
      console.error('Erro ao emitir atualizações:', error);
    }
  }, 5000);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
    clearInterval(intervalId);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 