const path = require('path');
const Module = require('module');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (r, p, isMain, opts) {
  try { return originalResolve.call(this, r, p, isMain, opts); }
  catch (e) {
    if (r === 'react-native') {
      return originalResolve.call(this, path.join(__dirname, 'node_modules', 'react-native-web', 'dist', 'cjs', 'index.js'), p, isMain, opts);
    }
    throw e;
  }
};
globalThis.__DEV__ = true;
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let token = null;
api.interceptors.request.use((cfg) => {
  if (token && cfg.headers) cfg.headers.Authorization = 'Bearer ' + token;
  return cfg;
});

const authApi = {
  login: (d) => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
  refresh: (t) => api.post('/auth/refresh', { refreshToken: t }),
};
const jobsApi = {
  list: (p) => api.get('/jobs', { params: p }),
  mine: () => api.get('/jobs/mine'),
  apply: (id, data) => api.post(`/jobs/${id}/apply`, data),
  applications: (id) => api.get(`/jobs/${id}/applications`),
};
const applicationsApi = {
  mine: () => api.get('/applications/mine'),
};
const categoriesApi = { list: () => api.get('/categories') };
const notificationsApi = {
  unreadCount: () => api.get('/notifications/unread-count'),
  list: () => api.get('/notifications'),
};

let ok = 0, fail = 0;
const chk = (name, cond, extra = '') => {
  if (cond) { ok++; console.log('✅', name, extra); }
  else { fail++; console.log('❌', name, extra); }
};

(async () => {
  try {
    console.log('\n========== APP MÓVIL (axios.ts) vs BACKEND LOCAL ==========\n');

    const h = await axios.get(API_BASE_URL + '/health');
    chk('1. Health baseURL resolviendo a localhost:3000/api', h.status === 200 && h.data?.status === 'success', `HTTP ${h.status}`);

    const cats = await categoriesApi.list();
    chk('2. categoriesApi.list()', cats.status === 200 && Array.isArray(cats.data?.data) && cats.data.data.length === 5, `${cats.data?.data?.length} categorías`);
    const catIds = cats.data?.data || [];

    const lg = await authApi.login({ email: 'u1@test.com', password: 'Test1234!' });
    chk('3. authApi.login() u1@test.com', lg.status === 200 && !!lg.data?.accessToken, `HTTP ${lg.status}  token[:20]=${(lg.data?.accessToken||'').slice(0,20)}...`);
    token = lg.data.accessToken;
    const refreshTok = lg.data.refreshToken;

    const me = await authApi.me();
    chk('4. authApi.me() (Authorization Bearer interceptor OK)', me.status === 200 && me.data?.data?.email === 'u1@test.com', `Nombre=${me.data?.data?.fullName}`);

    const ref = await authApi.refresh(refreshTok);
    chk('5. authApi.refresh() flow JWT', ref.status === 200 && !!ref.data?.accessToken, `nuevo token HTTP ${ref.status}`);

    const jobs = await jobsApi.list({ limit: 5 });
    chk('6. jobsApi.list() filtrados públicos', jobs.status === 200 && Number.isInteger(jobs.data?.total) && jobs.data.total >= 5, `Total BD=${jobs.data?.total}, página=${(jobs.data?.data||[]).length}`);

    const jobsTech = await jobsApi.list({ category: (catIds.find(c=>/tecnolog/i.test(c.name))||{}).id, limit: 5 });
    chk('7. jobsApi.list({category:"Tecnología"})', jobsTech.status === 200 && (jobsTech.data?.data||[]).every(j => /tecnolog/i.test(j?.category?.name)), `Filtrados=${(jobsTech.data?.data||[]).length}`);

    const mine = await jobsApi.mine();
    chk('8. jobsApi.mine() — Mis publicaciones u1', mine.status === 200 && Array.isArray(mine.data?.data) && mine.data.data.length > 0, `${mine.data?.data?.length} trabajos publicados`);
    const firstMine = (mine.data?.data || [])[0];

    const appsMine = await applicationsApi.mine();
    chk('9. applicationsApi.mine() — Mis postulaciones', appsMine.status === 200 && Array.isArray(appsMine.data?.data), `${appsMine.data?.data?.length} postulaciones`);

    try {
      await jobsApi.apply(firstMine.id, { message: 'prueba autoaplicación móvil' });
      chk('10. jobsApi.apply() a mi propio trabajo', false, 'ESPERABA 403 pero respondió 2xx!!');
    } catch (e) {
      const s = e.response?.status;
      const msg = e.response?.data?.message || '';
      chk('10. Restricción autopostulación (jobsApi.apply a propio) HTTP 403 mensaje exacto', s === 403 && /tu propio trabajo/i.test(msg), `HTTP ${s} "${msg}"`);
    }

    if (firstMine) {
      const aps = await jobsApi.applications(firstMine.id);
      chk('11. jobsApi.applications(jobId) — Ver postulantes', aps.status === 200 && Array.isArray(aps.data), `${(aps.data||[]).length} postulantes en "${firstMine.title.slice(0,30)}"`);
    }

    const nc = await notificationsApi.unreadCount();
    chk('12. notificationsApi.unreadCount()', nc.status === 200 && Number.isInteger(nc.data?.count), `count=${nc.data?.count}`);

    const nl = await notificationsApi.list();
    chk('13. notificationsApi.list()', nl.status === 200 && Array.isArray(nl.data?.data || nl.data), `${(nl.data?.data||nl.data||[]).length} notificaciones listadas`);

    console.log('\n===========================================================');
    console.log(`RESULTADO: ${ok}/${ok+fail} checks API ✔️   (fallos: ${fail})`);
    console.log('===========================================================\n');
    process.exit(fail === 0 ? 0 : 1);
  } catch (e) {
    console.error('\n❌ TEST CRASHED:', e.message || e);
    if (e.response) console.error('  HTTP', e.response.status, JSON.stringify(e.response.data||{}).slice(0,300));
    process.exit(2);
  }
})();
