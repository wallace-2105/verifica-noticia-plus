require('dotenv').config();
const axios = require('axios');

/**
 * Busca notícias relacionadas na News API
 * Retorna os artigos encontrados formatados como sources
 */
const searchSources = async (query) => {
  try {
    if (!process.env.NEWS_API) {
      console.error('NEWS_API key não configurada no .env');
      return { sources: [], totalResults: 0 };
    }

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: query,
        sortBy: 'relevancy',
        pageSize: 20,
        apiKey: process.env.NEWS_API
      }
    });

    const totalResults = response.data.totalResults || 0;
    console.log(`[News API] Query: "${query}" → ${totalResults} resultados`);
    const sources = (response.data.articles || []).map(article => ({
      title: article.title,
      url: article.url,
      snippet: article.description || '',
      source: article.source?.name || 'Desconhecido',
      publishedAt: article.publishedAt
    }));

    return { sources, totalResults };

  } catch (error) {
    console.error('Erro News API:', error.response?.status, error.response?.data || error.message);
    return { sources: [], totalResults: 0 };
  }
};

/**
 * Determina o veredito com base na quantidade de resultados da News API
 * Lógica: mais fontes reportando = mais provável de ser verdadeiro
 */
const determineVerdict = (totalResults, sources) => {
  let verdict, confidenceScore, explanation;

  if (totalResults >= 10) {
    verdict = 'VERDADEIRO';
    confidenceScore = Math.min(95, 70 + totalResults);
    explanation = `Esta informação foi encontrada em ${totalResults} fontes de notícias diferentes. `
      + `A ampla cobertura por múltiplos veículos de imprensa indica alta credibilidade. `
      + `Fontes incluem: ${sources.slice(0, 5).map(s => s.source).join(', ')}.`;
  } else if (totalResults >= 5) {
    verdict = 'PARCIALMENTE VERDADEIRO';
    confidenceScore = 50 + (totalResults * 3);
    explanation = `Esta informação foi encontrada em ${totalResults} fontes de notícias. `
      + `Há cobertura moderada, o que sugere que a informação tem base factual, `
      + `mas recomenda-se verificar detalhes específicos. `
      + `Fontes encontradas: ${sources.slice(0, 5).map(s => s.source).join(', ')}.`;
  } else if (totalResults >= 1) {
    verdict = 'INCONCLUSIVO';
    confidenceScore = 20 + (totalResults * 8);
    explanation = `Esta informação foi encontrada em apenas ${totalResults} fonte(s) de notícias. `
      + `A baixa cobertura não permite confirmar nem negar a veracidade. `
      + `Recomenda-se buscar mais informações antes de compartilhar.`;
  } else {
    verdict = 'FALSO';
    confidenceScore = 15;
    explanation = `Nenhuma fonte de notícias confiável foi encontrada reportando esta informação. `
      + `A ausência total de cobertura jornalística é um forte indicador de que a informação `
      + `pode ser falsa, inventada ou extremamente distorcida. Não compartilhe sem verificar.`;
  }

  return { verdict, confidenceScore, explanation };
};

/**
 * Verifica uma notícia/texto usando a News API
 * Substitui a verificação por IA — lógica baseada em quantidade de fontes
 */
const checkWithAI = async (content, inputType) => {
  // Extrai os termos de busca do conteúdo
  // Se for URL, pega o título; se for texto, pega as primeiras palavras relevantes
  let searchQuery = content;

  // Limpa o conteúdo para busca
  if (inputType === 'url' && content.includes('Título:')) {
    // Extrai só o título quando vem de URL
    searchQuery = content.split('\n')[0].replace('Título:', '').trim();
  }

  // Limita a query para os primeiros 100 caracteres relevantes
  searchQuery = searchQuery.substring(0, 100).trim();

  // Busca na News API
  const { sources, totalResults } = await searchSources(searchQuery);

  // Determina o veredito baseado na quantidade de resultados
  const { verdict, confidenceScore, explanation } = determineVerdict(totalResults, sources);

  // Pontos-chave baseados nos resultados
  const keyPoints = [];
  keyPoints.push(`${totalResults} fonte(s) de notícias encontrada(s)`);

  if (sources.length > 0) {
    const uniqueSources = [...new Set(sources.map(s => s.source))];
    keyPoints.push(`Veículos: ${uniqueSources.slice(0, 5).join(', ')}`);
  }

  if (totalResults >= 10) {
    keyPoints.push('Alta cobertura midiática — informação amplamente reportada');
  } else if (totalResults === 0) {
    keyPoints.push('Nenhum veículo de notícias reportou esta informação');
  }

  return {
    verdict,
    confidenceScore,
    summary: `Verificação baseada em ${totalResults} fontes de notícias encontradas.`,
    explanation,
    keyPoints,
    searchQuery,
    sources // Passa as sources junto para o controller
  };
};

module.exports = { checkWithAI, searchSources };