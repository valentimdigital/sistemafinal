import express from 'express';
import { listarConversas, buscarMensagens } from '../controllers/conversasController.js';

const router = express.Router();

// Rota para listar todas as conversas
router.get('/', listarConversas);

// Rota para buscar mensagens de uma conversa específica
router.get('/:contatoId/mensagens', buscarMensagens);

export default router; 