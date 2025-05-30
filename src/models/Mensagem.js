import mongoose from 'mongoose';

const mensagemSchema = new mongoose.Schema({
  contato: { type: mongoose.Schema.Types.ObjectId, ref: 'Contato', required: true },
  de: { type: String, required: true },
  para: { type: String, required: true },
  conteudo: { type: String, required: true },
  tipo: { 
    type: String, 
    enum: ['text', 'image', 'audio', 'video', 'document', 'location', 'sticker'], 
    default: 'text' 
  },
  status: { 
    type: String, 
    enum: ['sending', 'sent', 'delivered', 'read', 'error', 'received'], 
    default: 'sending' 
  },
  protocolo: { type: String },
  data: { type: Date, default: Date.now },
  metadados: {
    mimeType: String,
    fileName: String,
    fileSize: Number,
    duration: Number, // Para áudio/vídeo
    thumbnail: String, // Para vídeo/imagem
    width: Number, // Para imagem/vídeo
    height: Number, // Para imagem/vídeo
    latitude: Number, // Para localização
    longitude: Number, // Para localização
    caption: String, // Para mídia
    url: String, // URL do arquivo armazenado
    reactions: [{
      emoji: String,
      from: String,
      timestamp: { type: Date, default: Date.now }
    }]
  }
}, { 
  timestamps: true,
  versionKey: false 
});

// Adicionar índices para melhor performance
mensagemSchema.index({ contato: 1, createdAt: -1 });
mensagemSchema.index({ status: 1 });
mensagemSchema.index({ de: 1, para: 1 });

// Remover o modelo existente se houver
try {
  mongoose.model('Mensagem');
} catch (e) {
  // Modelo não existe, continuar
}

const Mensagem = mongoose.model('Mensagem', mensagemSchema);

// Função utilitária para salvar mensagem
export async function saveMessage(data) {
  return await Mensagem.create(data);
}

export default Mensagem; 