import mongoose from 'mongoose';
import Atendimento from '../models/Atendimento.js';
import Contato from '../models/Contato.js';
import Mensagem from '../models/Mensagem.js';

const NUMEROS = [
    '5521971200821@s.whatsapp.net',
    '5521967233931@s.whatsapp.net'
];

async function limpar() {
    try {
        // Conecta ao banco de dados
        console.log('🔄 Conectando ao MongoDB Atlas...');
        await mongoose.connect('mongodb+srv://valentina:Q3zbZeyl9uBEBXSa@valentina.gdcrr.mongodb.net/?retryWrites=true&w=majority&appName=valentina');
        
        // Remove atendimentos
        console.log('🗑️ Removendo atendimentos...');
        const resultadoAtendimentos = await Atendimento.deleteMany({
            jid: { $in: NUMEROS }
        });
        console.log(`✅ ${resultadoAtendimentos.deletedCount} atendimentos removidos`);

        // Remove contatos
        console.log('🗑️ Removendo contatos...');
        const resultadoContatos = await Contato.deleteMany({
            jid: { $in: NUMEROS }
        });
        console.log(`✅ ${resultadoContatos.deletedCount} contatos removidos`);

        // Remove mensagens
        console.log('🗑️ Removendo mensagens...');
        const resultadoMensagens = await Mensagem.deleteMany({
            $or: [
                { de: { $in: NUMEROS } },
                { para: { $in: NUMEROS } }
            ]
        });
        console.log(`✅ ${resultadoMensagens.deletedCount} mensagens removidas`);

        console.log('\n✨ Limpeza concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        // Desconecta do banco de dados
        await mongoose.disconnect();
        process.exit(0);
    }
}

// Executa a limpeza
console.log('🧹 Iniciando limpeza dos números:');
NUMEROS.forEach(numero => console.log(`   ${numero}`));
console.log('');

limpar(); 