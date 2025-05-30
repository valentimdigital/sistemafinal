import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { initializeWhatsApp } from './whatsapp.js';
import dotenv from 'dotenv';
import vendasRoutes from './routes/vendas.js';
import contatosRoutes from './routes/contatos.js';
import mensagensRoutes from './routes/mensagens.js';
import analiseRoutes from './routes/analise.js';
import conversasRoutes from './routes/conversasRoutes.js';
import { httpServer, app } from './socket.js';

dotenv.config();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());

// Conexão com MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://valentina:9Gm8hzZdwIauxkRP@valentina.gdcrr.mongodb.net/valentina_db';

mongoose.connect(MONGO_URI)
.then(() => {
    console.log('✅ Conectado ao MongoDB Atlas');
})
.catch((error) => {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
});

// Eventos de conexão do MongoDB
mongoose.connection.on('error', (err) => {
    console.error('❌ Erro na conexão com MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Desconectado do MongoDB');
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ Reconectado ao MongoDB');
});

// Rotas
app.get('/', (req, res) => {
    res.send('API do WhatsApp Bot está funcionando!');
});

app.use('/api/vendas', vendasRoutes);
app.use('/api/contatos', contatosRoutes);
app.use('/api/mensagens', mensagensRoutes);
app.use('/api/analise', analiseRoutes);
app.use('/api/conversas', conversasRoutes);

// Inicialização do WhatsApp
initializeWhatsApp()
    .then(() => {
        console.log('✅ WhatsApp inicializado com sucesso');
    })
    .catch((error) => {
        console.error('❌ Erro ao inicializar WhatsApp:', error);
        process.exit(1);
    });

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Promessa rejeitada não tratada:', error);
});

// Iniciar servidor
const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
