import express from 'express';
import Mensagem from '../models/Mensagem.js';
import Contato from '../models/Contato.js';

// Importar a instância globalSock do index.js
import { globalSock, io } from '../index.js';

const router = express.Router();

// Buscar histórico de mensagens de um contato
router.get('/:contatoId', async (req, res) => {
  try {
    const mensagens = await Mensagem.find({ contato: req.params.contatoId }).sort({ createdAt: 1 });
    res.json(mensagens);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// Enviar mensagem (salvar no banco e enviar para o WhatsApp)
router.post('/', async (req, res) => {
  try {
    const { contatoId, de, para, conteudo, tipo, protocolo } = req.body;
    const contato = await Contato.findById(contatoId);
    if (!contato) return res.status(404).json({ error: 'Contato não encontrado' });
    const mensagem = new Mensagem({ contato: contatoId, de, para, conteudo, tipo, protocolo });
    await mensagem.save();

    // Enviar mensagem para o WhatsApp
    if (globalSock && globalSock.sendMessage) {
      await globalSock.sendMessage(para.includes('@s.whatsapp.net') ? para : `${para}@s.whatsapp.net`, { text: conteudo });
    }

    // Emitir para o frontend
    if (io) {
      io.emit('nova-mensagem', { contatoId, mensagem });
      io.emit('atualizar-contatos');
    }

    res.status(201).json(mensagem);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao enviar mensagem', details: error.message });
  }
});

export default router; 