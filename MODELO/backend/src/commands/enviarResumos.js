import { enviarResumosDiarios } from '../utils/enviarResumosDiarios.js';

console.log('🚀 Iniciando envio de resumos diários...');

enviarResumosDiarios()
    .then(() => {
        console.log('✅ Processo de envio de resumos concluído com sucesso!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Erro ao executar envio de resumos:', error);
        process.exit(1);
    }); 