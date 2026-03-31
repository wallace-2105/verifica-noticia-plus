require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
 
const app = express();
 
// ── Middlewares de segurança ──
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true
}));
 
// ── Rate Limit ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Muitas requisições. Tente em 15 minutos.' }
});
app.use('/api/check', limiter);
 
// ── Body Parser ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
 
// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Verifica Notícia API rodando!' });
});
 
// ── Rotas ──
const authRoutes    = require('./routes/auth');
const checkRoutes   = require('./routes/check');
const historyRoutes = require('./routes/history');
 
// Debug — confirma que são funções
console.log('authRoutes tipo:', typeof authRoutes);
console.log('checkRoutes tipo:', typeof checkRoutes);
console.log('historyRoutes tipo:', typeof historyRoutes);
 
app.use('/api/auth',    authRoutes);
app.use('/api/check',   checkRoutes);
app.use('/api/history', historyRoutes);
 
// ── Error Handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});
 
// ── Conecta MongoDB e inicia servidor ──
const PORT = process.env.PORT || 5000;
 
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado!');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Erro MongoDB:', err.message);
    console.log('⚠️  Iniciando sem banco de dados...');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT} (sem banco)`);
    });
  });
 
module.exports = app;