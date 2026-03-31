const jwt = require('jsonwebtoken');
const User = require('../models/User');
 
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
 
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }
 
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
 
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }
 
    req.user = user;
    return next();
 
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}
 
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
 
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      req.user = user || null;
    } else {
      req.user = null;
    }
 
    return next();
 
  } catch (error) {
    req.user = null;
    return next();
  }
}
 
module.exports = { protect, optionalAuth };