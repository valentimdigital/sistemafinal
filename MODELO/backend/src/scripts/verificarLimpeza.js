import mongoose from 'mongoose';
import Atendimento from '../models/Atendimento.js';
import Contato from '../models/Contato.js';
import Mensagem from '../models/Mensagem.js';

const NUMEROS = [
    '5521971200821@s.whatsapp.net',
    '5521967233931@s.whatsapp.net'
];

async function verificar() {
    try {
        // Conecta ao banco de dados
        console.log('🔄 Conectando ao MongoDB Atlas...');
        await mongoose.connect('mongodb+srv://valentina:Q3zbZeyl9uBEBXSa@valentina.gdcrr.mongodb.net/?retryWrites=true&w=majority&appName=valentina');
        
        // Verifica atendimentos
        const atendimentos = await Atendimento.find({ jid: { $in: NUMEROS } });
        console.log('\n📋 Atendimentos encontrados:', atendimentos.length);

        // Verifica contatos
        const contatos = await Contato.find({ jid: { $in: NUMEROS } });
        console.log('👤 Contatos encontrados:', contatos.length);

        // Verifica mensagens
        const mensagens = await Mensagem.find({
            $or: [
                { de: { $in: NUMEROS } },
                { para: { $in: NUMEROS } }
            ]
        });
        console.log('💬 Mensagens encontradas:', mensagens.length);

        if (atendimentos.length === 0 && contatos.length === 0 && mensagens.length === 0) {
            console.log('\n✅ Todos os registros foram limpos com sucesso!');
        } else {
            console.log('\n⚠️ Ainda existem registros no banco de dados:');
            
            if (atendimentos.length > 0) {
                console.log('\nAtendimentos encontrados:');
                console.log(JSON.stringify(atendimentos, null, 2));
            }
            
            if (contatos.length > 0) {
                console.log('\nContatos encontrados:');
                console.log(JSON.stringify(contatos, null, 2));
            }
            
            if (mensagens.length > 0) {
                console.log('\nMensagens encontradas:');
                console.log(JSON.stringify(mensagens, null, 2));
            }
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        // Desconecta do banco de dados
        await mongoose.disconnect();
        process.exit(0);
    }
}

// Executa a verificação
console.log('🔍 Verificando registros para os números:');
NUMEROS.forEach(numero => console.log(`   ${numero}`));
console.log('');

verificar(); 