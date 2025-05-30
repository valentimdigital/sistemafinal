import { arquivarTodasConversas } from '../whatsapp.js';

console.log('🔄 Iniciando processo de arquivamento...');

setTimeout(async () => {
    try {
        const resultado = await arquivarTodasConversas();
        console.log('✅ Processo finalizado com sucesso!', resultado);
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}, 5000); // Aguarda 5 segundos para garantir que o WhatsApp esteja conectado 