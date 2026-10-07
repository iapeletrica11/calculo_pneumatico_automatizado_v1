'use strict';

const { supabaseConfig, sendJson, readBody, supabaseRequest, requireUser } = require('../lib/supabase');

async function loadShared(url, secretKey) {
  const [catalogRows, projectRows] = await Promise.all([
    supabaseRequest(`${url}/rest/v1/pneumo_catalogos?id=eq.principal&select=dados`, secretKey),
    supabaseRequest(`${url}/rest/v1/pneumo_projetos?select=id,dados`, secretKey)
  ]);
  return {
    catalogs: catalogRows?.[0]?.dados || null,
    projects: (projectRows || []).map(row => row.dados)
  };
}

module.exports = async function handler(req, res) {
  if (!['GET', 'PUT'].includes(req.method)) return sendJson(res, 405, { error: 'Método não permitido.' });
  try {
    await requireUser(req);
    const { url, secretKey } = supabaseConfig();
    if (req.method === 'GET') return sendJson(res, 200, await loadShared(url, secretKey));

    const body = readBody(req);
    if (!body.catalogs || typeof body.catalogs !== 'object' || !Array.isArray(body.projectUpserts) || !Array.isArray(body.projectDeletes)) {
      return sendJson(res, 400, { error: 'Dados compartilhados inválidos.' });
    }
    const invalidProject = body.projectUpserts.some(project => !project || typeof project.id !== 'string' || !project.id.trim())
      || body.projectDeletes.some(id => typeof id !== 'string' || !id.trim());
    if (invalidProject) return sendJson(res, 400, { error: 'Todos os projetos precisam ter um ID.' });

    await supabaseRequest(`${url}/rest/v1/pneumo_catalogos?on_conflict=id`, secretKey, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([{ id: 'principal', dados: body.catalogs, atualizado_em: new Date().toISOString() }])
    });
    await supabaseRequest(`${url}/rest/v1/rpc/pneumo_apply_project_changes`, secretKey, {
      method: 'POST', body: JSON.stringify({ p_upserts: body.projectUpserts, p_deletes: body.projectDeletes })
    });
    return sendJson(res, 200, { ok: true, savedAt: new Date().toISOString() });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, { error: error.message || 'Falha ao sincronizar o banco.' });
  }
};
