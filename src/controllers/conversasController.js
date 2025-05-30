import { store } from '../whatsapp.js';

export const listarConversas = async (req, res) => {
    try {
        // Busca todas as conversas do store do Baileys
        const chats = await store.chats.all();
        
        // Formata as conversas para o formato esperado pelo frontend
        const conversasFormatadas = chats.map(chat => {
            const messages = store.messages[chat.id] || [];
            const ultimaMensagem = messages[messages.length - 1];
            
            return {
                _id: chat.id,
                nome: chat.name || chat.id.split('@')[0],
                numero: chat.id.split('@')[0],
                ultimaMensagem: ultimaMensagem ? {
                    conteudo: ultimaMensagem.message?.conversation || 'Mídia',
                    data: new Date(ultimaMensagem.messageTimestamp * 1000),
                    status: ultimaMensagem.status || 'received'
                } : null,
                naoLidas: chat.unreadCount || 0,
                arquivado: chat.archive || false,
                tags: chat.tags || []
            };
        });

        // Filtra apenas conversas de contatos (não grupos)
        const conversasContatos = conversasFormatadas.filter(chat => !chat._id.endsWith('@g.us'));

        res.json({
            success: true,
            conversas: conversasContatos
        });
    } catch (error) {
        console.error('Erro ao listar conversas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar conversas'
        });
    }
};

export const buscarMensagens = async (req, res) => {
    try {
        const { contatoId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        
        // Busca mensagens do contato no store do Baileys
        const messages = store.messages[contatoId] || [];
        
        // Ordena mensagens por data (mais recentes primeiro)
        const mensagensOrdenadas = messages.sort((a, b) => b.messageTimestamp - a.messageTimestamp);
        
        // Aplica paginação
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const mensagensPaginadas = mensagensOrdenadas.slice(startIndex, endIndex);
        
        // Formata mensagens para o formato esperado pelo frontend
        const mensagensFormatadas = mensagensPaginadas.map(msg => ({
            _id: msg.key.id,
            contato: contatoId,
            de: msg.key.fromMe ? 'bot' : contatoId,
            para: msg.key.fromMe ? contatoId : 'bot',
            conteudo: msg.message?.conversation || 'Mídia',
            tipo: 'text',
            status: msg.status || 'received',
            data: new Date(msg.messageTimestamp * 1000),
            createdAt: new Date(msg.messageTimestamp * 1000),
            updatedAt: new Date(msg.messageTimestamp * 1000)
        }));

        res.json({
            success: true,
            mensagens: mensagensFormatadas,
            hasMore: endIndex < messages.length
        });
    } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar mensagens'
        });
    }
}; 