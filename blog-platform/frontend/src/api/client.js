const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:4000';
const BLOG_URL = import.meta.env.VITE_BLOG_URL || 'http://localhost:5000';

const KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  user: 'user',
};

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(KEYS.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return localStorage.getItem(KEYS.accessToken);
}

function setStoredAuth({ accessToken, refreshToken, user }) {
  if (accessToken) localStorage.setItem(KEYS.accessToken, accessToken);
  if (refreshToken) localStorage.setItem(KEYS.refreshToken, refreshToken);
  if (user) localStorage.setItem(KEYS.user, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(KEYS.accessToken);
  localStorage.removeItem(KEYS.refreshToken);
  localStorage.removeItem(KEYS.user);
}

async function parseJson(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(KEYS.refreshToken);
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const res = await fetch(`${AUTH_URL}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await parseJson(res);
  if (!res.ok || !data.accessToken) {
    throw new Error(data.error || 'Token refresh failed');
  }

  localStorage.setItem(KEYS.accessToken, data.accessToken);
  return data.accessToken;
}

async function blogRequest(path, options = {}) {
  const { _retried, headers = {}, ...rest } = options;
  const token = localStorage.getItem(KEYS.accessToken);

  const reqHeaders = { ...headers };
  if (rest.body && !reqHeaders['Content-Type']) {
    reqHeaders['Content-Type'] = 'application/json';
  }
  if (token) {
    reqHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BLOG_URL}${path}`, {
    ...rest,
    headers: reqHeaders,
  });

  if (res.status === 401 && !_retried && localStorage.getItem(KEYS.refreshToken)) {
    try {
      await refreshAccessToken();
      return blogRequest(path, { ...options, _retried: true });
    } catch {
      clearStoredAuth();
      window.dispatchEvent(new Event('auth:expired'));
      throw new Error('Session expired. Please log in again.');
    }
  }

  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data;
}

export async function registerUser({ email, username, password, role }) {
  const res = await fetch(`${AUTH_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password, role }),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  return data;
}

export async function loginUser({ username, password }) {
  const res = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  setStoredAuth(data);
  return data;
}

export async function logoutUser() {
  const refreshToken = localStorage.getItem(KEYS.refreshToken);
  try {
    if (refreshToken) {
      await fetch(`${AUTH_URL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } finally {
    clearStoredAuth();
  }
}

export function fetchPosts() {
  return blogRequest('/api/posts');
}

export function fetchMyPosts() {
  return blogRequest('/api/me/posts');
}

export function fetchPostById(id) {
  return blogRequest(`/api/posts/${id}`);
}

export function createPost({ title, content }) {
  return blogRequest('/api/posts', {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  });
}

export function updatePost(id, { title, content }) {
  return blogRequest(`/api/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title, content }),
  });
}

export function deletePost(id) {
  return blogRequest(`/api/posts/${id}`, {
    method: 'DELETE',
  });
}
