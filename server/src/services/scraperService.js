const axios = require('axios');
const cheerio = require('cheerio');
 
const scrapeArticle = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
 
    const $ = cheerio.load(response.data);
    $('script, style, nav, footer, header, aside').remove();
 
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('h1').first().text() ||
      $('title').text() ||
      'Título não encontrado';
 
    let content = '';
    const selectors = ['article', '.article-body', '.post-content', '.entry-content', 'main'];
 
    for (const selector of selectors) {
      if ($(selector).length) {
        content = $(selector).text();
        break;
      }
    }
 
    if (!content) content = $('body').text();
 
    content = content.replace(/\s+/g, ' ').trim().substring(0, 3000);
 
    return { success: true, title: title.trim(), content, url };
 
  } catch (error) {
    throw new Error(`Não foi possível acessar a URL: ${error.message}`);
  }
};
 
module.exports = { scrapeArticle };