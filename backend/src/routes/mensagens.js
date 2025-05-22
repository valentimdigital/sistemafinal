import express from 'express';
import Mensagem from '../models/Mensagem.js';
import Contato from '../models/Contato.js';
import { io } from '../index.js';
import { getGlobalSock, isWhatsAppConnected, sendWhatsAppMessage } from '../whatsapp.js';

const router = express.Router();

// Buscar histórico de mensagens de um contato
router.get('/:contatoId', async (req, res) => {
  console.log(`[Backend - Mensagens] Recebida requisição GET para contatoId: ${req.params.contatoId}`);
  try {
    const mensagens = await Mensagem.find({ contato: req.params.contatoId })
      .sort({ createdAt: 1 });
    console.log(`[Backend - Mensagens] Encontradas ${mensagens.length} mensagens para ${req.params.contatoId}`);
    res.json(mensagens);
  } catch (error) {
    console.error('[Backend - Mensagens] Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// Enviar mensagem (salvar no banco e enviar para o WhatsApp)
router.post('/', async (req, res) => {
  const { contatoId, de, para, conteudo, tipo } = req.body;
  console.log('[Backend - Mensagens] Recebendo requisição POST para enviar mensagem:', { contatoId, de, para, conteudo, tipo });
  
  try {
    
    if (!contatoId || !de || !para || !conteudo) {
      console.log('[Backend - Mensagens] Dados incompletos:', { contatoId, de, para, conteudo });
      return res.status(400).json({ error: 'Dados incompletos para enviar mensagem' });
    }

    // Buscar contato
    const contato = await Contato.findById(contatoId);
    if (!contato) {
      console.log('[Backend - Mensagens] Contato não encontrado:', contatoId);
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    // Verificar conexão do WhatsApp
    if (!isWhatsAppConnected()) {
      console.log('[Backend - Mensagens] WhatsApp não está conectado');
      return res.status(503).json({ error: 'WhatsApp não está conectado. Por favor, escaneie o QR Code novamente.' });
    }

    // Salvar mensagem no banco
    const mensagem = new Mensagem({
      contato: contatoId,
      de,
      para,
      conteudo,
      tipo: tipo || 'text',
      status: 'sending',
      data: new Date()
    });

    try {
      await mensagem.save();
      console.log('[Backend - Mensagens] Mensagem salva no banco:', mensagem._id);

      // Enviar mensagem para o WhatsApp
      console.log('[Backend - Mensagens] Tentando enviar mensagem para:', para);
      const result = await sendWhatsAppMessage(para, conteudo);
      console.log('[Backend - Mensagens] Resultado do envio Baileys:', result);

      // Atualizar status da mensagem
      mensagem.status = 'sent';
      await mensagem.save();
      console.log('[Backend - Mensagens] Status da mensagem atualizado para sent');

      // Emitir para o frontend
      if (io) {
        io.emit('nova-mensagem', { contatoId, mensagem });
        console.log('[Backend - Mensagens] Nova mensagem emitida para o frontend via Socket.IO');
      }

      res.status(201).json(mensagem);
    } catch (whatsappError) {
      console.error('[Backend - Mensagens] Erro ao enviar para WhatsApp via Baileys:', whatsappError);
      mensagem.status = 'error';
      await mensagem.save();
      console.log('[Backend - Mensagens] Status da mensagem atualizado para error');
      res.status(500).json({ 
        error: 'Erro ao enviar para WhatsApp', 
        details: whatsappError.message,
        status: 'error'
      });
    }
  } catch (error) {
    console.error('[Backend - Mensagens] Erro geral na rota POST /mensagens:', error);
    res.status(400).json({ 
      error: 'Erro ao enviar mensagem', 
      details: error.message,
      status: 'error'
    });
  }
});

export default router; 