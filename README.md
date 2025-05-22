# Sistema de Atendimento Valentim Digital

Sistema completo de atendimento ao cliente, com discadora, dashboard e portal.

## 🚀 Tecnologias

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- Socket.IO
- Baileys (WhatsApp)

### Frontend
- React
- Vite
- Tailwind CSS
- Axios
- React Router
- Chart.js

## 📦 Estrutura do Projeto

```
├── backend/               # API Node.js + Express
│   ├── models/           # Modelos MongoDB
│   ├── routes/           # Rotas da API
│   └── src/              # Código fonte do backend
│
├── frontend/             # Aplicação React
│   ├── public/           # Arquivos estáticos
│   └── src/              # Código fonte do frontend
│
├── dashboard/            # Dashboard administrativo
│   ├── public/           # Arquivos estáticos
│   └── src/              # Código fonte do dashboard
│
├── discadora/            # Sistema de discagem
│   ├── frontend/         # Interface da discadora
│   └── backend/          # API da discadora
│
└── home-portal/          # Portal do cliente
    ├── public/           # Arquivos estáticos
    └── src/              # Código fonte do portal
```

## 🛠️ Instalação

### Pré-requisitos
- Node.js 16+
- MongoDB
- NPM ou Yarn

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Dashboard
```bash
cd dashboard
npm install
npm run dev
```

### Discadora
```bash
cd discadora
npm install
npm start
```

### Home Portal
```bash
cd home-portal
npm install
npm run dev
```

## 🌟 Funcionalidades

### Sistema de Atendimento
- Chat em tempo real
- Integração com WhatsApp
- Histórico de atendimentos
- Análise de sentimento
- Dashboard de métricas

### Discadora
- Cadastro de clientes
- Discagem automática
- Relatórios de atendimento
- Gestão de status
- Histórico de chamadas

### Dashboard
- Métricas em tempo real
- Gráficos de desempenho
- Análise de atendimentos
- Relatórios exportáveis
- Gestão de usuários

### Portal do Cliente
- Área do cliente
- Histórico de atendimentos
- Suporte online
- Documentos e contratos

## 🔧 Configuração

### MongoDB
```javascript
// backend/server.js
mongoose.connect('mongodb://localhost:27017/valentim_digital', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
```

### WhatsApp (Baileys)
```javascript
// backend/src/whatsapp.js
const { default: makeWASocket } = require('@whiskeysockets/baileys');
```

## 📊 Rotas da API

### Atendimentos
- `GET /api/atendimentos` - Lista todos os atendimentos
- `POST /api/atendimentos` - Cria novo atendimento
- `GET /api/atendimentos/:id` - Busca atendimento por ID

### Discadora
- `GET /api/discadora/clientes` - Lista todos os clientes
- `POST /api/discadora/clientes` - Adiciona novo cliente
- `PATCH /api/discadora/clientes/:id` - Atualiza cliente
- `DELETE /api/discadora/clientes/:id` - Remove cliente

## 🤝 Contribuição

1. Faça o fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, envie um email para suporte@valentimdigital.com.br ou abra uma issue no GitHub.

---

Desenvolvido com ❤️ por Valentim Digital 