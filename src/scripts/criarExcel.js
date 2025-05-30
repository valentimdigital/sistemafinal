import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function criarExcel() {
    try {
        // Ler o arquivo CSV
        const csvPath = path.join(__dirname, '../../../Base de Cobertura (Completa).csv');
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const linhas = csvContent.split('\n');
        
        // Criar array de objetos com a estrutura desejada
        const dados = [];
        const cabecalho = linhas[0].split(',');
        
        for (let i = 1; i < linhas.length; i++) {
            if (!linhas[i].trim()) continue;
            
            const valores = linhas[i].split(',');
            const registro = {
                '1_nome_cliente': 'sem informação',
                '2_telefone_cliente': 'sem informação',
                '3_data_criacao': new Date().toISOString(),
                '4_bairro': valores[1] || 'sem informação',
                '5_cep': valores[0] || 'sem informação',
                '6_cnpj': 'sem informação',
                '7_cnpj_2': 'sem informação',
                '8_complemento': 'sem informação',
                '9_cpf': 'sem informação',
                '10_data_nascimento': 'sem informação',
                '11_email': 'sem informação',
                '12_endereco': 'sem informação',
                '13_nome_mae': 'sem informação',
                '14_numero': 'sem informação'
            };
            dados.push(registro);
        }
        
        // Criar workbook e worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dados);
        
        // Adicionar worksheet ao workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Dados');
        
        // Salvar arquivo
        const excelPath = path.join(__dirname, 'dados.xlsx');
        XLSX.writeFile(wb, excelPath);
        
        console.log('Arquivo Excel criado com sucesso!');
        console.log('Total de registros:', dados.length);
        
    } catch (erro) {
        console.error('Erro:', erro);
    }
}

criarExcel(); 