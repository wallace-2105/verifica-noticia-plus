const Check = require('../models/Check');
const { checkWithAI } = require('../services/aiService');
const { scrapeArticle } = require('../services/scraperService');
 
const checkText = async (req, res) => {
  try {
    const { text } = req.body;
 
    if (!text || text.trim().length < 5) {
      return res.status(400).json({ error: 'Texto muito curto para análise.' });
    }
 
    if (text.length > 2000) {
      return res.status(400).json({ error: 'Texto muito longo. Máximo 2000 caracteres.' });
    }
 
    // checkWithAI agora já busca na News API e determina o veredito
    const result = await checkWithAI(text, 'text');
 
    // Tenta salvar no MongoDB (se estiver conectado)
    let checkId = null;
    let shareId = null;
    try {
      const check = await Check.create({
        userId: req.user?._id || null,
        inputType: 'text',
        inputContent: text,
        verdict: result.verdict,
        confidenceScore: result.confidenceScore,
        explanation: result.explanation,
        sources: result.sources,
        articleTitle: result.summary
      });
      checkId = check._id;
      shareId = check.shareId;
    } catch (dbError) {
      console.error('MongoDB não disponível, retornando sem salvar:', dbError.message);
      shareId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
 
    return res.json({
      success: true,
      checkId,
      shareId,
      verdict: result.verdict,
      confidenceScore: result.confidenceScore,
      summary: result.summary,
      explanation: result.explanation,
      keyPoints: result.keyPoints,
      sources: result.sources,
      inputType: 'text',
      inputContent: text,
      createdAt: new Date()
    });
 
  } catch (error) {
    console.error('Erro checkText:', error);
    return res.status(500).json({ error: error.message || 'Erro ao verificar texto.' });
  }
};
 
const checkUrl = async (req, res) => {
  try {
    const { url } = req.body;
 
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória.' });
    }
 
    try { new URL(url); } catch {
      return res.status(400).json({ error: 'URL inválida.' });
    }
 
    const article = await scrapeArticle(url);
 
    if (!article.content || article.content.length < 50) {
      return res.status(400).json({ error: 'Não foi possível extrair conteúdo da URL.' });
    }
 
    const contentToAnalyze = `Título: ${article.title}\n\nConteúdo: ${article.content}`;
    const result = await checkWithAI(contentToAnalyze, 'url');
 
    // Tenta salvar no MongoDB (se estiver conectado)
    let checkId = null;
    let shareId = null;
    try {
      const check = await Check.create({
        userId: req.user?._id || null,
        inputType: 'url',
        inputContent: url,
        verdict: result.verdict,
        confidenceScore: result.confidenceScore,
        explanation: result.explanation,
        sources: result.sources,
        articleTitle: article.title,
        articleContent: article.content.substring(0, 500)
      });
      checkId = check._id;
      shareId = check.shareId;
    } catch (dbError) {
      console.error('MongoDB não disponível, retornando sem salvar:', dbError.message);
      shareId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
 
    return res.json({
      success: true,
      checkId,
      shareId,
      verdict: result.verdict,
      confidenceScore: result.confidenceScore,
      summary: result.summary,
      explanation: result.explanation,
      keyPoints: result.keyPoints,
      sources: result.sources,
      inputType: 'url',
      inputContent: url,
      articleTitle: article.title,
      createdAt: new Date()
    });
 
  } catch (error) {
    console.error('Erro checkUrl:', error);
    return res.status(500).json({ error: error.message || 'Erro ao verificar URL.' });
  }
};
 
const getByShareId = async (req, res) => {
  try {
    const check = await Check.findOne({ shareId: req.params.shareId });
 
    if (!check) {
      return res.status(404).json({ error: 'Verificação não encontrada.' });
    }
 
    return res.json({ success: true, check });
 
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar verificação.' });
  }
};
 
module.exports = { checkText, checkUrl, getByShareId };