import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import dotenv from 'dotenv';
import { getGlobalSock, enviarMensagemComDigitacao } from './whatsapp.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:5173'],
        methods: ['GET', 'POST'],
        credentials: true,
        transports: ['websocket', 'polling']
    },
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

// Middleware para CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Eventos do Socket.IO
io.on('connection', (socket) => {
    console.log('👤 Cliente conectado:', socket.id);

    // Evento para enviar mensagem
    socket.on('enviar-mensagem', async (data) => {
        try {
            const { jid, mensagem } = data;
            const whatsapp = getGlobalSock();
            
            if (!whatsapp) {
                socket.emit('erro', { message: 'WhatsApp não está conectado' });
                return;
            }

            await enviarMensagemComDigitacao(jid, mensagem);
            socket.emit('mensagem-enviada', { success: true });
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            socket.emit('erro', { message: 'Erro ao enviar mensagem' });
        }
    });

    // Evento para verificar status da conexão
    socket.on('verificar-conexao', () => {
        const whatsapp = getGlobalSock();
        socket.emit('status-conexao', {
            conectado: whatsapp && whatsapp.user && whatsapp.user.id ? true : false
        });
    });

    socket.on('disconnect', () => {
        console.log('👤 Cliente desconectado:', socket.id);
    });
});

export { io, httpServer, app }; 