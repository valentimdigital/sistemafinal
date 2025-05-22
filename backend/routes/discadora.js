const express = require('express');
const router = express.Router();
const ClienteDiscadora = require('../models/ClienteDiscadora');

// Listar todos os clientes
router.get('/clientes', async (req, res) => {
  try {
    const clientes = await ClienteDiscadora.find();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Buscar cliente por ID
router.get('/clientes/:id', async (req, res) => {
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

// Adicionar novo cliente
router.post('/clientes', async (req, res) => {
  const cliente = new ClienteDiscadora(req.body);
  try {
    const novoCliente = await cliente.save();
    res.status(201).json(novoCliente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Atualizar cliente
router.patch('/clientes/:id', async (req, res) => {
  try {
    const cliente = await ClienteDiscadora.findById(req.params.id);
    if (!cliente) return res.status(404).json({ message: 'Cliente não encontrado' });
    
    Object.assign(cliente, req.body);
    const clienteAtualizado = await cliente.save();
    res.json(clienteAtualizado);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Deletar cliente
router.delete('/clientes/:id', async (req, res) => {
  try {
    const cliente = await ClienteDiscadora.findById(req.params.id);
    if (!cliente) return res.status(404).json({ message: 'Cliente não encontrado' });
    
    await cliente.deleteOne();
    res.json({ message: 'Cliente deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Buscar clientes por status
router.get('/clientes/status/:status', async (req, res) => {
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