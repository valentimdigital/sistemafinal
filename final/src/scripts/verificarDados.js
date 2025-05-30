import mongoose from 'mongoose';

// Configuração do MongoDB
const MONGODB_URI = 'mongodb+srv://valentina:Q3zbZeyl9uBEBXSa@valentina.gdcrr.mongodb.net/valentina';

// Schema para os contatos do discador
const contatoDiscadorSchema = new mongoose.Schema({
    nome_cliente: String,
    telefone_cliente: String,
    data_criacao: Date,
    bairro: String,
    cep: String,
    cnpj: String,
    cnpj_2: String,
    complemento: String,
    cpf: String,
    data_nascimento: String,
    email: String,
    endereco: String,
    nome_mae: String,
    numero: String
});

const ContatoDiscador = mongoose.model('ContatoDiscador', contatoDiscadorSchema);

async function verificarDados() {
    try {
        // Conectar ao MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado ao MongoDB');

        // Contar total de registros
        const total = await ContatoDiscador.countDocuments();
        console.log(`\nTotal de registros: ${total}`);

        // Contar registros por status de telefone
        const comTelefone = await ContatoDiscador.countDocuments({
            telefone_cliente: { $ne: "sem informação" }
        });
        console.log(`Registros com telefone: ${comTelefone}`);
        console.log(`Registros sem telefone: ${total - comTelefone}`);

        // Mostrar alguns exemplos
        console.log('\nExemplos de registros:');
        const exemplos = await ContatoDiscador.find().limit(3);
        console.log(JSON.stringify(exemplos, null, 2));

    } catch (erro) {
        console.error('Erro:', erro);
    } finally {
        await mongoose.disconnect();
        console.log('\nDesconectado do MongoDB');
    }
}

verificarDados(); 