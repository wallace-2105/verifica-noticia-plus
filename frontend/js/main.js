// frontend/js/main.js
// Experiência Intuitiva, Ações Rápidas, Auto-Detecção e Loading Interativo

let currentTab = 'text';
let tipInterval = null;

const FAKE_NEWS_TIPS = [
  'Notícias falsas costumam usar títulos sensacionalistas em CAIXA ALTA.',
  'Desconfie de mensagens no WhatsApp com apelos como "URGENTE! Repasse para todos".',
  'Verifique se veículos confiáveis de jornalismo também noticiaram o fato.',
  'Erros graves de português e concordância são fortes indícios de boatos.',
  'Imagens antigas tiradas de contexto são a forma mais comum de desinformação.'
];

document.addEventListener('DOMContentLoaded', () => {
  auth.updateNavbar();
  renderRecentChecksHome();
  setupAutoDetect();
});

// Alternar entre abas
function switchTab(tab) {
  currentTab = tab;
  const isText = tab === 'text';

  const textGroup = document.getElementById('inputText');
  const urlGroup = document.getElementById('inputUrl');
  const tabText = document.getElementById('tabText');
  const tabUrl = document.getElementById('tabUrl');

  if (textGroup) textGroup.style.display = isText ? 'block' : 'none';
  if (urlGroup) urlGroup.style.display = !isText ? 'block' : 'none';

  if (tabText) tabText.classList.toggle('active', isText);
  if (tabUrl) tabUrl.classList.toggle('active', !isText);

  // Foco no input ativo
  if (isText) {
    const txt = document.getElementById('textInput');
    if (txt) txt.focus();
  } else {
    const url = document.getElementById('urlInput');
    if (url) url.focus();
  }
}

// Auto-detecção inteligente de URLs
function setupAutoDetect() {
  const textInput = document.getElementById('textInput');
  if (textInput) {
    textInput.addEventListener('input', () => {
      updateCounter();
      const val = textInput.value.trim();
      if ((val.startsWith('http://') || val.startsWith('https://')) && !val.includes('\n') && val.split(' ').length === 1) {
        // Se o usuário colou uma URL única na aba de texto, troca automaticamente para a aba de URL
        const urlInput = document.getElementById('urlInput');
        if (urlInput) urlInput.value = val;
        textInput.value = '';
        switchTab('url');
        showToast('Link detectado! Alternamos para a aba "Verificar URL".', 'info');
      }
    });
  }
}

// Contador de caracteres
function updateCounter() {
  const input = document.getElementById('textInput');
  const counter = document.getElementById('charCounter');
  if (!input || !counter) return;

  const len = input.value.length;
  counter.textContent = `${len} / 2000`;
  counter.className = 'char-counter' + (len > 1800 ? ' danger' : len > 1500 ? ' warning' : '');
}

// Ações Rápidas: Colar da Área de Transferência
async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (!text || !text.trim()) {
      showToast('Área de transferência está vazia.', 'warning');
      return;
    }

    const trimmed = text.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      switchTab('url');
      const urlInput = document.getElementById('urlInput');
      if (urlInput) urlInput.value = trimmed;
      showToast('URL colada da área de transferência!', 'success');
    } else {
      switchTab('text');
      const textInput = document.getElementById('textInput');
      if (textInput) {
        textInput.value = trimmed;
        updateCounter();
      }
      showToast('Texto colado da área de transferência!', 'success');
    }
  } catch (err) {
    showToast('Permissão para colar negada pelo navegador. Use Ctrl+V.', 'warning');
  }
}

// Ações Rápidas: Limpar Campo
function clearInput() {
  if (currentTab === 'text') {
    const textInput = document.getElementById('textInput');
    if (textInput) {
      textInput.value = '';
      updateCounter();
      textInput.focus();
    }
  } else {
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
      urlInput.value = '';
      urlInput.focus();
    }
  }
  showToast('Campo limpo.', 'info');
}

// Exemplos Prontos de 1-Clique
function useExample(content, type) {
  if (type === 'url') {
    switchTab('url');
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
      urlInput.value = content;
      urlInput.focus();
    }
  } else {
    switchTab('text');
    const textInput = document.getElementById('textInput');
    if (textInput) {
      textInput.value = content;
      updateCounter();
      textInput.focus();
    }
  }
  showToast('Exemplo inserido! Clique em "Verificar Agora".', 'info');
  scrollToSearch();
}

function scrollToSearch() {
  const card = document.querySelector('.search-card');
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Animação de Carregamento & Dicas
function startLoadingAnimation() {
  const steps = ['step1', 'step2', 'step3', 'step4'];
  let i = 0;

  // Ciclo dos passos
  const stepInterval = setInterval(() => {
    if (i > 0) {
      const prev = document.getElementById(steps[i - 1]);
      if (prev) {
        prev.classList.remove('active');
        prev.classList.add('done');
        const icon = prev.querySelector('.step-icon');
        if (icon) icon.innerHTML = '<i class="fa-solid fa-check"></i>';
      }
    }
    if (i < steps.length) {
      const curr = document.getElementById(steps[i]);
      if (curr) curr.classList.add('active');
    }
    i++;
  }, 1400);

  // Ciclo das dicas educativas
  let tipIndex = 0;
  const tipEl = document.getElementById('loadingTipText');
  if (tipEl) tipEl.textContent = FAKE_NEWS_TIPS[0];

  tipInterval = setInterval(() => {
    tipIndex = (tipIndex + 1) % FAKE_NEWS_TIPS.length;
    if (tipEl) tipEl.textContent = FAKE_NEWS_TIPS[tipIndex];
  }, 3500);

  return stepInterval;
}

// Executar Verificação
async function verify() {
  let input = '';

  if (currentTab === 'text') {
    input = (document.getElementById('textInput')?.value || '').trim();
    if (!input) {
      showToast('Digite ou cole algum texto para verificar.', 'warning');
      return;
    }
    if (input.length < 5) {
      showToast('Texto muito curto. Forneça pelo menos 5 caracteres.', 'warning');
      return;
    }
  } else {
    input = (document.getElementById('urlInput')?.value || '').trim();
    if (!input) {
      showToast('Cole o link da notícia para verificar.', 'warning');
      return;
    }
    try {
      new URL(input);
    } catch {
      showToast('URL inválida. Verifique o link e tente novamente.', 'error');
      return;
    }
  }

  // Exibir overlay de loading com scanner radar
  const overlay = document.getElementById('loadingOverlay');
  const btnVerify = document.getElementById('btnVerify');
  if (overlay) overlay.classList.add('show');
  if (btnVerify) btnVerify.disabled = true;

  // Reseta passos
  ['step1', 'step2', 'step3', 'step4'].forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active', 'done');
      const icon = el.querySelector('.step-icon');
      if (icon) icon.textContent = idx + 1;
    }
  });

  const stepTimer = startLoadingAnimation();

  try {
    const result = currentTab === 'text'
      ? await api.checkText(input)
      : await api.checkUrl(input);

    clearInterval(stepTimer);
    if (tipInterval) clearInterval(tipInterval);

    // Salva no histórico local para não perder
    saveToLocalHistory(result);

    // Salva no sessionStorage para visualização imediata
    sessionStorage.setItem('vn_result', JSON.stringify(result));

    const shareId = result.shareId || result.checkId;
    window.location.href = `result.html?id=${shareId}`;

  } catch (error) {
    clearInterval(stepTimer);
    if (tipInterval) clearInterval(tipInterval);
    if (overlay) overlay.classList.remove('show');
    if (btnVerify) btnVerify.disabled = false;

    showToast(error.message || 'Erro ao conectar ao servidor de verificação.', 'error');
  }
}

// Salva resultado no localStorage
function saveToLocalHistory(result) {
  try {
    const raw = localStorage.getItem('vn_local_history');
    let list = raw ? JSON.parse(raw) : [];
    
    // Evita duplicatas pelo shareId
    list = list.filter(item => item.shareId !== result.shareId);
    list.unshift({
      ...result,
      createdAt: result.createdAt || new Date().toISOString()
    });

    // Mantém os 30 mais recentes
    if (list.length > 30) list = list.slice(0, 30);
    localStorage.setItem('vn_local_history', JSON.stringify(list));
  } catch (err) {
    console.warn('Erro ao salvar no histórico local:', err);
  }
}

// Exibe verificações recentes na Home
function renderRecentChecksHome() {
  const container = document.getElementById('recentChecksHome');
  if (!container) return;

  let list = [];
  try {
    const raw = localStorage.getItem('vn_local_history');
    if (raw) list = JSON.parse(raw);
  } catch (e) {
    list = [];
  }

  if (list.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  const recents = list.slice(0, 3);

  const itemsHtml = recents.map(item => {
    const badgeClass = item.verdict === 'VERDADEIRO' ? 'badge-true' 
      : item.verdict === 'FALSO' ? 'badge-false' 
      : item.verdict === 'PARCIALMENTE VERDADEIRO' ? 'badge-partial' : 'badge-inconclusive';

    const title = item.articleTitle || item.inputContent || 'Notícia analisada';
    const shareId = item.shareId || item.checkId;

    return `
      <div class="recent-home-item" onclick="window.location.href='result.html?id=${shareId}'">
        <span class="history-badge ${badgeClass}" style="font-size:0.75rem;">${item.verdict}</span>
        <span class="recent-home-text">${escapeHtml(title)}</span>
        <i class="fa-solid fa-arrow-right" style="font-size:0.8rem; color:var(--text-muted);"></i>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="recent-home-wrap">
      <div class="recent-home-header">
        <span><i class="fa-solid fa-clock-rotate-left"></i> Suas verificações recentes</span>
        <a href="history.html" class="recent-home-link">Ver todas (${list.length}) &rarr;</a>
      </div>
      <div class="recent-home-list">
        ${itemsHtml}
      </div>
    </div>
  `;
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