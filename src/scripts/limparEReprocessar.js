import mongoose from 'mongoose';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do MongoDB
const MONGODB_URI = 'mongodb+srv://valentina:Q3zbZeyl9uBEBXSa@valentina.gdcrr.mongodb.net/valentina';

// Schema para os contatos do discador
const contatoDiscadorSchema = new mongoose.Schema({
    nome_cliente: String,           // 1
    telefone_cliente: String,       // 2
    data_criacao: Date,            // 3
    bairro: String,                // 4
    cep: String,                   // 5
    cnpj: String,                  // 6
    cnpj_2: String,                // 7
    complemento: String,           // 8
    cpf: String,                   // 9
    data_nascimento: String,       // 10
    email: String,                 // 11
    endereco: String,              // 12
    nome_mae: String,              // 13
    numero: String                 // 14
});

const ContatoDiscador = mongoose.model('ContatoDiscador', contatoDiscadorSchema);

// Funções de validação
const validarTelefone = (telefone) => {
    if (!telefone) return false;
    const numeroLimpo = telefone.toString().replace(/\D/g, '');
    return numeroLimpo.length >= 10 && numeroLimpo.length <= 11;
};

const validarCPF = (cpf) => {
    if (!cpf) return true; // CPF não é obrigatório
    const cpfLimpo = cpf.toString().replace(/\D/g, '');
    return cpfLimpo.length === 11;
};

const validarCEP = (cep) => {
    if (!cep) return true; // CEP não é obrigatório
    const cepLimpo = cep.toString().replace(/\D/g, '');
    return cepLimpo.length === 8;
};

const formatarTelefone = (telefone) => {
    if (!telefone) return "sem informação";
    return telefone.toString().replace(/\D/g, '');
};

const formatarCPF = (cpf) => {
    if (!cpf) return "sem informação";
    return cpf.toString().replace(/\D/g, '');
};

const formatarCEP = (cep) => {
    if (!cep) return "sem informação";
    return cep.toString().replace(/\D/g, '');
};

// Função principal
async function limparEReprocessar() {
    try {
        // Conectar ao MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado ao MongoDB');

        // Limpar coleção existente
        await ContatoDiscador.deleteMany({});
        console.log('Coleção limpa');

        // Ler arquivo Excel
        const workbook = XLSX.readFile(path.join(__dirname, '../../../../Base de Cobertura (Completa).csv'));
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const dados = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`Total de registros encontrados no Excel: ${dados.length}`);
        
        if (dados.length > 0) {
            console.log('\nEstrutura do primeiro registro:');
            console.log(JSON.stringify(dados[0], null, 2));
        }

        let processados = 0;
        let erros = 0;
        const errosPorMotivo = {
            telefoneInvalido: 0,
            cpfInvalido: 0,
            cepInvalido: 0
        };

        // Processar cada registro
        for (const linha of dados) {
            try {
                const registro = {
                    nome_cliente: linha['1_nome_cliente'] || "sem informação",
                    telefone_cliente: linha['2_telefone_cliente'] ? formatarTelefone(linha['2_telefone_cliente']) : "sem informação",
                    data_criacao: linha['3_data_criacao'] ? new Date(linha['3_data_criacao']) : new Date(),
                    bairro: linha['4_bairro'] || "sem informação",
                    cep: formatarCEP(linha['5_cep']),
                    cnpj: linha['6_cnpj'] || "sem informação",
                    cnpj_2: linha['7_cnpj_2'] || "sem informação",
                    complemento: linha['8_complemento'] || "sem informação",
                    cpf: formatarCPF(linha['9_cpf']),
                    data_nascimento: linha['10_data_nascimento'] || "sem informação",
                    email: linha['11_email'] || "sem informação",
                    endereco: linha['12_endereco'] || "sem informação",
                    nome_mae: linha['13_nome_mae'] || "sem informação",
                    numero: linha['14_numero'] || "sem informação"
                };

                console.log('\nProcessando registro:');
                console.log(JSON.stringify(registro, null, 2));

                // Validar campos obrigatórios
                if (!validarTelefone(linha['2_telefone_cliente'])) {
                    console.log('Registro com telefone inválido:', linha['2_telefone_cliente']);
                    errosPorMotivo.telefoneInvalido++;
                    erros++;
                    continue;
                }

                // Salvar no MongoDB
                await new ContatoDiscador(registro).save();
                processados++;

            } catch (erro) {
                console.log('Erro ao processar registro:', erro);
                erros++;
            }
        }

        console.log('\nResumo do processamento:');
        console.log(`- Total de registros processados: ${processados}`);
        console.log(`- Registros com campos inválidos: ${erros}`);
        if (erros > 0) {
            console.log('\nErros por motivo:');
            console.log(`- Telefones inválidos: ${errosPorMotivo.telefoneInvalido}`);
            console.log(`- CPFs inválidos: ${errosPorMotivo.cpfInvalido}`);
            console.log(`- CEPs inválidos: ${errosPorMotivo.cepInvalido}`);
        }

    } catch (erro) {
        console.error('Erro:', erro);
    } finally {
        await mongoose.disconnect();
        console.log('\nDesconectado do MongoDB');
    }
}

// Executar script
limparEReprocessar(); 