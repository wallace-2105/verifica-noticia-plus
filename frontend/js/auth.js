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
 
  updateNavbar() {

    const container = document.getElementById('navbarActions');

    if (!container) return;
 
    if (this.isLoggedIn()) {

      const user = this.getUser();

      const initial = user?.name?.charAt(0).toUpperCase() || 'U';

      container.innerHTML = `
<a href="history.html" class="btn btn-ghost btn-sm">
<i class="fa-solid fa-clock-rotate-left"></i> Histórico
</a>
<div style="display:flex;align-items:center;gap:8px;">
<div class="user-avatar">${initial}</div>
<span class="user-name">${user?.name?.split(' ')[0] || 'Usuário'}</span>
</div>
<button onclick="auth.logout()" class="btn btn-ghost btn-sm">
<i class="fa-solid fa-right-from-bracket"></i> Sair
</button>

      `;

    } else {

      container.innerHTML = `
<a href="login.html" class="btn btn-outline btn-sm">Entrar</a>
<a href="register.html" class="btn btn-primary btn-sm">Cadastrar</a>

      `;

    }

  }

};
 