import mongoose from 'mongoose';
import { setTimeout } from 'timers/promises';

// Configuração do MongoDB
const MONGODB_URI = 'mongodb+srv://valentina:Q3zbZeyl9uBEBXSa@valentina.gdcrr.mongodb.net/valentina';

// Schema para os contatos do discador
const contatoDiscadorSchema = new mongoose.Schema({
    // Campos numerados conforme especificação
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
    numero: String,                // 14
    // Campos de controle do discador
    status: {
        type: String,
        enum: ['pendente', 'processado', 'erro'],
        default: 'pendente'
    },
    tentativas: {
        type: Number,
        default: 0
    },
    ultimaTentativa: Date,
    resultadoUltimaTentativa: String
});

const ContatoDiscador = mongoose.model('ContatoDiscador', contatoDiscadorSchema);

// Configurações do discador
const CONFIG = {
    MAX_TENTATIVAS: 3,
    INTERVALO_ENTRE_CHAMADAS: 30000, // 30 segundos
    LIMITE_CHAMADAS_SIMULTANEAS: 5
};

// Funções auxiliares
function formatarTelefone(telefone) {
    if (!telefone) return 'N/A';
    const numeros = telefone.replace(/\D/g, '');
    
    // Se começar com 55 (Brasil)
    if (numeros.startsWith('55')) {
        const ddd = numeros.slice(2, 4);
        const numero = numeros.slice(4);
        if (numero.length === 9) {
            return `(${ddd}) ${numero.slice(0,5)}-${numero.slice(5)}`;
        } else if (numero.length === 8) {
            return `(${ddd}) ${numero.slice(0,4)}-${numero.slice(4)}`;
        }
    }
    
    // Se não começar com 55, tentar formatar como número local
    if (numeros.length === 11) {
        return `(${numeros.slice(0,2)}) ${numeros.slice(2,7)}-${numeros.slice(7)}`;
    } else if (numeros.length === 10) {
        return `(${numeros.slice(0,2)}) ${numeros.slice(2,6)}-${numeros.slice(6)}`;
    }
    
    return telefone;
}

function formatarCPF(cpf) {
    if (!cpf) return 'N/A';
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length === 11) {
        return `${numeros.slice(0,3)}.${numeros.slice(3,6)}.${numeros.slice(6,9)}-${numeros.slice(9)}`;
    }
    return cpf;
}

function formatarCNPJ(cnpj) {
    if (!cnpj) return 'N/A';
    const numeros = cnpj.replace(/\D/g, '');
    if (numeros.length === 14) {
        return `${numeros.slice(0,2)}.${numeros.slice(2,5)}.${numeros.slice(5,8)}/${numeros.slice(8,12)}-${numeros.slice(12)}`;
    }
    return cnpj;
}

function formatarCEP(cep) {
    if (!cep) return 'N/A';
    const numeros = cep.replace(/\D/g, '');
    if (numeros.length === 8) {
        return `${numeros.slice(0,5)}-${numeros.slice(5)}`;
    }
    return cep;
}

async function simularChamada(contato) {
    // Aqui você implementará a integração real com seu sistema de chamadas
    // Por enquanto, vamos simular o resultado
    const resultados = ['atendido', 'ocupado', 'não atendido', 'caixa postal'];
    const resultado = resultados[Math.floor(Math.random() * resultados.length)];
    
    // Simular duração da chamada
    await setTimeout(Math.random() * 5000 + 2000);
    
    return resultado;
}

async function processarContato(contato) {
    try {
        console.log('\n===========================================');
        console.log('INICIANDO NOVA CHAMADA');
        console.log('===========================================');
        
        // Informações principais
        console.log('\nINFORMAÇÕES PRINCIPAIS:');
        console.log(`Nome do Cliente: ${contato.nome_cliente || 'N/A'}`);
        console.log(`Telefone do Cliente: ${formatarTelefone(contato.telefone_cliente)}`);
        console.log(`Data de Criação: ${contato.data_criacao ? contato.data_criacao.toLocaleString() : 'N/A'}`);
        
        // Documentos
        console.log('\nDOCUMENTOS:');
        console.log(`CPF: ${formatarCPF(contato.cpf)}`);
        console.log(`CNPJ: ${formatarCNPJ(contato.cnpj)}`);
        if (contato.cnpj_2) console.log(`CNPJ 2: ${formatarCNPJ(contato.cnpj_2)}`);
        
        // Endereço
        if (contato.endereco || contato.numero || contato.bairro || contato.cep) {
            console.log('\nENDEREÇO:');
            if (contato.endereco) console.log(`Logradouro: ${contato.endereco}`);
            if (contato.numero) console.log(`Número: ${contato.numero}`);
            if (contato.complemento) console.log(`Complemento: ${contato.complemento}`);
            if (contato.bairro) console.log(`Bairro: ${contato.bairro}`);
            console.log(`CEP: ${formatarCEP(contato.cep)}`);
        }
        
        // Dados pessoais adicionais
        console.log('\nDADOS ADICIONAIS:');
        console.log(`Data de Nascimento: ${contato.data_nascimento || 'N/A'}`);
        console.log(`Nome da Mãe: ${contato.nome_mae || 'N/A'}`);
        console.log(`E-mail: ${contato.email || 'N/A'}`);
        
        // Status do contato
        console.log('\nSTATUS DO CONTATO:');
        console.log(`Tentativas anteriores: ${contato.tentativas} de ${CONFIG.MAX_TENTATIVAS}`);
        if (contato.ultimaTentativa) {
            console.log(`Última tentativa: ${contato.ultimaTentativa.toLocaleString()}`);
            console.log(`Resultado anterior: ${contato.resultadoUltimaTentativa || 'N/A'}`);
        }
        
        // Realizar chamada
        console.log('\nREALIZANDO CHAMADA...');
        const resultado = await simularChamada(contato);
        
        // Atualizar informações do contato
        contato.tentativas += 1;
        contato.ultimaTentativa = new Date();
        contato.resultadoUltimaTentativa = resultado;
        
        if (resultado === 'atendido' || contato.tentativas >= CONFIG.MAX_TENTATIVAS) {
            contato.status = 'processado';
        }
        
        await contato.save();
        
        // Resultado da chamada
        console.log('\nRESULTADO DA CHAMADA:');
        console.log(`Status: ${resultado}`);
        console.log(`Tentativa ${contato.tentativas} de ${CONFIG.MAX_TENTATIVAS}`);
        if (contato.status === 'processado') {
            console.log('Contato marcado como processado');
        }
        
        console.log('===========================================\n');
        
    } catch (erro) {
        console.error(`Erro ao processar chamada:`, erro);
        contato.status = 'erro';
        await contato.save();
    }
}

async function executarDiscador() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado ao MongoDB com sucesso');
        
        while (true) {
            // Buscar contatos pendentes
            const contatosPendentes = await ContatoDiscador.find({
                status: 'pendente',
                $or: [
                    { ultimaTentativa: { $exists: false } },
                    { ultimaTentativa: { $lte: new Date(Date.now() - CONFIG.INTERVALO_ENTRE_CHAMADAS) } }
                ]
            }).limit(CONFIG.LIMITE_CHAMADAS_SIMULTANEAS);
            
            if (contatosPendentes.length === 0) {
                console.log('\nNenhum contato pendente encontrado. Aguardando...');
                await setTimeout(10000); // Aguardar 10 segundos
                continue;
            }
            
            console.log(`\nProcessando ${contatosPendentes.length} contatos...`);
            
            // Processar contatos em paralelo
            await Promise.all(contatosPendentes.map(processarContato));
        }
    } catch (erro) {
        console.error('Erro durante a execução do discador:', erro);
    }
}

// Iniciar o discador
console.log('Iniciando sistema de discador...');
executarDiscador(); 