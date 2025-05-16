import express from 'express';
import Contato from '../models/Contato.js';
import io from '../utils/io.js';

const router = express.Router();

// Listar todos os contatos
router.get('/', async (req, res) => {
  try {
    const contatos = await Contato.find().sort({ updatedAt: -1 });
    res.json(contatos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar contatos' });
  }
});

// Criar novo contato
router.post('/', async (req, res) => {
  try {
    const contato = new Contato(req.body);
    await contato.save();
    res.status(201).json(contato);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar contato', details: error.message });
  }
});

// Rota para alternar o estado da IA
router.patch('/:id/toggle-ia', async (req, res) => {
  try {
    const contato = await Contato.findById(req.params.id);
    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }
    
    contato.iaAtiva = !contato.iaAtiva;
    await contato.save();
    
    // Emitir evento para atualizar o frontend
    if (io) {
      io.emit('atualizar-contatos');
    }
    
    res.json(contato);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao alternar estado da IA', details: error.message });
  }
});

// Atualizar atendente do contato
router.patch('/:id/atendente', async (req, res) => {
  try {
    const { atendente } = req.body;
    const contato = await Contato.findByIdAndUpdate(
      req.params.id,
      { atendente },
      { new: true }
    );
    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }
    // Emitir evento para atualizar o frontend
    if (io) {
      io.emit('atualizar-contatos');
    }
    res.json(contato);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar atendente', details: error.message });
  }
});

// Listar comentários de um contato
router.get('/:id/comentarios', async (req, res) => {
  try {
    const contato = await Contato.findById(req.params.id);
    if (!contato) return res.status(404).json({ error: 'Contato não encontrado' });
    res.json(contato.comentarios || []);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao buscar comentários', details: error.message });
  }
});

// Adicionar comentário a um contato
router.post('/:id/comentarios', async (req, res) => {
  try {
    const { texto, autor } = req.body;
    if (!texto) return res.status(400).json({ error: 'Texto do comentário é obrigatório' });
    const contato = await Contato.findById(req.params.id);
    if (!contato) return res.status(404).json({ error: 'Contato não encontrado' });
    contato.comentarios.push({ texto, autor });
    await contato.save();
    // Emitir evento para atualizar o frontend
    if (io) io.emit('atualizar-contatos');
    res.status(201).json(contato.comentarios[contato.comentarios.length - 1]);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao adicionar comentário', details: error.message });
  }
});

export default router; 