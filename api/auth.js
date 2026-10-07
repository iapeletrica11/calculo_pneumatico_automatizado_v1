'use strict';

const { supabaseConfig, allowedEmail, sendJson, readBody, supabaseRequest } = require('../lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Método não permitido.' });
  try {
    const { url, publishableKey } = supabaseConfig();
    const body = readBody(req);
    let data;
    if (body.action === 'login') {
      if (!allowedEmail(body.email)) return sendJson(res, 403, { error: 'Este e-mail não está autorizado para o aplicativo.' });
      if (!body.email || !body.password) return sendJson(res, 400, { error: 'Informe e-mail e senha.' });
      data = await supabaseRequest(`${url}/auth/v1/token?grant_type=password`, publishableKey, {
        method: 'POST', body: JSON.stringify({ email: body.email, password: body.password })
      });
      if (!allowedEmail(data.user?.email)) return sendJson(res, 403, { error: 'Este e-mail não está autorizado para o aplicativo.' });
    } else if (body.action === 'refresh' && body.refresh_token) {
      data = await supabaseRequest(`${url}/auth/v1/token?grant_type=refresh_token`, publishableKey, {
        method: 'POST', body: JSON.stringify({ refresh_token: body.refresh_token })
      });
      if (!allowedEmail(data.user?.email)) return sendJson(res, 403, { error: 'Este e-mail não está autorizado para o aplicativo.' });
    } else {
      return sendJson(res, 400, { error: 'Ação de autenticação inválida.' });
    }
    return sendJson(res, 200, {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      expires_in: data.expires_in,
      email: data.user?.email
    });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, { error: error.message || 'Não foi possível autenticar.' });
  }
};
