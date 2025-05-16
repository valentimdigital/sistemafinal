# Painel de Atendimento WhatsApp com IA

Um painel de atendimento que permite gerenciar conversas do WhatsApp através de uma interface web moderna, integrando inteligência artificial para automação de respostas e vendas de produtos TIM.

## Funcionalidades

- Conexão com WhatsApp via Baileys
- Interface moderna com React e TailwindCSS
- Chat em tempo real com IA (Valentina)
- Lista de contatos e histórico de mensagens
- Envio e recebimento de mensagens
- QR Code para autenticação
- Integração com MongoDB para persistência de dados
- IA especializada em vendas TIM

## Requisitos

- Node.js 14+
- NPM ou Yarn
- MongoDB (opcional)
- Chave de API para IA (Google Gemini ou similar)

## Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITORIO]
cd whatsapp-panel
```

2. Instale as dependências do backend:
```bash
cd backend
npm install
```

3. Instale as dependências do frontend:
```bash
cd ../frontend
npm install
```

## Executando o Projeto

1. Inicie o backend:
```bash
cd backend
npm start
```

2. Em outro terminal, inicie o frontend:
```bash
cd frontend
npm start
```

3. Acesse o painel em `http://localhost:3000`

4. Escaneie o QR Code que aparecerá na tela para conectar ao WhatsApp

## Tecnologias Utilizadas

- Frontend:
  - React
  - TailwindCSS
  - Socket.IO Client
  - Heroicons

- Backend:
  - Node.js
  - Express
  - Baileys (WhatsApp API)
  - Socket.IO
  - MongoDB (opcional)
  - Google Gemini API (IA)

## Estrutura do Projeto

```
/ATENDIMENTOIAIAIAIA
│
├── backend
│   ├── src/
│   │   ├── index.js           # Inicialização do servidor Express, integração com WhatsApp e Socket.IO
│   │   ├── ai-config.js       # Configuração e prompt da IA Valentina
│   │   ├── gemini-service.js  # Serviço de integração com IA
│   │   ├── config/
│   │   │   └── database.js    # Configuração MongoDB
│   │   ├── models/
│   │   │   ├── Contato.js     # Modelo de dados para contatos
│   │   │   └── Mensagem.js    # Modelo de dados para mensagens
│   │   └── routes/
│   │       ├── contatos.js    # Rotas para CRUD de contatos
│   │       └── mensagens.js   # Rotas para CRUD de mensagens
│   └── package.json
│
└── frontend
    ├── src/
    │   ├── App.jsx            # Componente principal
    │   ├── main.jsx           # Ponto de entrada
    │   ├── index.css          # Estilos globais
    │   └── components/
    │       ├── Chat.jsx       # Componente de chat
    │       ├── Sidebar.jsx    # Barra lateral
    │       └── InfoPanel.jsx  # Painel de informações
    └── package.json
```

## Funcionalidades da IA (Valentina)

A IA Valentina é configurada para atuar como secretária executiva especializada em vendas TIM, com as seguintes características:

- Personalidade profissional e objetiva
- Foco em entender necessidades do cliente
- Especialista em produtos TIM:
  - TIM BLACK EMPRESA
  - TIM OFFICE
  - TIM EMPRESA INTERNET
  - LIBERTY WEB EMPRESA
  - M2M (Machine-to-Machine)
- Estratégia de vendas personalizada
- Respostas automáticas contextualizadas

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 