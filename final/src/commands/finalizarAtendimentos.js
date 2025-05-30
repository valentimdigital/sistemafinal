import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Configura o caminho para o arquivo .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../../.env');

// Carrega as variáveis de ambiente
dotenv.config({ path: envPath });

// Pega a URL do MongoDB do arquivo .env
const url = 'mongodb+srv://valentina:Q3zbZeyl9uBEBXSa@valentina.gdcrr.mongodb.net/?retryWrites=true&w=majority&appName=valentina';
const dbName = 'valentina';

async function finalizarAtendimentos() {
    let client;
    
    try {
        console.log('🚀 Iniciando finalização de todos os atendimentos ativos...');
        console.log('📡 Conectando ao MongoDB Atlas...');
        
        // Conecta ao MongoDB Atlas
        client = await MongoClient.connect(url);
        console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
        
        const db = client.db(dbName);
        const collection = db.collection('contatos');

        // Primeiro, vamos verificar todos os atendimentos
        console.log('\n🔍 Verificando todos os atendimentos...');
        const todos = await collection.find({}).toArray();
        console.log(`📊 Total de atendimentos: ${todos.length}`);

        if (todos.length > 0) {
            console.log('\n📊 Estatísticas por status:');
            const stats = todos.reduce((acc, curr) => {
                acc[curr.status || 'sem_status'] = (acc[curr.status || 'sem_status'] || 0) + 1;
                return acc;
            }, {});
            console.log(stats);
        }

        // Agora vamos verificar os atendimentos ativos
        const ativos = await collection.find({
            status: { $ne: 'finalizado' }
        }).toArray();

        console.log(`\n🔍 Encontrados ${ativos.length} atendimentos ativos`);

        if (ativos.length > 0) {
            console.log('📝 Detalhes dos atendimentos ativos:');
            ativos.forEach(atendimento => {
                console.log(`- Número: ${atendimento.numero}, Status: ${atendimento.status}, Data última interação: ${atendimento.dataUltimaInteracao}`);
            });

            // Busca e atualiza todos os atendimentos ativos
            const resultado = await collection.updateMany(
                {
                    status: { $ne: 'finalizado' }
                },
                {
                    $set: {
                        status: 'finalizado',
                        conversaFinalizada: true,
                        dataFinalizacao: new Date()
                    }
                }
            );
            
            console.log('\n✅ Atendimentos finalizados:', {
                encontrados: ativos.length,
                atualizados: resultado.modifiedCount
            });
        } else {
            console.log('\n✅ Não há atendimentos ativos para finalizar');
        }
        
    } catch (error) {
        console.error('❌ Erro ao finalizar atendimentos:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('✅ Conexão com MongoDB fechada');
        }
    }
}

finalizarAtendimentos(); 