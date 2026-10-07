'use strict';

function supabaseConfig() {
  const url = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !publishableKey || !secretKey) {
    const error = new Error('Configure SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY e SUPABASE_SECRET_KEY na Vercel.');
    error.statusCode = 503;
    throw error;
  }
  return { url, publishableKey, secretKey };
}

function allowedEmail(email) {
  const allowed = String(process.env.PNEUMO_ALLOWED_EMAILS || '')
    .split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  return allowed.length > 0 && allowed.includes(String(email || '').trim().toLowerCase());
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  return {};
}

async function supabaseRequest(url, key, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: key,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch (_) { data = raw; }
  if (!response.ok) {
    const error = new Error(data?.msg || data?.message || data?.error_description || data?.error || `Supabase respondeu ${response.status}.`);
    error.statusCode = response.status;
    throw error;
  }
  return data;
}

async function requireUser(req) {
  const { url, publishableKey } = supabaseConfig();
  const authorization = req.headers.authorization || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const error = new Error('Faça login para acessar os dados compartilhados.');
    error.statusCode = 401;
    throw error;
  }
  const user = await supabaseRequest(`${url}/auth/v1/user`, publishableKey, {
    headers: { Authorization: `Bearer ${match[1]}` }
  });
  if (!allowedEmail(user.email)) {
    const error = new Error('Este e-mail não está autorizado para o aplicativo.');
    error.statusCode = 403;
    throw error;
  }
  return user;
}

module.exports = { supabaseConfig, allowedEmail, sendJson, readBody, supabaseRequest, requireUser };
