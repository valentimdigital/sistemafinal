import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const listarConversas = async () => {
    try {
        const response = await axios.get(`${API_URL}/conversas`);
        return response.data;
    } catch (error) {
        console.error('Erro ao listar conversas:', error);
        throw error;
    }
};

export const buscarMensagens = async (contatoId, page = 1, limit = 50) => {
    try {
        const response = await axios.get(`${API_URL}/conversas/${contatoId}/mensagens`, {
            params: { page, limit }
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        throw error;
    }
}; 