const authRoutes = require('./routes/auth');
const atendimentoRoutes = require('./routes/atendimentos');
const discadoraRoutes = require('./routes/discadora');
 
// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/atendimentos', atendimentoRoutes);
app.use('/api/discadora', discadoraRoutes); 