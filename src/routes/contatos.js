import express from 'express';
import Contato from '../models/Contato.js';
import Atendimento from '../models/Atendimento.js';
import Mensagem from '../models/Mensagem.js';
import { isWhatsAppConnected, sendMessage } from '../whatsapp.js';
import { io } from '../socket.js';

const router = express.Router();

// Listar todos os contatos
router.get('/', async (req, res) => {
  try {
    const contatos = await Contato.find().sort({ createdAt: -1 });
    res.json(contatos);
  } catch (error) {
    console.error('[Backend - Contatos] Erro ao listar contatos:', error);
    res.status(500).json({ error: 'Erro ao listar contatos' });
  }
});

// Buscar contato por ID
router.get('/:id', async (req, res) => {
  try {
    const contato = await Contato.findById(req.params.id);
    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }
    res.json(contato);
  } catch (error) {
    console.error('[Backend - Contatos] Erro ao buscar contato:', error);
    res.status(500).json({ error: 'Erro ao buscar contato' });
  }
});

// Criar novo contato
router.post('/', async (req, res) => {
  try {
    const contato = new Contato(req.body);
    await contato.save();
    res.status(201).json(contato);
  } catch (error) {
    console.error('[Backend - Contatos] Erro ao criar contato:', error);
    res.status(500).json({ error: 'Erro ao criar contato' });
  }
});

// Atualizar contato
router.put('/:id', async (req, res) => {
  try {
    const contato = await Contato.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }
    res.json(contato);
  } catch (error) {
    console.error('[Backend - Contatos] Erro ao atualizar contato:', error);
    res.status(500).json({ error: 'Erro ao atualizar contato' });
  }
});

// Excluir contato
router.delete('/:id', async (req, res) => {
  try {
    const contato = await Contato.findByIdAndDelete(req.params.id);
    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }
    res.json({ message: 'Contato excluído com sucesso' });
  } catch (error) {
    console.error('[Backend - Contatos] Erro ao excluir contato:', error);
    res.status(500).json({ error: 'Erro ao excluir contato' });
  }
});

// Adicionar comentário
router.post('/:id/comentarios', async (req, res) => {
  try {
    const contato = await Contato.findById(req.params.id);
    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    const { texto, autor } = req.body;
    contato.comentarios.push({ texto, autor });
    await contato.save();

    res.json(contato);
  } catch (error) {
    console.error('[Backend - Contatos] Erro ao adicionar comentário:', error);
    res.status(500).json({ error: 'Erro ao adicionar comentário' });
  }
});

// Buscar histórico de atendimentos
router.get('/:id/atendimentos', async (req, res) => {
  try {
    const contato = await Contato.findById(req.params.id);
    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    const atendimentos = await Atendimento.find({ jid: contato.jid }).sort({ timestamp: -1 });
    res.json(atendimentos);
  } catch (error) {
    console.error('[Backend - Contatos] Erro ao buscar histórico de atendimentos:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de atendimentos' });
  }
});

// Enviar mensagem para contato
router.post('/:id/mensagem', async (req, res) => {
  try {
    const contato = await Contato.findById(req.params.id);
    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    if (!isWhatsAppConnected()) {
      return res.status(503).json({ error: 'WhatsApp não está conectado' });
    }

    const { mensagem } = req.body;
    if (!mensagem) {
      return res.status(400).json({ error: 'Mensagem não fornecida' });
    }

    await sendMessage(contato.jid, { text: mensagem });
    res.json({ message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    console.error('[Backend - Contatos] Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
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

// Rota de estatísticas de atendimentos e top cidades (todos os contatos, qualquer DDD)
router.get('/estatisticas', async (req, res) => {
  try {
    // Buscar todos os contatos
    const contatos = await Contato.find();
    const totalAtendimentos = contatos.length;

    // Mapeamento simples de DDD para cidade
    const dddCidade = {
      '21': 'Rio de Janeiro',
      '11': 'São Paulo',
      '81': 'Recife',
      '31': 'Belo Horizonte',
      '71': 'Salvador',
      '41': 'Curitiba',
      '51': 'Porto Alegre',
      '85': 'Fortaleza',
      '62': 'Goiânia',
      '27': 'Vitória',
      '19': 'Campinas',
      '16': 'Ribeirão Preto',
      '98': 'São Luís',
      '92': 'Manaus',
      '48': 'Florianópolis',
      '34': 'Uberlândia',
      '95': 'Boa Vista',
      '82': 'Maceió',
      '84': 'Natal',
      '86': 'Teresina',
      '96': 'Macapá',
      '99': 'Imperatriz',
      '63': 'Palmas',
      '68': 'Rio Branco',
      '69': 'Porto Velho',
      '65': 'Cuiabá',
      '67': 'Campo Grande',
      '73': 'Itabuna',
      '75': 'Feira de Santana',
      '77': 'Barreiras',
      '79': 'Aracaju',
      '83': 'João Pessoa',
      '91': 'Belém',
      '93': 'Santarém',
      '94': 'Marabá',
      '47': 'Joinville',
      '46': 'Pato Branco',
      '43': 'Londrina',
      '44': 'Maringá',
      '45': 'Foz do Iguaçu',
      '35': 'Poços de Caldas',
      '37': 'Divinópolis',
      '38': 'Montes Claros',
      // ... adicione mais se quiser
    };
    // Contar cidades por DDD
    const cidades = {};
    contatos.forEach(contato => {
      const ddd = contato.numero?.substring(0, 2);
      const cidade = dddCidade[ddd] || `DDD ${ddd}`;
      cidades[cidade] = (cidades[cidade] || 0) + 1;
    });
    // Ordenar por quantidade
    const topCidades = Object.entries(cidades)
      .map(([cidade, total]) => ({ cidade, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    res.json({ totalAtendimentos, topCidades });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao calcular estatísticas', details: error.message });
  }
});

// Listar contatos ativos nas últimas 48 horas
router.get('/ativos-recentes', async (req, res) => {
  try {
    // Calcula a data de 48 horas atrás
    const dataLimite = new Date();
    dataLimite.setHours(dataLimite.getHours() - 48);

    // Busca mensagens recebidas nas últimas 48 horas
    const mensagensRecentes = await Mensagem.find({
      data: { $gte: dataLimite },
      de: { $ne: 'atendente' } // Exclui mensagens enviadas pelo atendente
    }).distinct('para');

    // Busca os contatos correspondentes
    const contatos = await Contato.find({
      jid: { $in: mensagensRecentes }
    }).sort({ updatedAt: -1 });

    // Formata a resposta
    const contatosFormatados = await Promise.all(contatos.map(async (contato) => {
      // Busca a última mensagem do contato
      const ultimaMensagem = await Mensagem.findOne({
        $or: [
          { de: contato.jid },
          { para: contato.jid }
        ]
      }).sort({ data: -1 });

      return {
        _id: contato._id,
        nome: contato.nome,
        numero: contato.numero,
        ultimaMensagem: ultimaMensagem ? {
          conteudo: ultimaMensagem.conteudo,
          data: ultimaMensagem.data,
          tipo: ultimaMensagem.de === 'atendente' ? 'enviada' : 'recebida'
        } : null
      };
    }));

    res.json({ 
      total: contatosFormatados.length,
      contatos: contatosFormatados
    });
  } catch (error) {
    console.error('[Backend - Contatos] Erro ao listar contatos ativos recentes:', error);
    res.status(500).json({ error: 'Erro ao listar contatos ativos recentes' });
  }
});

export default router; 