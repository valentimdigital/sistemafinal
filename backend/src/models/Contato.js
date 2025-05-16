import mongoose from 'mongoose';

const contatoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  numero: { type: String, required: true, unique: true },
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
  status: String,
  iaAtiva: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Contato = mongoose.model('Contato', contatoSchema);
export default Contato; 