import { adicionarEtiquetaIgnorar } from '../utils/labelUtils.js';

export async function handleIgnorarNumero(numero) {
    try {
        console.log(`🚀 Iniciando processo de ignorar contato: ${numero}`);
        
        await adicionarEtiquetaIgnorar(numero);
        console.log('✅ Etiqueta IgnorarBot adicionada com sucesso!');
        return true;

    } catch (error) {
        console.error('❌ Erro ao adicionar etiqueta:', error);
        return false;
    }
} 