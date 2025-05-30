import mongoose from 'mongoose';

const contatoSchema = new mongoose.Schema({
  jid: {
    type: String,
    required: true,
    unique: true
  },
  nome: {
    type: String,
    required: true
  },
  numero: {
    type: String,
    required: true
  },
  ultimaInteracao: {
    type: Date,
    default: Date.now
  },
  avatar: { type: String },
  ultimoAtendimento: { type: Date },
  protocolo: { type: String },
  tags: [String],
  atendente: { type: String },
  comentarios: [
    {
      texto: { type: String, required: true },
      data: { type: Date, default: Date.now },
      autor: { type: String }
    }
  ],
  infoExtra: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Contato = mongoose.model('Contato', contatoSchema);

// Função utilitária para buscar ou criar contato
export async function findOrCreateContact(numero, nome) {
  let contato = await Contato.findOne({ numero });
  if (!contato) {
    contato = await Contato.create({ numero, nome });
  } else if (nome && contato.nome !== nome) {
    contato.nome = nome;
    await contato.save();
  }
  return contato;
}

export default Contato; 