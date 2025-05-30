import express from 'express';
import Venda from '../models/Venda.js';

const router = express.Router();

// Cache simples em memória
let cacheVendas = {
  data: null,
  timestamp: null,
  validade: 30000 // 30 segundos
};

// Função para limpar cache
const limparCache = () => {
  cacheVendas = {
    data: null,
    timestamp: null,
    validade: 30000
  };
};

// Cadastrar nova venda
router.post('/', async (req, res) => {
  try {
    const { vendedor, quantidade, valor } = req.body;
    const venda = new Venda({ vendedor, quantidade, valor });
    await venda.save();
    limparCache(); // Limpa cache ao adicionar nova venda
    res.status(201).json(venda);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao cadastrar venda', details: error.message });
  }
});

// Listar todas as vendas com cache
router.get('/', async (req, res) => {
  try {
    // Verifica se tem cache válido
    if (cacheVendas.data && cacheVendas.timestamp && 
        (Date.now() - cacheVendas.timestamp) < cacheVendas.validade) {
      return res.json(cacheVendas.data);
    }

    // Se não tem cache, busca do banco
    const vendas = await Venda.find()
      .sort({ data: -1 })
      .lean() // Usa lean() para retornar objetos JavaScript puros
      .exec();

    // Atualiza cache
    cacheVendas.data = vendas;
    cacheVendas.timestamp = Date.now();

    res.json(vendas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar vendas', details: error.message });
  }
});

// Rota para ranking (otimizada)
router.get('/ranking', async (req, res) => {
  try {
    // Verifica cache
    if (cacheVendas.data && cacheVendas.timestamp && 
        (Date.now() - cacheVendas.timestamp) < cacheVendas.validade) {
      const ranking = calcularRanking(cacheVendas.data);
      return res.json(ranking);
    }

    // Se não tem cache, busca do banco
    const vendas = await Venda.find()
      .sort({ data: -1 })
      .lean()
      .exec();

    // Atualiza cache
    cacheVendas.data = vendas;
    cacheVendas.timestamp = Date.now();

    const ranking = calcularRanking(vendas);
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ranking', details: error.message });
  }
});

// Função auxiliar para calcular ranking
function calcularRanking(vendas) {
  const vendasPorVendedor = vendas.reduce((acc, v) => {
    if (!acc[v.vendedor]) {
      acc[v.vendedor] = { vendas: 0, valor: 0 };
    }
    acc[v.vendedor].vendas += v.quantidade;
    acc[v.vendedor].valor += v.valor;
    return acc;
  }, {});

  return Object.entries(vendasPorVendedor)
    .map(([vendedor, dados]) => ({
      nome: vendedor,
      vendas: dados.vendas,
      valor: dados.valor
    }))
    .sort((a, b) => b.vendas - a.vendas)
    .slice(0, 3);
}

export default router; 