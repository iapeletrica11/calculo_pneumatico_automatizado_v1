/* Cache local síncrono + sincronização autenticada com a API compartilhada. */
(function (global) {
  'use strict';

  const CATALOGS_KEY = 'consumo_pneumatico_catalogos_v1';
  const PROJECTS_KEY = 'consumo_pneumatico_projetos_v1';
  const AUTH_KEY = 'pneumo_shared_auth_v1';
  const sharedKeys = new Set([CATALOGS_KEY, PROJECTS_KEY]);
  let adapter = {
    getItem: key => global.localStorage.getItem(key),
    setItem: (key, value) => global.localStorage.setItem(key, value),
    removeItem: key => global.localStorage.removeItem(key)
  };
  let syncTimer = null;
  let pollTimer = null;
  let syncing = false;
  let syncAgain = false;
  let applyingRemote = false;
  let lastSyncedProjects = null;
  let lastSyncedCatalogs = null;

  function authState() {
    try { return JSON.parse(global.sessionStorage.getItem(AUTH_KEY) || 'null'); }
    catch (_) { return null; }
  }
  function saveAuth(state) { global.sessionStorage.setItem(AUTH_KEY, JSON.stringify(state)); }
  function clearAuth() { global.sessionStorage.removeItem(AUTH_KEY); }
  function event(name, detail) {
    global.dispatchEvent(new CustomEvent(name, { detail }));
  }
  function parseLocal(key, fallback) {
    try { return JSON.parse(global.localStorage.getItem(key) || 'null') ?? fallback; }
    catch (_) { return fallback; }
  }
  function catalogIdentity(item) {
    if (item?.erp) return `erp:${String(item.erp).trim().toLowerCase()}`;
    if (item?.id) return `id:${item.id}`;
    return `item:${item?.tipo || ''}:${item?.nome || item?.modelo || ''}`.toLowerCase();
  }
  function mergeCatalogs(local, remote) {
    if (!local) return remote || null;
    if (!remote) return local;
    const merged = { ...local, ...remote };
    for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) {
      if (!Array.isArray(local[key])) continue;
      const items = new Map(local[key].map(item => [catalogIdentity(item), item]));
      (Array.isArray(remote[key]) ? remote[key] : []).forEach(item => items.set(catalogIdentity(item), item));
      merged[key] = [...items.values()];
    }
    return merged;
  }
  function mergeProjects(local, remote) {
    const projects = new Map((Array.isArray(local) ? local : []).filter(x => x?.id).map(x => [x.id, x]));
    (Array.isArray(remote) ? remote : []).filter(x => x?.id).forEach(x => {
      const cached = projects.get(x.id);
      const localTime = Date.parse(cached?.salvoEm || '') || 0;
      const remoteTime = Date.parse(x.salvoEm || '') || 0;
      if (!cached || remoteTime >= localTime) projects.set(x.id, x);
    });
    return [...projects.values()];
  }
  function projectChanges(current) {
    const before = new Map((lastSyncedProjects || []).filter(x => x?.id).map(x => [x.id, x]));
    const after = new Map((Array.isArray(current) ? current : []).filter(x => x?.id).map(x => [x.id, x]));
    const upserts = [...after.values()].filter(project => JSON.stringify(before.get(project.id)) !== JSON.stringify(project));
    const deletes = [...before.keys()].filter(id => !after.has(id));
    return { upserts, deletes };
  }
  function sortedProjects(projects) {
    return [...(Array.isArray(projects) ? projects : [])].sort((a, b) => String(a?.id || '').localeCompare(String(b?.id || '')));
  }
  function sameJson(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
  async function authRequest(payload) {
    const response = await fetch('/api/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Falha de autenticação (${response.status}).`);
    return data;
  }
  async function refreshAuth() {
    const current = authState();
    if (!current?.refresh_token) throw new Error('Sua sessão expirou. Entre novamente.');
    const next = await authRequest({ action: 'refresh', refresh_token: current.refresh_token });
    saveAuth(next);
    return next;
  }
  async function sharedRequest(method, body, retry = true) {
    let current = authState();
    if (!current?.access_token) throw new Error('Faça login para sincronizar os dados compartilhados.');
    const response = await fetch('/api/shared', {
      method,
      headers: { Authorization: `Bearer ${current.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (response.status === 401 && retry && current.refresh_token) {
      await refreshAuth();
      return sharedRequest(method, body, false);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Falha na sincronização (${response.status}).`);
    return data;
  }
  async function pushShared(throwOnError = false) {
    if (!authState()) return;
    if (syncing) { syncAgain = true; return; }
    syncing = true;
    try {
      const projects = parseLocal(PROJECTS_KEY, []);
      const catalogs = parseLocal(CATALOGS_KEY, {});
      const changes = projectChanges(projects);
      await sharedRequest('PUT', {
        catalogs,
        projectUpserts: changes.upserts,
        projectDeletes: changes.deletes
      });
      lastSyncedProjects = sortedProjects(projects);
      lastSyncedCatalogs = catalogs;
      event('pneumo:sync-ok', { at: new Date().toISOString() });
    } catch (error) {
      console.error('Falha ao sincronizar com o banco compartilhado.', error);
      event('pneumo:sync-error', { message: error.message });
      if (throwOnError) throw error;
    } finally {
      syncing = false;
      if (syncAgain) { syncAgain = false; pushShared(); }
    }
  }
  function scheduleSync() {
    if (!authState() || applyingRemote) return;
    global.clearTimeout(syncTimer);
    syncTimer = global.setTimeout(pushShared, 500);
  }
  async function syncShared() {
    const remote = await sharedRequest('GET');
    const localCatalogs = parseLocal(CATALOGS_KEY, null);
    const localProjects = parseLocal(PROJECTS_KEY, []);
    const catalogs = mergeCatalogs(localCatalogs, remote.catalogs);
    const projects = mergeProjects(localProjects, remote.projects);
    lastSyncedProjects = sortedProjects(remote.projects);
    lastSyncedCatalogs = remote.catalogs;
    applyingRemote = true;
    try {
      if (catalogs) global.localStorage.setItem(CATALOGS_KEY, JSON.stringify(catalogs));
      global.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } finally { applyingRemote = false; }
    await pushShared(true);
    event('pneumo:shared-loaded', { email: authState()?.email || '' });
  }
  async function refreshShared() {
    if (!authState() || syncing || !lastSyncedProjects) return;
    syncing = true;
    try {
      const localCatalogs = parseLocal(CATALOGS_KEY, null);
      const localProjects = parseLocal(PROJECTS_KEY, []);
      if (!sameJson(localCatalogs, lastSyncedCatalogs) || !sameJson(sortedProjects(localProjects), lastSyncedProjects)) return;
      const remote = await sharedRequest('GET');
      const latestCatalogs = parseLocal(CATALOGS_KEY, null);
      const latestProjects = parseLocal(PROJECTS_KEY, []);
      if (!sameJson(latestCatalogs, lastSyncedCatalogs) || !sameJson(sortedProjects(latestProjects), lastSyncedProjects)) return;
      if (sameJson(remote.catalogs, lastSyncedCatalogs) && sameJson(sortedProjects(remote.projects), lastSyncedProjects)) return;
      applyingRemote = true;
      try {
        if (remote.catalogs) global.localStorage.setItem(CATALOGS_KEY, JSON.stringify(remote.catalogs));
        global.localStorage.setItem(PROJECTS_KEY, JSON.stringify(remote.projects || []));
      } finally { applyingRemote = false; }
      lastSyncedCatalogs = remote.catalogs;
      lastSyncedProjects = sortedProjects(remote.projects);
      event('pneumo:shared-loaded', { email: authState()?.email || '', refreshed: true });
    } catch (error) {
      console.error('Falha ao atualizar os dados compartilhados.', error);
      event('pneumo:sync-error', { message: error.message });
    } finally {
      syncing = false;
      if (syncAgain) { syncAgain = false; pushShared(); }
    }
  }
  function startPolling() {
    global.clearInterval(pollTimer);
    pollTimer = global.setInterval(refreshShared, 30000);
  }

  global.PneumoStorage = {
    getItem: key => adapter.getItem(key),
    setItem(key, value) {
      adapter.setItem(key, value);
      if (sharedKeys.has(key)) scheduleSync();
    },
    removeItem(key) {
      adapter.removeItem(key);
      if (sharedKeys.has(key)) scheduleSync();
    },
    use(next) {
      const methods = ['getItem', 'setItem', 'removeItem'];
      if (!next || !methods.every(method => typeof next[method] === 'function')) {
        throw new TypeError('O adaptador precisa implementar getItem, setItem e removeItem.');
      }
      adapter = next;
    },
    async login(email, password) {
      const data = await authRequest({ action: 'login', email, password });
      saveAuth(data);
      try { await syncShared(); startPolling(); }
      catch (error) { clearAuth(); throw error; }
      return data;
    },
    async resume() {
      if (!authState()?.access_token) return false;
      try { await syncShared(); startPolling(); return true; }
      catch (error) {
        console.error('Não foi possível retomar a sessão compartilhada.', error);
        return false;
      }
    },
    logout() { clearAuth(); global.clearTimeout(syncTimer); global.clearInterval(pollTimer); },
    hasSession: () => !!authState()?.access_token,
    sync: syncShared
  };
})(window);
