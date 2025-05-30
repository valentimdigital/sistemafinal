import { adicionarEtiquetaIgnorar } from '../utils/labelUtils.js';

const numeroParaIgnorar = '+5527997312281';

async function ignorarNumero() {
    try {
        console.log('🚀 Iniciando processo de ignorar contato...');
        
        await adicionarEtiquetaIgnorar(numeroParaIgnorar);
        console.log('✅ Etiqueta IgnorarBot adicionada com sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro ao adicionar etiqueta:', error);
        process.exit(1);
    }
}

ignorarNumero(); 