const express = require('express');
const router = express.Router();
const ClienteDiscadora = require('../models/ClienteDiscadora');
const auth = require('../middleware/auth');

// Listar todos os clientes
router.get('/clientes', auth, async (req, res) => {
  try {
    const clientes = await ClienteDiscadora.find()
      .populate('atendente', 'nome')
      .sort({ dataCadastro: -1 });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Buscar cliente por ID
router.get('/clientes/:id', auth, async (req, res) => {
  try {
    const cliente = await ClienteDiscadora.findById(req.params.id)
      .populate('atendente', 'nome')
      .populate('historicoAtendimentos.atendente', 'nome');
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Criar novo cliente
router.post('/clientes', auth, async (req, res) => {
  const cliente = new ClienteDiscadora({
    nome: req.body.nome,
    telefone: req.body.telefone,
    observacoes: req.body.observacoes,
    atendente: req.user._id
  });

  try {
    const novoCliente = await cliente.save();
    res.status(201).json(novoCliente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Atualizar cliente
router.patch('/clientes/:id', auth, async (req, res) => {
  try {
    const cliente = await ClienteDiscadora.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Atualiza campos básicos
    if (req.body.nome) cliente.nome = req.body.nome;
    if (req.body.telefone) cliente.telefone = req.body.telefone;
    if (req.body.observacoes) cliente.observacoes = req.body.observacoes;
    if (req.body.status) cliente.status = req.body.status;

    // Adiciona ao histórico se houver mudança de status
    if (req.body.status && req.body.status !== cliente.status) {
      cliente.historicoAtendimentos.push({
        status: req.body.status,
        observacao: req.body.observacao || 'Status atualizado',
        atendente: req.user._id
      });
    }

    cliente.ultimaAtualizacao = Date.now();
    const clienteAtualizado = await cliente.save();
    res.json(clienteAtualizado);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Deletar cliente
router.delete('/clientes/:id', auth, async (req, res) => {
  try {
    const cliente = await ClienteDiscadora.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    await cliente.remove();
    res.json({ message: 'Cliente removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Buscar clientes por status
router.get('/clientes/status/:status', auth, async (req, res) => {
  try {
    const clientes = await ClienteDiscadora.find({ status: req.params.status })
      .populate('atendente', 'nome')
      .sort({ dataCadastro: -1 });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 