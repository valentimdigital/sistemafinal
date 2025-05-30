import mongoose from 'mongoose';

const ClienteSchema = new mongoose.Schema({
    jid: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    status: {
        type: String,
        enum: ['bot', 'humano', 'inativo'],
        default: 'inativo'
    },
    nome: String,
    ultimoContato: {
        type: Date,
        default: Date.now
    },
    ultimoAtendimento: {
        type: Date,
        default: Date.now
    },
    respondeu: {
        type: Boolean,
        default: false
    },
    historico: [{
        mensagem: String,
        tipo: {
            type: String,
            enum: ['bot', 'cliente', 'humano']
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

export default mongoose.model('Cliente', ClienteSchema); 