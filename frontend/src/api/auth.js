import client from './client';

// 🔐 Login
export async function login({ email, password }) {
  if (!email || !password) throw new Error('Email y contraseña requeridos');

  const res = await client.post('/auth/login', { email, password });

  if (res.data.token) {
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
  }

  return res.data;
}

// 🔒 Logout
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// 👤 Usuario actual
export function currentUser() {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}
