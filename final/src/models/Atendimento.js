import mongoose from 'mongoose';

const AtendimentoSchema = new mongoose.Schema({
  jid: { type: String, required: true, index: true },
  nome: String,
  etapa: { 
    type: String, 
    required: true,
    enum: [
      'aguardando_nome',
      'aguardando_opcao',
      'aguardando_cnpj',
      'aguardando_confirmacao_cnpj',
      'aguardando_cep',
      'aguardando_confirmacao_endereco',
      'aguardando_numero',
      'aguardando_complemento',
      'aguardando_operadora',
      'aguardando_quantidade_portabilidade',
      'aguardando_novas_linhas',
      'aguardando_quantidade_novas_linhas',
      'aguardando_linhas_existentes',
      'aguardando_novas_linhas',
      'finalizado'
    ],
    default: 'aguardando_nome'
  },
  status: { 
    type: String, 
    required: true,
    enum: ['ativo', 'suspenso', 'finalizado', 'cancelado'],
    default: 'ativo'
  },
  prioridade: {
    type: Boolean,
    default: false
  },
  tentativas: {
    type: Number,
    default: 0
  },
  encaminhadoAtendente: {
    type: Boolean,
    default: false
  },
  opcao: Number,
  fluxo: {
    type: String,
    required: true,
    enum: ['menu', 'CNPJ', 'Fibra', 'Portabilidade', 'Ativacao', 'EmAtendimento'],
    default: 'menu'
  },
  cnpj: {
    type: String,
    trim: true
  },
  dadosCNPJ: {
    razao_social: String,
    nome_fantasia: String,
    cidade: String,
    uf: String,
    situacao: String
  },
  cep: {
    type: String,
    trim: true
  },
  logradouro: {
    type: String,
    trim: true
  },
  bairro: {
    type: String,
    trim: true
  },
  cidade: {
    type: String,
    trim: true
  },
  uf: {
    type: String,
    trim: true
  },
  numero: {
    type: String,
    trim: true
  },
  complemento: {
    type: String,
    trim: true
  },
  dataSuspensao: Date,
  timestamp: { type: Date, default: Date.now },
  // Campos para portabilidade
  operadora_atual: {
    type: String,
    trim: true
  },
  quantidade_linhas: {
    type: Number,
    min: 0
  },
  // Campos para ativação
  linhas_existentes: {
    type: Number,
    min: 0
  },
  novas_linhas: {
    type: Number,
    min: 0
  },
  criado_em: {
    type: Date,
    default: Date.now
  },
  atualizado_em: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para melhor performance
AtendimentoSchema.index({ jid: 1, status: 1 });
AtendimentoSchema.index({ timestamp: -1 });
AtendimentoSchema.index({ contato: 1, fluxo: 1 });
AtendimentoSchema.index({ etapa: 1 });
AtendimentoSchema.index({ criado_em: -1 });

export default mongoose.model('Atendimento', AtendimentoSchema); 