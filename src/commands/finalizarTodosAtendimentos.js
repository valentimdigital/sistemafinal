import { MongoClient } from 'mongodb';

const url = 'mongodb+srv://valentina:Q3zbZeyl9uBEBXSa@valentina.gdcrr.mongodb.net/?retryWrites=true&w=majority&appName=valentina';
const dbName = 'valentina';

async function finalizarTodosAtendimentosEContatos() {
    let client;
    
    try {
        console.log('🚀 Iniciando finalização de TODOS os atendimentos e contatos...');
        console.log('📡 Conectando ao MongoDB Atlas...');
        
        // Conecta ao MongoDB Atlas
        client = await MongoClient.connect(url);
        console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
        
        const db = client.db(dbName);
        const atendimentosCollection = db.collection('atendimentos');
        const contatosCollection = db.collection('contatos');

        // Verifica quantidade de atendimentos e contatos
        const totalAtendimentos = await atendimentosCollection.countDocuments({});
        const totalContatos = await contatosCollection.countDocuments({});
        
        console.log('\n📊 Estatísticas atuais:');
        console.log(`- Atendimentos no banco: ${totalAtendimentos}`);
        console.log(`- Contatos no banco: ${totalContatos}`);

        // Atualiza todos os atendimentos para finalizado
        const resultadoAtendimentos = await atendimentosCollection.updateMany(
            {}, // sem filtro, atualiza todos
            {
                $set: {
                    status: 'finalizado',
                    etapa: 'finalizado',
                    dataFinalizacao: new Date()
                }
            }
        );

        // Atualiza todos os contatos para finalizado
        const resultadoContatos = await contatosCollection.updateMany(
            {}, // sem filtro, atualiza todos
            {
                $set: {
                    status: 'finalizado',
                    arquivado: true,
                    dataFinalizacao: new Date()
                }
            }
        );
        
        console.log('\n✅ Resultados da finalização:');
        console.log('Atendimentos:', {
            total: totalAtendimentos,
            atualizados: resultadoAtendimentos.modifiedCount
        });
        console.log('Contatos:', {
            total: totalContatos,
            atualizados: resultadoContatos.modifiedCount
        });

    } catch (error) {
        console.error('❌ Erro ao finalizar registros:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('\n✅ Conexão com MongoDB fechada');
        }
    }
}

// Executa a função
finalizarTodosAtendimentosEContatos(); 