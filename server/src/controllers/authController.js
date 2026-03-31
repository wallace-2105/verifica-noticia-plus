const jwt = require('jsonwebtoken');

const User = require('../models/User');
 
const generateToken = (id) => {

  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

};
 
const register = async (req, res) => {

  try {

    const { name, email, password } = req.body;
 
    if (!name || !email || !password) {

      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });

    }
 
    const existingUser = await User.findOne({ email });

    if (existingUser) {

      return res.status(400).json({ error: 'Email já cadastrado.' });

    }
 
    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);
 
    res.status(201).json({

      success: true,

      token,

      user: {

        id: user._id,

        name: user.name,

        email: user.email,

        createdAt: user.createdAt

      }

    });

  } catch (error) {

    if (error.name === 'ValidationError') {

      const messages = Object.values(error.errors).map(e => e.message);

      return res.status(400).json({ error: messages.join('. ') });

    }

    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });

  }

};
 
const login = async (req, res) => {

  try {

    const { email, password } = req.body;
 
    if (!email || !password) {

      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

    }
 
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {

      return res.status(401).json({ error: 'Email ou senha incorretos.' });

    }
 
    const token = generateToken(user._id);
 
    res.json({

      success: true,

      token,

      user: {

        id: user._id,

        name: user.name,

        email: user.email

      }

    });

  } catch (error) {

    res.status(500).json({ error: 'Erro ao fazer login.' });

  }

};
 
const getMe = async (req, res) => {

  res.json({

    success: true,

    user: {

      id: req.user._id,

      name: req.user.name,

      email: req.user.email,

      createdAt: req.user.createdAt

    }

  });

};
 
module.exports = { register, login, getMe };
 