import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001/api'
});

export const getEstatisticas = async () => {
    try {
        const response = await api.get('/analise/estatisticas-tempo-real');
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        throw error;
    }
};

export const getSentimentos = async () => {
    try {
        const response = await api.get('/analise/geral');
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar sentimentos:', error);
        throw error;
    }
};

export const getSentimentoContato = async (contatoId) => {
    try {
        const response = await api.get(`/analise/sentimento/${contatoId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar sentimento do contato:', error);
        throw error;
    }
};

export const getVendas = async () => {
    try {
        const response = await api.get('/vendas');
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar vendas:', error);
        throw error;
    }
};

export const getContatos = async () => {
    try {
        const response = await api.get('/contatos');
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        throw error;
    }
};

export default api; 