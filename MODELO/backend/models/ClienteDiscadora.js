const mongoose = require('mongoose');

const clienteDiscadoraSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  telefone: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pendente', 'em_atendimento', 'concluido', 'cancelado'],
    default: 'pendente'
  },
  observacoes: {
    type: String,
    trim: true
  },
  atendente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dataCadastro: {
    type: Date,
    default: Date.now
  },
  ultimaAtualizacao: {
    type: Date,
    default: Date.now
  },
  historicoAtendimentos: [{
    data: {
      type: Date,
      default: Date.now
    },
    status: String,
    observacao: String,
    atendente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
});

// Índices para busca rápida
clienteDiscadoraSchema.index({ nome: 1 });
clienteDiscadoraSchema.index({ telefone: 1 });
clienteDiscadoraSchema.index({ status: 1 });
clienteDiscadoraSchema.index({ atendente: 1 });

const ClienteDiscadora = mongoose.model('ClienteDiscadora', clienteDiscadoraSchema);

module.exports = ClienteDiscadora; 