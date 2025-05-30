import mongoose from 'mongoose';

const vendaSchema = new mongoose.Schema({
  vendedor: { 
    type: String, 
    required: true,
    index: true
  },
  quantidade: { 
    type: Number, 
    required: true 
  },
  valor: { 
    type: Number, 
    required: true 
  },
  data: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  versionKey: false
});

vendaSchema.index({ vendedor: 1, data: -1 });

vendaSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

const Venda = mongoose.model('Venda', vendaSchema);
export default Venda; 