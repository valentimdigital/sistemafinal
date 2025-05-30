import XLSX from 'xlsx';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do MongoDB
const MONGODB_URI = 'mongodb+srv://valentina:Q3zbZeyl9uBEBXSa@valentina.gdcrr.mongodb.net/valentina';

// Schema para os contatos do discador
const contatoDiscadorSchema = new mongoose.Schema({
    // Informações do Cliente
    telefoneCliente: {
        type: String,
        description: 'Número de telefone do cliente para contato direto'
    },
    nomeCliente: {
        type: String,
        description: 'Nome completo do cliente'
    },
    // Informações do Usuário/Vendedor
    telefoneUsuario: {
        type: String,
        description: 'Número do vendedor/atendente'
    },
    // Dados de Registro
    dataCriacao: {
        type: Date,
        description: 'Data de criação do cadastro'
    },
    // Endereço
    bairro: {
        type: String,
        description: 'Bairro do cliente'
    },
    cep: {
        type: String,
        description: 'CEP do endereço'
    },
    complemento: {
        type: String,
        description: 'Informações adicionais do endereço'
    },
    endereco: {
        type: String,
        description: 'Logradouro completo'
    },
    numero: {
        type: String,
        description: 'Número do imóvel'
    },
    // Documentos
    cnpj: {
        type: String,
        description: 'CNPJ principal'
    },
    cnpj2: {
        type: String,
        description: 'CNPJ secundário'
    },
    cpf: {
        type: String,
        description: 'CPF do cliente'
    },
    // Dados Pessoais
    dataNascimento: {
        type: String,
        description: 'Data de nascimento do cliente'
    },
    email: {
        type: String,
        description: 'E-mail para contato'
    },
    nomeMae: {
        type: String,
        description: 'Nome da mãe para verificação'
    },
    // Controle do Discador
    status: {
        type: String,
        enum: ['pendente', 'processado', 'erro'],
        default: 'pendente',
        description: 'Status atual do contato no discador'
    },
    tentativas: {
        type: Number,
        default: 0,
        description: 'Número de tentativas de contato'
    },
    ultimaTentativa: {
        type: Date,
        description: 'Data da última tentativa de contato'
    },
    resultadoUltimaTentativa: {
        type: String,
        description: 'Resultado da última tentativa de contato'
    },
    observacoes: {
        type: String,
        description: 'Observações gerais do atendimento'
    }
});

const ContatoDiscador = mongoose.model('ContatoDiscador', contatoDiscadorSchema);

async function processarArquivoExcel() {
    try {
        // Conectar ao MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado ao MongoDB com sucesso');

        // Caminho para o arquivo Excel
        const excelPath = path.join(__dirname, '../../../../janeiro.xlsx');
        console.log('Tentando ler arquivo:', excelPath);
        
        // Ler o arquivo Excel
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON
        const dados = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`Total de registros encontrados: ${dados.length}`);
        
        // Processar cada linha do Excel
        for (const linha of dados) {
            try {
                const telefoneUsuario = linha['TELEFONE (USUÁRIO)'];
                
                // Pular registros com telefones inválidos
                if (!telefoneUsuario || telefoneUsuario === 'vdtelecom' || telefoneUsuario.length > 15) {
                    console.log('Linha com telefone inválido:', JSON.stringify(linha, null, 2));
                    continue;
                }

                // Dados do contato
                const dadosContato = {
                    telefoneCliente: linha['TELEFONE (CLIENTE)'],
                    nomeCliente: linha['NOME (CLIENTE)'],
                    telefoneUsuario: telefoneUsuario,
                    dataCriacao: new Date(linha['DATA DE CRIAÇÃO'].replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')),
                    bairro: linha['BAIRRO'],
                    cep: linha['CEP'],
                    cnpj: linha['CNPJ'],
                    cnpj2: linha['CNPJ 2'],
                    complemento: linha['COMPLEMENTO'],
                    cpf: linha['CPF'],
                    dataNascimento: linha['DATA DE NASCIMENTO'],
                    email: linha['E-MAIL'],
                    endereco: linha['ENDEREÇO'],
                    nomeMae: linha['NOME DA MÃE'],
                    numero: linha['NUMERO']
                };

                // Atualizar ou criar novo registro
                const resultado = await ContatoDiscador.findOneAndUpdate(
                    { telefoneUsuario: telefoneUsuario },
                    dadosContato,
                    { 
                        upsert: true, // Criar se não existir
                        new: true, // Retornar o documento atualizado
                        setDefaultsOnInsert: true // Aplicar valores padrão ao criar
                    }
                );
                
                if (resultado) {
                    console.log(`Contato atualizado/criado com sucesso: ${resultado.nomeCliente || 'Sem nome'} - ${resultado.telefoneUsuario}`);
                }
                
            } catch (erro) {
                console.error(`Erro ao processar linha:`, erro);
            }
        }
        
        console.log('Processamento concluído!');
        
    } catch (erro) {
        console.error('Erro durante o processamento:', erro);
    } finally {
        await mongoose.disconnect();
        console.log('Desconectado do MongoDB');
    }
}

// Executar o processamento
processarArquivoExcel(); 