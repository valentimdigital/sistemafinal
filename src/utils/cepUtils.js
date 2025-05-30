import axios from 'axios';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

// Função para limpar CEP
export function limparCEP(cep) {
    // Remove todos os caracteres não numéricos e pega apenas os primeiros 8 dígitos
    return cep.replace(/\D/g, '').substring(0, 8);
}

// Função para validar CEP via ViaCEP
export async function consultarViaCEP(cep) {
    const cepLimpo = limparCEP(cep);
    if (cepLimpo.length !== 8) {
        return { valido: false, data: null };
    }
    const url = `https://viacep.com.br/ws/${cepLimpo}/json/`;
    try {
        const response = await axios.get(url);
        if (response.data && !response.data.erro) {
            return { valido: true, data: response.data };
        } else {
            return { valido: false, data: null };
        }
    } catch (error) {
        return { valido: false, data: null };
    }
}

// Função para verificar viabilidade do CEP
export async function verificarViabilidadeCEP(cep) {
    return new Promise((resolve, reject) => {
        const cepLimpo = limparCEP(cep);
        const arquivoBase = path.resolve(process.cwd(), 'Base de Cobertura (Completa).csv');
        
        let encontrado = false;
        
        fs.createReadStream(arquivoBase)
            .pipe(csv())
            .on('data', (row) => {
                // Verifica se existe uma coluna com CEP e compara com o CEP informado
                const cepBase = row.CEP ? limparCEP(row.CEP) : null;
                if (cepBase === cepLimpo) {
                    encontrado = true;
                }
            })
            .on('end', () => {
                resolve(encontrado);
            })
            .on('error', (error) => {
                console.error('Erro ao ler arquivo de CEPs:', error);
                resolve(false); // Em caso de erro, assume que não tem viabilidade
            });
    });
} 