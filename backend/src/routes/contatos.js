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

export default router; 