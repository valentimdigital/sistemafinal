import { arquivarTodasConversas } from '../whatsapp.js';

export default {
    name: 'arquivar-tudo',
    description: 'Arquiva todas as conversas existentes e marca com a tag ARQUIVADO',
    execute: async () => {
        try {
            const resultado = await arquivarTodasConversas();
            return {
                success: true,
                message: `Processo concluído!\nTotal: ${resultado.total}\nArquivados: ${resultado.arquivados}\nMarcados: ${resultado.marcados}`
            };
        } catch (error) {
            return {
                success: false,
                message: `Erro ao arquivar conversas: ${error.message}`
            };
        }
    }
}; 