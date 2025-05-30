import mongoose from 'mongoose';
import Atendimento from '../models/Atendimento.js';

const MONGODB_URI = 'mongodb+srv://valentina:Q3zbZeyl9uBEBXSa@valentina.gdcrr.mongodb.net/?retryWrites=true&w=majority&appName=valentina';

async function verificarAtendimentos() {
    try {
        // Conectar ao MongoDB
        console.log('📡 Conectando ao MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB Atlas com sucesso!');

        // Buscar total de atendimentos
        const totalAtendimentos = await Atendimento.countDocuments();
        console.log(`\n📊 Total de atendimentos no banco: ${totalAtendimentos}`);

        // Buscar atendimentos por status
        const atendimentosPorStatus = await Atendimento.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n📊 Atendimentos por status:');
        atendimentosPorStatus.forEach(status => {
            console.log(`- ${status._id || 'sem status'}: ${status.count}`);
        });

        // Buscar atendimentos por fluxo
        const atendimentosPorFluxo = await Atendimento.aggregate([
            {
                $group: {
                    _id: '$fluxo',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n📊 Atendimentos por fluxo:');
        atendimentosPorFluxo.forEach(fluxo => {
            console.log(`- ${fluxo._id || 'sem fluxo'}: ${fluxo.count}`);
        });

        // Buscar últimos 5 atendimentos
        const ultimosAtendimentos = await Atendimento.find()
            .sort({ timestamp: -1 })
            .limit(5);

        console.log('\n📝 Últimos 5 atendimentos:');
        ultimosAtendimentos.forEach(atendimento => {
            console.log(`- ID: ${atendimento._id}`);
            console.log(`  Status: ${atendimento.status}`);
            console.log(`  Fluxo: ${atendimento.fluxo}`);
            console.log(`  Data: ${atendimento.timestamp}`);
            console.log('---');
        });

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

verificarAtendimentos(); 