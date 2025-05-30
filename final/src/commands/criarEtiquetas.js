import { initializeWhatsApp } from '../whatsapp.js';

const ETIQUETAS = [
    {
        nome: 'ATENCAO',
        cor: '#FF0000' // Vermelho
    },
    {
        nome: 'ARQUIVADO',
        cor: '#808080' // Cinza
    }
];

async function criarEtiquetas() {
    try {
        console.log('🚀 Iniciando criação de etiquetas...');
        
        // Inicializa o WhatsApp
        console.log('📱 Inicializando conexão com WhatsApp...');
        const { getGlobalSock } = await initializeWhatsApp();
        
        // Aguarda 5 segundos para garantir que a conexão foi estabelecida
        console.log('⏳ Aguardando conexão ser estabelecida...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const sock = getGlobalSock();
        if (!sock) {
            throw new Error('Socket não inicializado');
        }

        // Busca etiquetas existentes
        const labels = await sock.getLabels();
        console.log(`📝 Encontradas ${labels.length} etiquetas existentes`);

        // Cria cada etiqueta se não existir
        for (const etiqueta of ETIQUETAS) {
            const existe = labels.some(label => label.name.toUpperCase() === etiqueta.nome);
            
            if (!existe) {
                console.log(`➕ Criando etiqueta "${etiqueta.nome}"...`);
                await sock.createLabel(etiqueta.nome, etiqueta.cor);
                console.log(`✅ Etiqueta "${etiqueta.nome}" criada com sucesso!`);
            } else {
                console.log(`ℹ️ Etiqueta "${etiqueta.nome}" já existe.`);
            }
        }

        console.log('✅ Processo concluído!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro ao criar etiquetas:', error);
        process.exit(1);
    }
}

// Executa a função
criarEtiquetas(); 