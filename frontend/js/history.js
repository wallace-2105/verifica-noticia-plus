// frontend/js/history.js
// Gerenciamento completo e intuitivo do histórico (API + Local Storage)

let allChecks = [];
let currentFilter = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
  // Atualiza navbar e tema
  if (typeof auth !== 'undefined') auth.updateNavbar();
  initTheme();
  await loadHistory();
});

// Inicialização do tema escuro/claro
function initTheme() {
  const savedTheme = localStorage.getItem('vn_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('vn_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.innerHTML = theme === 'dark' 
      ? '<i class="fa-solid fa-sun" style="color:#f59e0b"></i>' 
      : '<i class="fa-solid fa-moon"></i>';
  }
}

// Carregar histórico
async function loadHistory() {
  const container = document.getElementById('historyContent');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align:center; padding:60px 20px;">
      <div class="loading-spinner" style="margin:0 auto 16px;"></div>
      <p style="color:var(--text-secondary); font-weight:500;">Carregando seu histórico de verificações...</p>
    </div>
  `;

  let apiChecks = [];
  const isLoggedIn = typeof auth !== 'undefined' && auth.isLoggedIn();

  if (isLoggedIn) {
    try {
      const response = await api.getHistory(1, 50);
      if (response && response.checks) {
        apiChecks = response.checks;
      }
    } catch (err) {
      console.warn('Erro ao carregar do servidor, usando histórico local:', err);
    }
  }

  // Carrega também do localStorage (garante que convidados e offline não percam dados)
  let localChecks = [];
  try {
    const raw = localStorage.getItem('vn_local_history');
    if (raw) localChecks = JSON.parse(raw);
  } catch (e) {
    localChecks = [];
  }

  // Mescla por shareId ou id sem duplicar
  const combinedMap = new Map();
  apiChecks.forEach(c => {
    const key = c.shareId || c._id;
    if (key) combinedMap.set(key, { ...c, isLocal: false });
  });

  localChecks.forEach(c => {
    const key = c.shareId || c.checkId || c._id;
    if (key && !combinedMap.has(key)) {
      combinedMap.set(key, { ...c, isLocal: true });
    }
  });

  allChecks = Array.from(combinedMap.values()).sort((a, b) => {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  renderHistoryView();
}

// Renderiza a interface completa do histórico
function renderHistoryView() {
  const container = document.getElementById('historyContent');
  if (!container) return;

  const isLoggedIn = typeof auth !== 'undefined' && auth.isLoggedIn();

  // Banner informativo para usuários não logados
  const guestBanner = !isLoggedIn ? `
    <div class="history-guest-banner">
      <div class="banner-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
      <div class="banner-text">
        <strong>Histórico Salvo Localmente</strong>
        <p>Você está vendo as verificações realizadas neste navegador. Crie uma conta gratuita para salvar na nuvem e acessar de qualquer lugar!</p>
      </div>
      <a href="register.html" class="btn btn-primary btn-sm">Cadastre-se Grátis</a>
    </div>
  ` : '';

  // Estatísticas Rápidas
  const total = allChecks.length;
  const countTrue = allChecks.filter(c => c.verdict === 'VERDADEIRO').length;
  const countFalse = allChecks.filter(c => c.verdict === 'FALSO').length;
  const countPartial = allChecks.filter(c => c.verdict === 'PARCIALMENTE VERDADEIRO').length;
  const countInconclusive = allChecks.filter(c => c.verdict === 'INCONCLUSIVO').length;

  const statsBar = total > 0 ? `
    <div class="history-metrics-grid">
      <div class="metric-card">
        <span class="metric-num">${total}</span>
        <span class="metric-lbl">Total Verificado</span>
      </div>
      <div class="metric-card metric-false">
        <span class="metric-num">${countFalse}</span>
        <span class="metric-lbl"><i class="fa-solid fa-triangle-exclamation"></i> Fake News</span>
      </div>
      <div class="metric-card metric-true">
        <span class="metric-num">${countTrue}</span>
        <span class="metric-lbl"><i class="fa-solid fa-circle-check"></i> Fatos Reais</span>
      </div>
      <div class="metric-card metric-partial">
        <span class="metric-num">${countPartial}</span>
        <span class="metric-lbl"><i class="fa-solid fa-circle-half-stroke"></i> Parcial</span>
      </div>
    </div>
  ` : '';

  // Barra de Pesquisa e Filtros
  const filterToolbar = total > 0 ? `
    <div class="history-toolbar">
      <div class="history-search-wrap">
        <i class="fa-solid fa-magnifying-glass search-field-icon"></i>
        <input 
          type="text" 
          id="historySearchInput" 
          class="history-search-input" 
          placeholder="Buscar no histórico por termo, título ou link..." 
          value="${escapeHtml(searchQuery)}"
          oninput="handleSearch(this.value)"
        />
        ${searchQuery ? `<button class="search-clear-btn" onclick="clearSearch()"><i class="fa-solid fa-xmark"></i></button>` : ''}
      </div>

      <div class="history-filter-chips">
        <button class="filter-chip ${currentFilter === 'all' ? 'active' : ''}" onclick="setFilter('all')">
          Todos (${total})
        </button>
        <button class="filter-chip chip-false ${currentFilter === 'FALSO' ? 'active' : ''}" onclick="setFilter('FALSO')">
          <i class="fa-solid fa-xmark"></i> Falso (${countFalse})
        </button>
        <button class="filter-chip chip-true ${currentFilter === 'VERDADEIRO' ? 'active' : ''}" onclick="setFilter('VERDADEIRO')">
          <i class="fa-solid fa-check"></i> Verdadeiro (${countTrue})
        </button>
        <button class="filter-chip chip-partial ${currentFilter === 'PARCIALMENTE VERDADEIRO' ? 'active' : ''}" onclick="setFilter('PARCIALMENTE VERDADEIRO')">
          <i class="fa-solid fa-circle-half-stroke"></i> Parcial (${countPartial})
        </button>
        <button class="filter-chip chip-inconclusive ${currentFilter === 'INCONCLUSIVO' ? 'active' : ''}" onclick="setFilter('INCONCLUSIVO')">
          <i class="fa-solid fa-question"></i> Inconclusivo (${countInconclusive})
        </button>
      </div>

      <div style="display:flex; justify-content:flex-end; margin-top:8px;">
        <button class="btn btn-ghost btn-sm" onclick="clearAllHistory()" style="color:var(--danger); border-color:var(--border);">
          <i class="fa-solid fa-trash-can"></i> Limpar Histórico
        </button>
      </div>
    </div>
  ` : '';

  // Filtra itens
  const filtered = allChecks.filter(item => {
    // Filtro por veredito
    if (currentFilter !== 'all' && item.verdict !== currentFilter) {
      return false;
    }
    // Filtro por texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const content = (item.inputContent || '').toLowerCase();
      const title = (item.articleTitle || '').toLowerCase();
      const summary = (item.summary || '').toLowerCase();
      return content.includes(q) || title.includes(q) || summary.includes(q);
    }
    return true;
  });

  // Lista de Cards ou Empty State
  let itemsHtml = '';
  if (total === 0) {
    itemsHtml = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i class="fa-solid fa-newspaper" style="font-size:3.5rem; color:var(--primary); opacity:0.6;"></i>
        </div>
        <h3>Nenhuma verificação encontrada</h3>
        <p>Você ainda não verificou nenhuma notícia. Comece colando uma frase suspeita ou um link.</p>
        <a href="index.html" class="btn btn-primary btn-lg">
          <i class="fa-solid fa-magnifying-glass"></i> Fazer primeira verificação
        </a>
      </div>
    `;
  } else if (filtered.length === 0) {
    itemsHtml = `
      <div class="empty-state" style="padding:48px 24px;">
        <div class="empty-state-icon">
          <i class="fa-solid fa-filter-circle-xmark" style="font-size:3rem; color:var(--text-secondary);"></i>
        </div>
        <h3>Nenhum resultado para os filtros atuais</h3>
        <p>Tente alterar o termo da busca ou selecione a opção "Todos".</p>
        <button class="btn btn-outline" onclick="resetFilters()">
          <i class="fa-solid fa-rotate-left"></i> Limpar filtros
        </button>
      </div>
    `;
  } else {
    itemsHtml = `
      <div class="history-cards-grid">
        ${filtered.map(item => renderHistoryCard(item)).join('')}
      </div>
    `;
  }

  container.innerHTML = `
    ${guestBanner}
    ${statsBar}
    ${filterToolbar}
    ${itemsHtml}
  `;
}

// Renderiza um Card individual de histórico
function renderHistoryCard(item) {
  const verdictClass = getVerdictBadgeClass(item.verdict);
  const verdictIcon = getVerdictIcon(item.verdict);
  const confidence = item.confidenceScore || 0;
  const shareId = item.shareId || item.checkId || item._id;
  const dateStr = formatDate(item.createdAt);
  const relativeDate = formatRelativeTime(item.createdAt);

  const displayTitle = item.articleTitle || item.inputContent || 'Verificação de Notícia';
  const isUrl = item.inputType === 'url';

  return `
    <div class="history-card" id="history-card-${shareId}">
      <div class="history-card-header">
        <div class="history-badge ${verdictClass}">
          ${verdictIcon} <span>${item.verdict || 'ANALISADO'}</span>
        </div>
        <div class="history-confidence-pill" title="Score de Confiança da IA">
          <i class="fa-solid fa-gauge-high"></i> ${confidence}% confiança
        </div>
      </div>

      <div class="history-card-body" onclick="openResult('${shareId}', ${JSON.stringify(escapeAttr(item))})">
        <div class="history-type-tag">
          <i class="${isUrl ? 'fa-solid fa-link' : 'fa-solid fa-align-left'}"></i>
          <span>${isUrl ? 'Link / Artigo' : 'Texto / Afirmação'}</span>
          <span class="history-date" title="${dateStr}">• ${relativeDate}</span>
        </div>

        <h3 class="history-card-title">${escapeHtml(displayTitle)}</h3>

        ${item.summary ? `<p class="history-card-snippet">${escapeHtml(item.summary)}</p>` : ''}
      </div>

      <div class="history-card-footer">
        <button class="history-action-btn primary" onclick="openResult('${shareId}', ${JSON.stringify(escapeAttr(item))})">
          <i class="fa-solid fa-eye"></i> Ver Análise
        </button>

        <button class="history-action-btn" onclick="shareCheck('${shareId}', '${escapeJs(displayTitle)}', '${item.verdict}')" title="Compartilhar">
          <i class="fa-solid fa-share-nodes"></i>
        </button>

        <button class="history-action-btn danger" onclick="deleteHistoryItem('${shareId}', '${item._id || ''}')" title="Excluir do histórico">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `;
}

// Helpers de Veredito
function getVerdictBadgeClass(verdict) {
  if (verdict === 'VERDADEIRO') return 'badge-true';
  if (verdict === 'FALSO') return 'badge-false';
  if (verdict === 'PARCIALMENTE VERDADEIRO') return 'badge-partial';
  return 'badge-inconclusive';
}

function getVerdictIcon(verdict) {
  if (verdict === 'VERDADEIRO') return '<i class="fa-solid fa-circle-check"></i>';
  if (verdict === 'FALSO') return '<i class="fa-solid fa-triangle-exclamation"></i>';
  if (verdict === 'PARCIALMENTE VERDADEIRO') return '<i class="fa-solid fa-circle-half-stroke"></i>';
  return '<i class="fa-solid fa-circle-question"></i>';
}

// Manipulação de Filtros e Busca
function setFilter(filter) {
  currentFilter = filter;
  renderHistoryView();
}

function handleSearch(val) {
  searchQuery = val;
  renderHistoryView();
  // Mantém foco no input
  const inp = document.getElementById('historySearchInput');
  if (inp) {
    inp.focus();
    inp.selectionStart = inp.selectionEnd = inp.value.length;
  }
}

function clearSearch() {
  searchQuery = '';
  renderHistoryView();
}

function resetFilters() {
  searchQuery = '';
  currentFilter = 'all';
  renderHistoryView();
}

// Abrir resultado
function openResult(shareId, item) {
  if (item) {
    sessionStorage.setItem('vn_result', JSON.stringify(item));
  }
  window.location.href = `result.html?id=${shareId}`;
}

// Compartilhar do histórico
function shareCheck(shareId, title, verdict) {
  const url = `${window.location.origin}/result.html?id=${shareId}`;
  if (navigator.share) {
    navigator.share({
      title: `Verificação: ${title}`,
      text: `Confira o veredito [${verdict}] no Verifica Notícia:`,
      url: url
    }).catch(() => copyToClipboard(url));
  } else {
    copyToClipboard(url);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Link de compartilhamento copiado!', 'success');
  }).catch(() => {
    showToast('Não foi possível copiar o link.', 'error');
  });
}

// Excluir item do histórico
async function deleteHistoryItem(shareId, dbId) {
  if (!confirm('Deseja realmente remover esta verificação do seu histórico?')) return;

  // Remove do array em memória
  allChecks = allChecks.filter(c => (c.shareId !== shareId && c.checkId !== shareId && c._id !== shareId && c._id !== dbId));

  // Remove do localStorage
  try {
    const raw = localStorage.getItem('vn_local_history');
    if (raw) {
      const local = JSON.parse(raw).filter(c => (c.shareId !== shareId && c.checkId !== shareId && c._id !== shareId));
      localStorage.setItem('vn_local_history', JSON.stringify(local));
    }
  } catch (e) {
    console.error(e);
  }

  // Tenta remover da API se tiver id de banco
  if (dbId && typeof auth !== 'undefined' && auth.isLoggedIn()) {
    try {
      await api.deleteHistory(dbId);
    } catch (e) {
      console.warn('Não foi possível deletar no servidor:', e);
    }
  }

  showToast('Item removido do histórico.', 'info');
  renderHistoryView();
}

// Limpar todo o histórico
function clearAllHistory() {
  if (!confirm('Tem certeza de que deseja apagar todo o histórico de verificações deste navegador? Esta ação não pode ser desfeita.')) return;

  allChecks = [];
  localStorage.removeItem('vn_local_history');
  showToast('Histórico limpo com sucesso.', 'info');
  renderHistoryView();
}

// Sistema de Toasts Modernos
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('vn-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'vn-toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const icons = {
    success: '<i class="fa-solid fa-circle-check"></i>',
    error: '<i class="fa-solid fa-circle-xmark"></i>',
    info: '<i class="fa-solid fa-circle-info"></i>',
    warning: '<i class="fa-solid fa-triangle-exclamation"></i>'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-msg">${escapeHtml(message)}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Helpers de formatação
function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function formatRelativeTime(d) {
  if (!d) return 'Recentemente';
  const date = new Date(d);
  if (isNaN(date.getTime())) return 'Recentemente';

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Agora mesmo';
  if (diffMin < 60) return `Há ${diffMin} min`;
  if (diffHours < 24) return `Há ${diffHours}h`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  return date.toLocaleDateString('pt-BR');
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

function escapeAttr(obj) {
  return obj;
}

function escapeJs(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
}
