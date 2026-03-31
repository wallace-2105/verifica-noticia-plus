const API_BASE_URL = 'http://localhost:5000/api';
 
const api = {
  async request(endpoint, options = {}) {
    const token = auth.getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
 
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
 
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro na requisição');
    return data;
  },
 
  checkText: (text) => api.request('/check/text', { method: 'POST', body: JSON.stringify({ text }) }),
  checkUrl: (url) => api.request('/check/url', { method: 'POST', body: JSON.stringify({ url }) }),
  getByShareId: (shareId) => api.request(`/check/share/${shareId}`),
  register: (data) => api.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => api.request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => api.request('/auth/me'),
  getHistory: (page = 1, limit = 10) => api.request(`/history?page=${page}&limit=${limit}`),
  deleteHistory: (id) => api.request(`/history/${id}`, { method: 'DELETE' })
};
