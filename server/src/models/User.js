const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');
 
const userSchema = new mongoose.Schema({

  name: {

    type: String,

    required: [true, 'Nome é obrigatório'],

    trim: true,

    minlength: [2, 'Nome deve ter pelo menos 2 caracteres']

  },

  email: {

    type: String,

    required: [true, 'Email é obrigatório'],

    unique: true,

    lowercase: true,

    trim: true,

    match: [/^\S+@\S+\.\S+$/, 'Email inválido']

  },

  password: {

    type: String,

    required: [true, 'Senha é obrigatória'],

    minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],

    select: false

  },

  avatar: {

    type: String,

    default: ''

  },

  createdAt: {

    type: Date,

    default: Date.now

  }

});
 
userSchema.pre('save', async function(next) {

  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  next();

});
 
userSchema.methods.comparePassword = async function(candidatePassword) {

  return await bcrypt.compare(candidatePassword, this.password);

};
 
module.exports = mongoose.model('User', userSchema);
 