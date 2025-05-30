// Configurações do atendimento
export const MENSAGENS = {
    BOAS_VINDAS: `Olá! 👋 É um prazer ter você por aqui na Parceria TIM Valentim Digital.\nPara iniciarmos, poderia me informar seu *nome*, por gentileza? 😊`,
    
    MENU_OPCOES: (nome) => `📩 Oi, ${nome}! 👋\nEstamos felizes em te ajudar! Qual solução você busca hoje?\nEnvie o número da opção desejada:\n\n1 - 💼 Atendimento Corporativo (CNPJ)\n2 - ⚡ Internet ULTRA Fibra\n3 - 📱 Ativação de Novas Linhas\n4 - 🔄 Portabilidade de Número`,
    
    ERRO_OPCAO: `❌ Opção inválida. Por favor, escolha uma das opções disponíveis.`,
    
    ERRO_GENERICO: `❌ Desculpe, ocorreu um erro. Por favor, tente novamente.`,
    
    ENCAMINHANDO_ATENDENTE: `👨‍💼 Estou encaminhando você para um de nossos atendentes especializados. Em breve alguém entrará em contato.`,
    
    TIMEOUT: `⏰ Sua sessão expirou por inatividade. Para iniciar um novo atendimento, envie qualquer mensagem.`,
    
    AGUARDE: `⌛ Por favor, aguarde um momento...`,
    
    CONSULTANDO_CEP: `🔍 Consultando seu CEP, um momento por favor...`,
    
    ERRO_CEP: `❌ CEP não encontrado ou inválido. Por favor, verifique e tente novamente.`,
    
    ERRO_CNPJ: `❌ CNPJ inválido ou não encontrado. Por favor, verifique e tente novamente.`
};

// Configurações gerais
export const CONFIG = {
    // Tempo limite para uma sessão de atendimento (em minutos)
    SESSAO_TIMEOUT: 15,
    
    // Limite de tentativas para input inválido
    MAX_TENTATIVAS: 3,
    
    // Configurações de validação
    VALIDACAO: {
        // Mínimo de caracteres para o nome
        MIN_CHARS_NOME: 3,
        
        // Regex para validação básica de CNPJ
        REGEX_CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/,
        
        // Regex para validação básica de CEP
        REGEX_CEP: /^\d{5}\-?\d{3}$/
    },
    
    // Configurações de mensagens de erro
    MENSAGENS_ERRO: {
        NOME_INVALIDO: 'Por favor, digite um nome válido com pelo menos 3 caracteres.',
        CNPJ_INVALIDO: 'CNPJ inválido. Por favor, digite no formato: XX.XXX.XXX/XXXX-XX',
        CEP_INVALIDO: 'CEP inválido. Por favor, digite no formato: XXXXX-XXX',
        OPCAO_INVALIDA: 'Opção inválida. Por favor, escolha uma das opções disponíveis.',
        TIMEOUT: 'Sessão expirada por inatividade. Por favor, inicie um novo atendimento.'
    },
    
    // Configurações de produtos/planos
    PLANOS: {
        EMPRESARIAL: [
            {
                nome: 'TIM Black Empresa 6GB',
                valor: 'R$ 89,99',
                beneficios: [
                    'Internet 6GB',
                    'Ligações ilimitadas',
                    'WhatsApp ilimitado'
                ]
            },
            {
                nome: 'TIM Black Empresa 50GB',
                valor: 'R$ 129,99',
                beneficios: [
                    'Internet 50GB',
                    'Ligações ilimitadas',
                    'WhatsApp e Redes Sociais ilimitados'
                ]
            }
        ]
    }
}; 