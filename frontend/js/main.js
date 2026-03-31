let currentTab = 'text';
 
document.addEventListener('DOMContentLoaded', () => {
  auth.updateNavbar();
});
 
function switchTab(tab) {
  currentTab = tab;
  document.getElementById('inputText').style.display = tab === 'text' ? 'block' : 'none';
  document.getElementById('inputUrl').style.display = tab === 'url' ? 'block' : 'none';
  document.getElementById('tabText').classList.toggle('active', tab === 'text');
  document.getElementById('tabUrl').classList.toggle('active', tab === 'url');
  document.getElementById('alertBox').innerHTML = '';
}
 
function updateCounter() {
  const text = document.getElementById('textInput').value;
  const counter = document.getElementById('charCounter');
  counter.textContent = `${text.length} / 2000`;
  counter.className = 'char-counter' + (text.length > 1800 ? ' danger' : text.length > 1500 ? ' warning' : '');
}
 
function showAlert(message, type = 'error') {
  document.getElementById('alertBox').innerHTML =
    `<div class="alert alert-${type}"><i class="fa-solid fa-circle-exclamation"></i> ${message}</div>`;
}
 
function scrollToSearch() {
  document.querySelector('.hero').scrollIntoView({ behavior: 'smooth' });
}
 
function animateLoading() {
  const steps = ['step1', 'step2', 'step3', 'step4'];
  let i = 0;
  return setInterval(() => {
    if (i > 0) {
      const prev = document.getElementById(steps[i - 1]);
      if (prev) { prev.classList.remove('active'); prev.classList.add('done'); prev.querySelector('.step-icon').innerHTML = '✓'; }
    }
    if (i < steps.length) {
      const curr = document.getElementById(steps[i]);
      if (curr) curr.classList.add('active');
    }
    i++;
  }, 1500);
}
 
async function verify() {
  const alertBox = document.getElementById('alertBox');
  alertBox.innerHTML = '';
 
  let input = '';
  if (currentTab === 'text') {
    input = document.getElementById('textInput').value.trim();
    if (!input) return showAlert('Digite algum texto para verificar.');
    if (input.length < 5) return showAlert('Texto muito curto. Digite pelo menos 5 caracteres.');
  } else {
    input = document.getElementById('urlInput').value.trim();
    if (!input) return showAlert('Cole uma URL para verificar.');
    try { new URL(input); } catch { return showAlert('URL inválida. Verifique e tente novamente.'); }
  }
 
  // Mostra loading
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('show');
  document.getElementById('btnVerify').disabled = true;
 
  // Reseta steps
  ['step1','step2','step3','step4'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('active', 'done');
    el.querySelector('.step-icon').textContent = id.replace('step','');
  });
 
  const loadingInterval = animateLoading();
 
  try {
    const result = currentTab === 'text'
      ? await api.checkText(input)
      : await api.checkUrl(input);
 
    clearInterval(loadingInterval);
 
    // Salva resultado e redireciona
    sessionStorage.setItem('vn_result', JSON.stringify(result));
    window.location.href = `result.html?id=${result.shareId}`;
 
  } catch (error) {
    clearInterval(loadingInterval);
    overlay.classList.remove('show');
    document.getElementById('btnVerify').disabled = false;
    showAlert(error.message || 'Erro ao verificar. Tente novamente.');
  }
}