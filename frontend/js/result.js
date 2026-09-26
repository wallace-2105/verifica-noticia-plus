// frontend/js/result.js
// Visualização Premium do Veredito, Medidor de Confiança e Ações de Compartilhamento

document.addEventListener('DOMContentLoaded', async () => {
  auth.updateNavbar();

  const urlParams = new URLSearchParams(window.location.search);
  const shareId = urlParams.get('id');
  const cached = sessionStorage.getItem('vn_result');

  let result = null;

  if (cached) {
    try {
      result = JSON.parse(cached);
      // Mantém no sessionStorage para recarregamentos rápidos
    } catch (e) {
      result = null;
    }
  }

  // Se não tiver em cache ou se o shareId for diferente, busca na API
  if (!result && shareId) {
    try {
      const data = await api.getByShareId(shareId);
      result = data.check;
    } catch (e) {
      renderNotFound();
      return;
    }
  }

  if (!result) {
    window.location.href = 'index.html';
    return;
  }

  // Salva no histórico local para conveniência do usuário
  saveToLocalHistory(result);

  // Renderiza a interface completa
  renderResult(result);
});

function renderNotFound() {
  const container = document.getElementById('resultPage');
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state" style="margin-top:60px;">
      <div class="empty-state-icon">
        <i class="fa-solid fa-triangle-exclamation" style="font-size:3.5rem; color:var(--partial-color);"></i>
      </div>
      <h3>Verificação Não Encontrada</h3>
      <p>O link compartilhado pode ter expirado ou o identificador está incorreto.</p>
      <a href="index.html" class="btn btn-primary btn-lg">
        <i class="fa-solid fa-magnifying-glass"></i> Fazer Nova Verificação
      </a>
    </div>
  `;
}

function renderResult(result) {
  const container = document.getElementById('resultPage');
  if (!container) return;

  const verdict = result.verdict || 'INCONCLUSIVO';
  const confidence = result.confidenceScore || 0;
  const verdictClass = getVerdictThemeClass(verdict);
  const verdictIcon = getVerdictIconSvg(verdict);
  const reliabilityLabel = getReliabilityLabel(confidence, verdict);

  const shareUrl = `${window.location.origin}/result.html?id=${result.shareId || result.checkId || ''}`;
  const dateFormatted = formatDate(result.createdAt);

  const displayTitle = result.articleTitle || result.inputContent || 'Informação Analisada';
  const shortSnippet = (result.summary || result.explanation || '').substring(0, 160);

  // Mensagem pré-formatada para o WhatsApp
  const whatsappMsg = encodeURIComponent(
    `🚨 *ALERTA DE FAKE NEWS — VERIFICA NOTÍCIA*\n\n` +
    `📌 *Veredito:* [ ${verdict} ]\n` +
    `📊 *Nível de Confiança:* ${confidence}%\n\n` +
    `📝 *Resumo:* ${shortSnippet}...\n\n` +
    `👉 *Confira a análise completa e as fontes:* ${shareUrl}`
  );

  // Mensagem para o Twitter / X
  const twitterMsg = encodeURIComponent(
    `Checagem de notícia pelo Verifica Notícia: Veredito [${verdict}] com ${confidence}% de confiança. Confira:`
  );

  // Pontos-chave
  const keyPoints = result.keyPoints || [];
  const keyPointsHtml = keyPoints.length > 0 ? `
    <div class="result-info-card">
      <h3 class="card-heading">
        <i class="fa-solid fa-list-check"></i> Pontos Críticos da Checagem
      </h3>
      <div class="key-points-grid">
        ${keyPoints.map(point => `
          <div class="key-point-row">
            <i class="fa-solid fa-circle-check key-point-icon"></i>
            <span>${escapeHtml(point)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  // Fontes Jornalísticas
  const sources = result.sources || [];
  const sourcesHtml = sources.length > 0 ? `
    <div class="result-info-card">
      <h3 class="card-heading">
        <i class="fa-solid fa-newspaper"></i> Fontes & Cobertura da Imprensa (${sources.length})
      </h3>
      <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:16px;">
        As seguintes fontes foram consultadas para embasar este veredito:
      </p>
      <div class="sources-grid">
        ${sources.map(s => `
          <a href="${s.url}" target="_blank" rel="noopener noreferrer" class="source-item-card">
            <div class="source-item-top">
              <span class="source-publisher-badge">
                <i class="fa-solid fa-shield-halved"></i> ${escapeHtml(s.source || 'Veículo de Notícias')}
              </span>
              <span style="font-size:0.78rem; color:var(--text-muted);">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Acessar fonte
              </span>
            </div>
            <h4 class="source-item-title">${escapeHtml(s.title || 'Artigo de referência')}</h4>
            ${s.snippet ? `<p class="source-item-snippet">${escapeHtml(s.snippet)}</p>` : ''}
          </a>
        `).join('')}
      </div>
    </div>
  ` : `
    <div class="result-info-card" style="text-align:center; padding:32px;">
      <i class="fa-solid fa-magnifying-glass-chart" style="font-size:2.4rem; color:var(--text-muted); margin-bottom:12px;"></i>
      <h4 style="margin-bottom:6px;">Nenhuma fonte de imprensa reportando este fato</h4>
      <p style="color:var(--text-secondary); font-size:0.9rem;">
        A ausência de registros jornalísticos em grandes veículos é um dos principais indicadores de boatos ou conteúdos inventados.
      </p>
    </div>
  `;

  container.innerHTML = `
    <div class="result-container">
      
      <!-- CARD HERO DE VEREDITO -->
      <div class="verdict-hero-card ${verdictClass}">
        <div class="verdict-main-badge">
          ${verdictIcon} <span>${verdict}</span>
        </div>

        <h1 style="font-size:1.6rem; margin-bottom:16px; font-weight:800;">
          "${escapeHtml(displayTitle)}"
        </h1>

        <!-- Medidor de Confiança -->
        <div class="confidence-meter-wrap">
          <div class="confidence-header">
            <span>Score de Confiança da IA</span>
            <span style="font-size:1.1rem; font-weight:800;">${confidence}%</span>
          </div>
          <div class="confidence-track">
            <div class="confidence-bar" id="resultConfidenceBar"></div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:0.8rem; color:var(--text-secondary);">
            <span>${reliabilityLabel}</span>
            <span>Verificado em ${dateFormatted}</span>
          </div>
        </div>
      </div>

      <!-- BARRA DE AÇÕES & COMPARTILHAMENTO -->
      <div class="result-actions-bar">
        <a href="https://api.whatsapp.com/send?text=${whatsappMsg}" target="_blank" rel="noopener noreferrer" class="btn btn-share-whatsapp btn-lg" title="Compartilhar no WhatsApp">
          <i class="fa-brands fa-whatsapp" style="font-size:1.2rem;"></i> Compartilhar no WhatsApp
        </a>

        <a href="https://twitter.com/intent/tweet?text=${twitterMsg}&url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-share-twitter btn-lg" title="Compartilhar no X (Twitter)">
          <i class="fa-brands fa-x-twitter"></i> Compartilhar
        </a>

        <button onclick="copyShareLink('${shareUrl}')" class="btn btn-outline btn-lg" title="Copiar link para a área de transferência">
          <i class="fa-solid fa-link"></i> Copiar Link
        </button>

        <button onclick="window.print()" class="btn btn-ghost btn-lg" title="Imprimir ou exportar relatório em PDF">
          <i class="fa-solid fa-print"></i> Relatório PDF
        </button>

        <a href="index.html" class="btn btn-primary btn-lg">
          <i class="fa-solid fa-rotate-left"></i> Nova Verificação
        </a>
      </div>

      <!-- RESUMO EXECUTIVO -->
      <div class="result-info-card">
        <h3 class="card-heading">
          <i class="fa-solid fa-file-lines"></i> Resumo da Checagem
        </h3>
        <p class="executive-summary-text">${escapeHtml(result.summary || 'Análise concluída com base nas evidências coletadas.')}</p>
      </div>

      <!-- ANÁLISE DETALHADA -->
      <div class="result-info-card">
        <h3 class="card-heading">
          <i class="fa-solid fa-magnifying-glass-chart"></i> Análise Factual Completa
        </h3>
        <p class="detailed-text">${escapeHtml(result.explanation || 'Nenhuma explicação adicional fornecida.')}</p>
      </div>

      <!-- PONTOS-CHAVE -->
      ${keyPointsHtml}

      <!-- FONTES -->
      ${sourcesHtml}

      <!-- CONTEÚDO ORIGINAL SUBMETIDO -->
      <div class="result-info-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 class="card-heading" style="margin:0;">
            <i class="fa-solid fa-quote-left"></i> Conteúdo Original Submetido
          </h3>
          <button class="btn btn-ghost btn-sm" onclick="copyOriginalText('${escapeJs(result.inputContent)}')">
            <i class="fa-solid fa-copy"></i> Copiar Texto
          </button>
        </div>
        <div class="original-content-box">
          "${escapeHtml(result.inputContent || '')}"
        </div>
      </div>

      <!-- BOTÃO INFERIOR DE NOVA VERIFICAÇÃO -->
      <div style="text-align:center; margin-top:40px;">
        <a href="index.html" class="btn btn-primary btn-xl">
          <i class="fa-solid fa-magnifying-glass"></i> Verificar Outra Notícia
        </a>
      </div>

    </div>
  `;

  // Anima a barra de confiança suavemente
  setTimeout(() => {
    const bar = document.getElementById('resultConfidenceBar');
    if (bar) bar.style.width = `${confidence}%`;
  }, 100);
}

// Helpers de Estilo do Veredito
function getVerdictThemeClass(verdict) {
  if (verdict === 'VERDADEIRO') return 'verdict-true';
  if (verdict === 'FALSO') return 'verdict-false';
  if (verdict === 'PARCIALMENTE VERDADEIRO') return 'verdict-partial';
  return 'verdict-inconclusive';
}

function getVerdictIconSvg(verdict) {
  if (verdict === 'VERDADEIRO') return '<i class="fa-solid fa-circle-check"></i>';
  if (verdict === 'FALSO') return '<i class="fa-solid fa-triangle-exclamation"></i>';
  if (verdict === 'PARCIALMENTE VERDADEIRO') return '<i class="fa-solid fa-circle-half-stroke"></i>';
  return '<i class="fa-solid fa-circle-question"></i>';
}

function getReliabilityLabel(score, verdict) {
  if (verdict === 'FALSO') return 'Alta evidência de desinformação';
  if (score >= 80) return 'Alta confiabilidade factual';
  if (score >= 50) return 'Confiabilidade moderada';
  return 'Baixa evidência / Inconclusivo';
}

function copyShareLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link de compartilhamento copiado!', 'success');
  }).catch(() => {
    showToast('Não foi possível copiar o link.', 'error');
  });
}

function copyOriginalText(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Conteúdo original copiado!', 'success');
  }).catch(() => {
    showToast('Não foi possível copiar.', 'error');
  });
}

function saveToLocalHistory(result) {
  try {
    const raw = localStorage.getItem('vn_local_history');
    let list = raw ? JSON.parse(raw) : [];
    
    // Evita duplicatas
    const key = result.shareId || result.checkId;
    list = list.filter(item => (item.shareId !== key && item.checkId !== key));
    list.unshift({
      ...result,
      createdAt: result.createdAt || new Date().toISOString()
    });

    if (list.length > 30) list = list.slice(0, 30);
    localStorage.setItem('vn_local_history', JSON.stringify(list));
  } catch (err) {
    console.warn('Erro ao salvar no histórico local:', err);
  }
}

function formatDate(d) {
  if (!d) return 'Hoje';
  const date = new Date(d);
  return isNaN(date.getTime()) ? 'Hoje' : date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJs(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
}