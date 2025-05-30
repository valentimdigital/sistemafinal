import express from 'express';
import Mensagem from '../models/Mensagem.js';
import Contato from '../models/Contato.js';
import { io } from '../socket.js';
import { getGlobalSock, isWhatsAppConnected, sendMessage } from '../whatsapp.js';

const router = express.Router();

// Buscar histórico de mensagens de um contato
router.get('/:contatoId', async (req, res) => {
  console.log(`[Backend - Mensagens] Recebida requisição GET para contatoId: ${req.params.contatoId}`);
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    console.log(`[Backend - Mensagens] Paginação: page=${page}, limit=${limit}, skip=${skip}`);

    // Verificar se o contato existe
    const contato = await Contato.findById(req.params.contatoId);
    if (!contato) {
      console.log(`[Backend - Mensagens] Contato não encontrado: ${req.params.contatoId}`);
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    // Buscar mensagens
    const mensagens = await Mensagem.find({ contato: req.params.contatoId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const total = await Mensagem.countDocuments({ contato: req.params.contatoId });

    console.log(`[Backend - Mensagens] Encontradas ${mensagens.length} mensagens antes de formatar. Total: ${total}`);
    console.log('[Backend - Mensagens] Amostra das mensagens brutas (primeiras 5):', mensagens.slice(0, 5));
    
    // Transformar os dados para o formato esperado pelo frontend
    const mensagensFormatadas = mensagens.map(msg => {
      // Garantir que todos os campos necessários existam e formatar _id
      const mensagemFormatada = {
        _id: msg._id?.toString() || '',
        contato: msg.contato?.toString() || '',
        de: msg.de || '',
        para: msg.para || '',
        conteudo: msg.conteudo || '',
        tipo: msg.tipo || 'text',
        status: msg.status || 'sending',
        data: msg.data || msg.createdAt || new Date(),
        createdAt: msg.createdAt || msg.data || new Date(),
        updatedAt: msg.updatedAt || new Date(),
        metadados: msg.metadados || {}
      };

      // Validar campos obrigatórios
      if (!mensagemFormatada._id || !mensagemFormatada.conteudo || !mensagemFormatada.de || !mensagemFormatada.para) {
        console.warn('[Backend - Mensagens] Mensagem inválida encontrada (formatação):', msg);
        return null;
      }

      return mensagemFormatada;
    }).filter(Boolean); // Remover mensagens inválidas

    console.log('[Backend - Mensagens] Total de mensagens formatadas e válidas:', mensagensFormatadas.length);
    
    // Garantir que mensagens é um array
    const mensagensArray = Array.isArray(mensagensFormatadas) ? mensagensFormatadas : [];
    
    const response = {
      mensagens: mensagensArray.reverse(), // Reverter para ordem cronológica
      hasMore: skip + mensagensArray.length < total,
      total,
      page,
      limit
    };

    console.log('[Backend - Mensagens] Resposta final formatada (estrutura):', {
      totalMensagensRetornadas: response.mensagens.length,
      hasMore: response.hasMore,
      totalRegistrosBanco: response.total,
      paginaAtual: response.page,
      limitePorPagina: response.limit
    });

    res.json(response);
  } catch (error) {
    console.error('[Backend - Mensagens] Erro CRÍTICO na rota GET /mensagens/:contatoId:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar mensagens',
      details: error.message,
      stack: error.stack // Incluir stack trace para debug
    });
  }
});

// Enviar mensagem (salvar no banco e enviar para o WhatsApp)
router.post('/', async (req, res) => {
  const { contatoId, de, para, conteudo, tipo } = req.body;
  console.log('[Backend - Mensagens] Recebendo requisição POST para enviar mensagem:', { contatoId, de, para, conteudo: conteudo?.substring(0, 50) + '...', tipo });
  
  let mensagemSalva = null;

  try {
    // 1. Validar dados de entrada
    if (!contatoId || !de || !para || !conteudo) {
      console.log('[Backend - Mensagens] Dados incompletos:', { contatoId: !!contatoId, de: !!de, para: !!para, conteudo: !!conteudo });
      return res.status(400).json({ error: 'Dados incompletos para enviar mensagem' });
    }

    // 2. Buscar contato
    const contato = await Contato.findById(contatoId);
    if (!contato) {
      console.log('[Backend - Mensagens] Contato não encontrado:', contatoId);
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    // 3. Verificar conexão do WhatsApp
    if (!isWhatsAppConnected()) {
      console.log('[Backend - Mensagens] WhatsApp não está conectado');
      return res.status(503).json({ error: 'WhatsApp não está conectado. Por favor, escaneie o QR Code novamente.' });
    }

    // 4. Salvar mensagem no banco com status 'sending'
    mensagemSalva = new Mensagem({
      contato: contatoId,
      de,
      para,
      conteudo,
      tipo: tipo || 'text',
      status: 'sending',
      data: new Date()
    });

    await mensagemSalva.save();
    console.log('[Backend - Mensagens] Mensagem salva no banco com status sending:', mensagemSalva._id);

    // 5. Enviar mensagem para o WhatsApp
    console.log('[Backend - Mensagens] Tentando enviar mensagem para WhatsApp via Baileys para:', para);
    const sendResult = await sendMessage(para, { text: conteudo });
    
    if (sendResult && sendResult.key && sendResult.key.id) {
      // 6. Atualizar mensagem com o ID do Baileys
      mensagemSalva.metadados = { 
        ...mensagemSalva.metadados, 
        baileysId: sendResult.key.id 
      };
      mensagemSalva.status = 'sent';
      await mensagemSalva.save();
      
      console.log('[Backend - Mensagens] Mensagem enviada com sucesso. BaileysId:', sendResult.key.id);
    }

    // 7. Responder ao frontend
    res.status(201).json(mensagemSalva);

  } catch (error) {
    console.error('[Backend - Mensagens] Erro ao enviar mensagem:', error);

    // Se a mensagem já foi salva, atualizar status para erro
    if (mensagemSalva && mensagemSalva._id) {
      try {
        mensagemSalva.status = 'error';
        await mensagemSalva.save();
        console.log('[Backend - Mensagens] Status da mensagem atualizado para error:', mensagemSalva._id);
      } catch (saveError) {
        console.error('[Backend - Mensagens] Erro ao atualizar status da mensagem:', saveError);
      }
    }

    res.status(500).json({ 
      error: 'Erro ao enviar mensagem',
      details: error.message,
      messageId: mensagemSalva?._id
    });
  }
});

export default router; 