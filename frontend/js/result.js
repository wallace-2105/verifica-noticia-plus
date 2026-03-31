document.addEventListener('DOMContentLoaded', async () => {
  auth.updateNavbar();
 
  const urlParams = new URLSearchParams(window.location.search);
  const shareId = urlParams.get('id');
  const cached = sessionStorage.getItem('vn_result');
 
  let result = null;
 
  if (cached) {
    result = JSON.parse(cached);
    sessionStorage.removeItem('vn_result');
  } else if (shareId) {
    try {
      const data = await api.getByShareId(shareId);
      result = data.check;
    } catch (e) {
      document.getElementById('resultPage').innerHTML =
        `<div class="empty-state"><div class="empty-icon">😕</div><h3>Resultado não encontrado</h3><p>O link pode ter expirado.</p><a href="index.html" class="btn btn-primary">Verificar nova notícia</a></div>`;
      return;
    }
  }
 
  if (!result) {
    window.location.href = 'index.html';
    return;
  }
 
  renderResult(result);
});
 
function getVerdictClass(verdict) {
  if (verdict === 'VERDADEIRO') return 'verdict-true';
  if (verdict === 'FALSO') return 'verdict-false';
  if (verdict === 'PARCIALMENTE VERDADEIRO') return 'verdict-partial';
  return 'verdict-inconclusive';
}
 
function getVerdictIcon(verdict) {
  if (verdict === 'VERDADEIRO') return '✅';
  if (verdict === 'FALSO') return '❌';
  if (verdict === 'PARCIALMENTE VERDADEIRO') return '⚠️';
  return '❓';
}
 
function renderResult(result) {
  const verdictClass = getVerdictClass(result.verdict);
  const icon = getVerdictIcon(result.verdict);
  const shareUrl = `${window.location.origin}/frontend/result.html?id=${result.shareId}`;
  const date = new Date(result.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Gera HTML dos key points
  const keyPointsHtml = (result.keyPoints || []).map(point =>
    `<li><i class="fa-solid fa-circle-check" style="color:var(--primary);margin-right:8px;"></i>${point}</li>`
  ).join('');

  // Gera HTML das fontes
  const sourcesHtml = (result.sources || []).length > 0
    ? result.sources.map(source => `
      <div class="source-card" style="background:var(--surface);border-radius:12px;padding:16px;margin-bottom:12px;border:1px solid var(--border);">
        <a href="${source.url}" target="_blank" rel="noopener" style="font-weight:600;color:var(--primary);text-decoration:none;font-size:0.95rem;">
          ${source.title || 'Sem título'}
        </a>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin:6px 0 4px;">${source.snippet || ''}</p>
        <span style="font-size:0.75rem;color:var(--text-muted);">${source.source || ''} ${source.publishedAt ? '• ' + new Date(source.publishedAt).toLocaleDateString('pt-BR') : ''}</span>
      </div>
    `).join('')
    : '<p style="color:var(--text-secondary);text-align:center;padding:20px;">Nenhuma fonte encontrada.</p>';

  document.getElementById('resultPage').innerHTML = `
    <div style="max-width:720px;margin:0 auto;padding:40px 24px;">

      <!-- Veredito -->
      <div class="${verdictClass}" style="text-align:center;padding:40px 24px;border-radius:16px;margin-bottom:32px;">
        <div style="font-size:3rem;margin-bottom:12px;">${icon}</div>
        <h1 style="font-size:2rem;font-weight:800;margin:0 0 8px;">${result.verdict}</h1>
        <p style="font-size:1rem;opacity:0.85;">Confiança: <strong>${result.confidenceScore}%</strong></p>
        <p style="font-size:0.85rem;opacity:0.7;margin-top:4px;">${date}</p>
      </div>

      <!-- Resumo -->
      <div style="background:var(--surface);border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid var(--border);">
        <h3 style="margin:0 0 12px;"><i class="fa-solid fa-file-lines" style="color:var(--primary);margin-right:8px;"></i>Resumo</h3>
        <p style="color:var(--text-secondary);line-height:1.7;">${result.summary || ''}</p>
      </div>

      <!-- Explicação -->
      <div style="background:var(--surface);border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid var(--border);">
        <h3 style="margin:0 0 12px;"><i class="fa-solid fa-magnifying-glass-chart" style="color:var(--primary);margin-right:8px;"></i>Análise Detalhada</h3>
        <p style="color:var(--text-secondary);line-height:1.7;">${result.explanation || ''}</p>
      </div>

      <!-- Pontos-chave -->
      ${keyPointsHtml.length > 0 ? `
      <div style="background:var(--surface);border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid var(--border);">
        <h3 style="margin:0 0 12px;"><i class="fa-solid fa-list-check" style="color:var(--primary);margin-right:8px;"></i>Pontos-Chave</h3>
        <ul style="list-style:none;padding:0;margin:0;color:var(--text-secondary);line-height:2;">${keyPointsHtml}</ul>
      </div>` : ''}

      <!-- Fontes -->
      <div style="background:var(--surface);border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid var(--border);">
        <h3 style="margin:0 0 16px;"><i class="fa-solid fa-newspaper" style="color:var(--primary);margin-right:8px;"></i>Fontes (${result.sources?.length || 0})</h3>
        ${sourcesHtml}
      </div>

      <!-- Texto verificado -->
      <div style="background:var(--surface);border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid var(--border);">
        <h3 style="margin:0 0 12px;"><i class="fa-solid fa-quote-left" style="color:var(--primary);margin-right:8px;"></i>Conteúdo Verificado</h3>
        <p style="color:var(--text-secondary);font-style:italic;line-height:1.7;background:var(--background);padding:16px;border-radius:8px;">"${result.inputContent || ''}"</p>
      </div>

      <!-- Ações -->
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <a href="index.html" class="btn btn-primary"><i class="fa-solid fa-rotate-left" style="margin-right:6px;"></i>Nova Verificação</a>
        <button onclick="navigator.clipboard.writeText('${shareUrl}');this.textContent='✓ Link copiado!';setTimeout(()=>this.innerHTML='<i class=\\'fa-solid fa-share-nodes\\' style=\\'margin-right:6px;\\'></i>Compartilhar',2000)" class="btn btn-outline">
          <i class="fa-solid fa-share-nodes" style="margin-right:6px;"></i>Compartilhar
        </button>
      </div>

    </div>
  `;
}