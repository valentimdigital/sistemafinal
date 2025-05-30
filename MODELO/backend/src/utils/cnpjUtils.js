import axios from 'axios';

// Função para limpar CNPJ
export function limparCNPJ(cnpj) {
    return cnpj.replace(/\D/g, '');
}

// Função para validar CNPJ via ReceitaWS
export async function validarCNPJReceitaWS(cnpj) {
    const cnpjLimpo = limparCNPJ(cnpj);
    if (cnpjLimpo.length !== 14) {
        return { valido: false, status: 'INVALID_FORMAT', data: null };
    }
    const url = `https://receitaws.com.br/v1/cnpj/${cnpjLimpo}`;
    try {
        const response = await axios.get(url);
        if (response.status === 200 && response.data.status !== 'ERROR') {
            return { valido: true, status: 'OK', data: response.data };
        } else {
            return { valido: false, status: response.data.status || 'API_ERROR', data: response.data };
        }
    } catch (error) {
        return { valido: false, status: 'REQUEST_FAILED', data: null };
    }
} 