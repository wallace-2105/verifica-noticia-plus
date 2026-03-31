const mongoose = require('mongoose');
 
const sourceSchema = new mongoose.Schema({
  title: String,
  url: String,
  snippet: String
});
 
const checkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  inputType: {
    type: String,
    enum: ['text', 'url'],
    required: true
  },
  inputContent: {
    type: String,
    required: true
  },
  verdict: {
    type: String,
    enum: ['VERDADEIRO', 'FALSO', 'PARCIALMENTE VERDADEIRO', 'INCONCLUSIVO'],
    required: true
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100
  },
  explanation: {
    type: String,
    required: true
  },
  sources: [sourceSchema],
  articleTitle: String,
  articleContent: String,
  shareId: {
    type: String,
    unique: true,
    default: () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
 
module.exports = mongoose.model('Check', checkSchema);