const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conexão com MongoDB
mongoose.connect('mongodb://localhost:27017/valentim_digital', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/atendimentos', require('./routes/atendimentos'));
app.use('/api/discadora', require('./routes/discadora'));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 