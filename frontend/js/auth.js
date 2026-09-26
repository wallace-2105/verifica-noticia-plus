// frontend/js/auth.js
// Gerenciamento de Autenticação, Tema e Navbar Compartilhada

const auth = {
  getToken() {
    return localStorage.getItem('vn_token');
  },

  setToken(token, user) {
    localStorage.setItem('vn_token', token);
    if (user) localStorage.setItem('vn_user', JSON.stringify(user));
  },

  removeToken() {
    localStorage.removeItem('vn_token');
    localStorage.removeItem('vn_user');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('vn_user'));
    } catch {
      return null;
    }
  },

  logout() {
    this.removeToken();
    window.location.href = 'index.html';
  },

  // Tema Claro / Escuro
  initTheme() {
    const savedTheme = localStorage.getItem('vn_theme') || 
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButton(savedTheme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('vn_theme', next);
    this.updateThemeButton(next);
  },

  updateThemeButton(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.innerHTML = theme === 'dark' 
        ? '<i class="fa-solid fa-sun" style="color:#f59e0b"></i>' 
        : '<i class="fa-solid fa-moon"></i>';
      btn.setAttribute('title', theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro');
    }
  },

  // Atualização Inteligente da Navbar
  updateNavbar() {
    this.initTheme();

    const container = document.getElementById('navbarActions');
    if (!container) return;

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const themeIcon = currentTheme === 'dark' 
      ? '<i class="fa-solid fa-sun" style="color:#f59e0b;"></i>' 
      : '<i class="fa-solid fa-moon"></i>';

    const themeToggleHtml = `
      <button class="theme-toggle-btn" id="themeToggleBtn" onclick="auth.toggleTheme()" title="Alternar tema">
        ${themeIcon}
      </button>
    `;

    if (this.isLoggedIn()) {
      const user = this.getUser();
      const initial = user?.name?.charAt(0).toUpperCase() || 'U';
      const firstName = user?.name?.split(' ')[0] || 'Usuário';

      container.innerHTML = `
        ${themeToggleHtml}
        <a href="history.html" class="btn btn-ghost btn-sm" title="Ver Meu Histórico">
          <i class="fa-solid fa-clock-rotate-left"></i> Histórico
        </a>
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="user-avatar" title="${user?.email || firstName}">${initial}</div>
          <span class="user-name">${firstName}</span>
        </div>
        <button onclick="auth.logout()" class="btn btn-outline btn-sm" title="Encerrar Sessão">
          <i class="fa-solid fa-right-from-bracket"></i> Sair
        </button>
      `;
    } else {
      container.innerHTML = `
        ${themeToggleHtml}
        <a href="history.html" class="btn btn-ghost btn-sm" title="Ver Histórico Local">
          <i class="fa-solid fa-clock-rotate-left"></i> Histórico
        </a>
        <a href="login.html" class="btn btn-outline btn-sm">Entrar</a>
        <a href="register.html" class="btn btn-primary btn-sm">Cadastrar</a>
      `;
    }
  }
};

// Sistema Global de Toasts
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
    <div class="toast-msg">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}