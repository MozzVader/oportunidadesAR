// assets/app.js — Logica principal de la aplicacion

// ══════════════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════════════
const PALETTE = [
  '#8a38fe','#93c5fd','#fde68a','#86efac','#fca5a5',
  '#fdba74','#e9d5ff','#a7f3d0','#cbd5e1','#f9a8d4',
  '#6ee7b7','#fcd34d','#a5b4fc','#67e8f9','#d9f99d',
  '#c4b5fd','#fb923c','#34d399','#f472b6','#60a5fa'
];

const INDUSTRIAS = [
  'Agroindustria','Alimenticia','Automotriz','eCommerce','Energía',
  'Industria/Tecnología','Medios','Oil&Gas','Retail','Salud',
  'Sector Público','Seguros','Servicios Financieros','Telecomunicaciones',
  'Transporte y Logística'
];

const PRACTICAS = ['AM','CES','Consultoría','DWP','Enablon','HCI','IA','SAP','Testing'];
const CURRENCIES = ['ARS','CLP','EUR','USD'];

function colorForValue(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Buenos días';
  if (h >= 12 && h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function updateGreeting() {
  const el = document.getElementById('heroGreeting');
  if (el) {
    const session = AUTH.getSession();
    const nombre = session ? session.nombre.split(' ')[0] : '';
    el.textContent = getGreeting() + (nombre ? ', ' + nombre : '');
  }
}

function toInputDate(val) {
  if (!val || val === '') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
    const [d, m, y] = val.split('/');
    return `${y}-${m}-${d}`;
  }
  try {
    const date = new Date(val);
    if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  } catch(e) {}
  return '';
}

function fmtFecha(val) {
  if (!val || val === '') return '—';
  const d = new Date(toInputDate(val) + 'T12:00:00');
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function fmtEUR(n) {
  return '€' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function friendlyId(r) {
  return r.codigo || r.id.substring(0, 8);
}

function canEdit(r) {
  const s = AUTH.getSession();
  if (!s) return false;
  return s.perfil === 'admin' || r.responsableUid === s.uid;
}

function badgeEstado(e) {
  return { 'En Desarrollo': 'badge-desarrollo', 'Entregada': 'badge-entregada', 'Finalizada': 'badge-finalizada', 'Pausa': 'badge-pausa', 'Perdido': 'badge-perdido', 'Ganado': 'badge-ganado' }[e] || '';
}

function showAlert(id, msg, type) {
  const box = document.getElementById(id);
  if (!box) return;
  box.textContent = msg;
  box.className = `alert alert-${type} show`;
  setTimeout(() => box.className = 'alert', 5000);
}

// ══════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════════════════
const TOAST = (() => {
  const ICONS = {
    success: '\u2713',
    error:   '\u2715',
    warning: '\u26A0',
    info:    '\u2139'
  };
  const DURATIONS = { success: 4000, error: 6000, warning: 5000, info: 4000 };
  const MAX_VISIBLE = 5;
  let _container = null;

  function _getContainer() {
    if (_container && document.body.contains(_container)) return _container;
    _container = document.createElement('div');
    _container.id = 'toastContainer';
    _container.className = 'toast-container';
    document.body.appendChild(_container);
    return _container;
  }

  function show(message, type = 'info', duration) {
    const dur = duration !== undefined ? duration : (DURATIONS[type] || 4000);
    const container = _getContainer();

    // Limitar cantidad visible
    const existing = container.querySelectorAll('.toast');
    if (existing.length >= MAX_VISIBLE) {
      dismiss(existing[0]);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML =
      '<span class="toast-icon">' + (ICONS[type] || ICONS.info) + '</span>' +
      '<span class="toast-msg">' + message + '</span>' +
      '<button class="toast-close">\u2715</button>';

    // Cerrar con boton
    toast.querySelector('.toast-close').addEventListener('click', () => dismiss(toast));

    container.appendChild(toast);

    // Trigger slide-in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('toast-visible'));
    });

    // Progress bar
    if (dur > 0) {
      const bar = document.createElement('div');
      bar.className = 'toast-progress';
      bar.style.animationDuration = dur + 'ms';
      toast.appendChild(bar);
      setTimeout(() => dismiss(toast), dur);
    }

    return toast;
  }

  function dismiss(toast) {
    if (!toast || !toast.parentElement || toast.classList.contains('toast-removing')) return;
    toast.classList.add('toast-removing');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 350);
  }

  function dismissAll() {
    const container = _getContainer();
    container.querySelectorAll('.toast').forEach(t => dismiss(t));
  }

  return {
    show,
    dismiss,
    dismissAll,
    success: (msg, dur) => show(msg, 'success', dur),
    error:   (msg, dur) => show(msg, 'error', dur),
    warning: (msg, dur) => show(msg, 'warning', dur),
    info:    (msg, dur) => show(msg, 'info', dur)
  };
})();

// ══════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════
const PAGE_TITLES = {
  home: 'Inicio', nueva: 'Nueva Oportunidad', modificar: 'Modificar Oportunidad',
  mis: 'Mis Oportunidades', todas: 'Ver Todas', estadisticas: 'Estadísticas',
  perfil: 'Mi Perfil', usuarios: 'Gestión de Usuarios'
};

function navigate(btn) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  btn.classList.add('active');
  const page = btn.dataset.page;
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || page;
  onPageEnter(page);
}

function onPageEnter(page) {
  if      (page === 'home')         renderHome();
  else if (page === 'mis')          initMis();
  else if (page === 'todas')        initTabla();
  else if (page === 'estadisticas') renderStats();
  else if (page === 'modificar')    initModSearch();
  else if (page === 'perfil')       renderPerfil();
  else if (page === 'usuarios')     loadUsuarios();
}

// ══════════════════════════════════════════════
// STATUS CHECK
// ══════════════════════════════════════════════
async function checkConexion() {
  setStatus('sincronizando');
  try {
    // Con Firebase, simplemente verificamos que podemos leer
    await firebase.firestore().collection('oportunidades').limit(1).get();
    setStatus('conectado');
  } catch(e) { setStatus('error'); }
}

function setStatus(state) {
  const dot  = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  if (dot)  dot.className  = 'status-dot ' + state;
  if (text) text.textContent = { sincronizando: 'Sincronizando...', conectado: 'Conectado', error: 'Sin conexión' }[state] || '';
}

// ══════════════════════════════════════════════
// HOME
// ══════════════════════════════════════════════
async function renderHome() {
  updateGreeting();
  const rows = await CRM.getData();
  const totalTCV = rows.reduce((s, r) => s + (parseFloat(r.tcvEur) || 0), 0);
  const enDes = rows.filter(r => r.estado === 'En Desarrollo').length;
  const fin   = rows.filter(r => r.estado === 'Finalizada').length;
  const ent   = rows.filter(r => r.estado === 'Entregada').length;
  const winRate = (fin + ent) > 0 ? Math.round(fin / (fin + ent) * 100) : 0;

  const homeStats = document.getElementById('homeStats');
  if (homeStats) {
    homeStats.innerHTML = [
      { v: rows.length, l: 'Total Opor.' },
      { v: enDes, l: 'En Desarrollo' },
      { v: fmtEUR(totalTCV), l: 'TCV EUR Total' },
      { v: winRate + '%', l: 'Win Rate' }
    ].map(s => `<div class="qs-card"><div class="qs-value">${s.v}</div><div class="qs-label">${s.l}</div></div>`).join('');
  }

  const counts = {};
  CRM.ESTADOS.forEach(e => counts[e] = 0);
  rows.forEach(r => { if (counts[r.estado] !== undefined) counts[r.estado]++; });

  const pipelineBar = document.getElementById('pipelineBar');
  if (pipelineBar) {
    pipelineBar.innerHTML = CRM.ESTADOS.map(e =>
      `<div class="pipeline-segment" style="flex:${counts[e] || 0.1};background:${CRM.ESTADO_COLORS[e]}"></div>`
    ).join('');
  }

  const etapaLegend = document.getElementById('etapaLegend');
  if (etapaLegend) {
    etapaLegend.innerHTML = CRM.ESTADOS.map(e =>
      `<div class="etapa-item"><div class="etapa-dot" style="background:${CRM.ESTADO_COLORS[e]}"></div>${e} (${counts[e]})</div>`
    ).join('');
  }

  const recientes = rows.slice(0, 5);
  const recientesContent = document.getElementById('recientesContent');
  if (recientesContent) {
    recientesContent.innerHTML = recientes.length === 0
      ? '<div class="empty"><div class="empty-text">Sin oportunidades aún</div></div>'
      : `<table><thead><tr><th>Nombre</th><th>Cliente</th><th>Estado</th></tr></thead><tbody>${recientes.map(r =>
          `<tr><td>${r.nombre || '—'}</td><td style="color:var(--text-muted)">${r.cliente || '—'}</td><td><span class="badge ${badgeEstado(r.estado)}">${r.estado || '—'}</span></td></tr>`
        ).join('')}</tbody></table>`;
  }
}

// ══════════════════════════════════════════════
// FX (Conversión de divisas)
// ══════════════════════════════════════════════
const _fxRates = {};

async function fetchFX(prefix) {
  const currency = document.getElementById(`${prefix}_currency`).value;
  if (!currency || currency === 'EUR') {
    _fxRates[prefix] = currency === 'EUR' ? 1 : null;
    document.getElementById(`${prefix}_tipoCambio`).value = currency === 'EUR' ? 1 : '';
    document.getElementById(`${prefix}_fxBadge`).style.display = 'none';
    calcFX(prefix);
    return;
  }
  document.getElementById(`${prefix}_tcvEurValue`).className = 'fx-loading';
  document.getElementById(`${prefix}_tcvEurValue`).textContent = 'Obteniendo tipo de cambio...';
  document.getElementById(`${prefix}_fxBadge`).style.display = 'none';
  try {
    const res  = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
    const data = await res.json();
    _fxRates[prefix] = data.rates['EUR'];
    document.getElementById(`${prefix}_tipoCambio`).value = _fxRates[prefix].toFixed(6);
    const badge = document.getElementById(`${prefix}_fxBadge`);
    badge.style.display = 'inline-flex';
    badge.textContent = `1 ${currency} = ${_fxRates[prefix].toFixed(4)} EUR`;
    calcFX(prefix);
  } catch(e) {
    document.getElementById(`${prefix}_tcvEurValue`).textContent = 'Error al obtener tipo de cambio';
  }
}

function calcFX(prefix) {
  const tcv      = parseFloat(document.getElementById(`${prefix}_tcv`).value) || 0;
  const fx       = parseFloat(document.getElementById(`${prefix}_tipoCambio`).value) || _fxRates[prefix];
  const currency = document.getElementById(`${prefix}_currency`).value;
  const display  = document.getElementById(`${prefix}_tcvEurValue`);
  if (!currency) { display.className = 'fx-loading'; display.textContent = 'Seleccioná moneda y TCV'; document.getElementById(`${prefix}_tcvEur`).value = ''; return; }
  if (!fx)       { display.className = 'fx-loading'; display.textContent = 'Obteniendo tipo de cambio...'; return; }
  if (!tcv)      { display.className = 'fx-loading'; display.textContent = 'Ingresá el TCV'; document.getElementById(`${prefix}_tcvEur`).value = ''; return; }
  const eur = tcv * fx;
  display.className = '';
  display.style.color = 'var(--text)';
  display.textContent = '€ ' + eur.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById(`${prefix}_tcvEur`).value = eur.toFixed(2);
}

// ══════════════════════════════════════════════
// NUEVA OPORTUNIDAD
// ══════════════════════════════════════════════
async function handleNueva(e) {
  e.preventDefault();
  const btn = document.getElementById('n_submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-inline"></span>Guardando...';
  try {
    const id = await CRM.addOportunidad({
      cliente:      document.getElementById('n_cliente').value,
      industria:    document.getElementById('n_industria').value,
      practica:     document.getElementById('n_practica').value,
      nombre:       document.getElementById('n_nombre').value,
      descripcion:  document.getElementById('n_descripcion').value,
      origen:       document.getElementById('n_origen').value,
      responsable:  document.getElementById('n_responsable').value,
      estado:       document.getElementById('n_estado').value,
      fechaInicio:  document.getElementById('n_fechaInicio').value,
      fechaEntrega: document.getElementById('n_fechaEntrega').value,
      notas:        document.getElementById('n_notas').value,
      tcv:          document.getElementById('n_tcv').value || '0',
      currency:     document.getElementById('n_currency').value,
      tcvEur:       document.getElementById('n_tcvEur').value || '0',
      tipoCambio:   document.getElementById('n_tipoCambio').value || '',
      probabilidad: document.getElementById('n_probabilidad').value || '',
      pm:           document.getElementById('n_pm').value || ''
    });
    TOAST.success('Oportunidad guardada exitosamente.');
    resetNueva();
  } catch(err) {
    TOAST.error('Error al guardar. Intentá de nuevo.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Guardar Oportunidad →';
  }
}

function resetNueva() {
  document.getElementById('nuevaForm').reset();
  const s = AUTH.getSession();
  if (s) document.getElementById('n_responsable').value = s.nombre;
  _fxRates['n'] = null;
  document.getElementById('n_tcvEurValue').className = 'fx-loading';
  document.getElementById('n_tcvEurValue').textContent = 'Seleccioná moneda y TCV';
  document.getElementById('n_fxBadge').style.display = 'none';
  document.getElementById('n_tcvEur').value = '';
}

// ══════════════════════════════════════════════
// MODIFICAR OPORTUNIDAD
// ══════════════════════════════════════════════
let _modRows = [];

async function initModSearch() {
  document.getElementById('modSearch').style.display = 'block';
  document.getElementById('modEditForm').style.display = 'none';
  document.getElementById('modLoadingSearch').style.display = 'flex';
  _modRows = await CRM.getData();
  document.getElementById('modLoadingSearch').style.display = 'none';
  doModSearch();
}

function doModSearch() {
  const q = document.getElementById('modSearchInput').value.trim().toLowerCase();
  const session = AUTH.getSession();
  let rows = _modRows;
  if (session && session.perfil !== 'admin') rows = rows.filter(r => r.responsableUid === session.uid);
  const filtered = q
    ? rows.filter(r => (r.cliente || '').toLowerCase().includes(q) || (r.nombre || '').toLowerCase().includes(q) || (r.codigo || '').toLowerCase().includes(q))
    : rows.slice(0, 20);
  const list  = document.getElementById('modResultList');
  const empty = document.getElementById('modEmptySearch');
  if (filtered.length === 0) { list.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  list.innerHTML = filtered.slice(0, 20).map(r => `
    <div class="result-item" onclick="loadModItem('${r.id}')">
      <div><div class="result-item-name">${r.nombre || '—'}</div><div class="result-item-sub">${r.cliente || '—'} · ${friendlyId(r)}</div></div>
      <span class="badge ${badgeEstado(r.estado)}">${r.estado || '—'}</span>
    </div>`).join('');
}

async function loadModItem(id) {
  let r = _modRows.find(x => x.id === id);
  if (!r) r = await CRM.getOportunidad(id);
  if (!r) return;
  const session = AUTH.getSession();
  if (session && session.perfil !== 'admin' && r.responsableUid !== session.uid) {
    alert('Solo podés editar oportunidades que te pertenecen.');
    return;
  }
  document.getElementById('e_id').value = id;
  document.getElementById('modEditTitle').textContent = r.nombre;
  document.getElementById('e_cliente').value      = r.cliente || '';
  document.getElementById('e_industria').value    = r.industria || '';
  document.getElementById('e_practica').value     = r.practica || '';
  document.getElementById('e_nombre').value       = r.nombre || '';
  document.getElementById('e_descripcion').value  = r.descripcion || '';
  document.getElementById('e_origen').value       = r.origen || '';
  document.getElementById('e_responsable').value  = r.responsable || '';
  document.getElementById('e_estado').value       = r.estado || '';
  document.getElementById('e_fechaInicio').value  = toInputDate(r.fechaInicio);
  document.getElementById('e_fechaEntrega').value = toInputDate(r.fechaEntrega);
  document.getElementById('e_notas').value        = r.notas || '';
  document.getElementById('e_tcv').value          = r.tcv || '';
  document.getElementById('e_currency').value     = r.currency || '';
  document.getElementById('e_pm').value           = r.pm || '';
  document.getElementById('e_tipoCambio').value   = r.tipoCambio || '';
  document.getElementById('e_tcvEur').value       = r.tcvEur || '';
  document.getElementById('e_probabilidad').value = r.probabilidad || '';
  _fxRates['e'] = parseFloat(r.tipoCambio) || null;

  const eur = parseFloat(r.tcvEur);
  const tv = document.getElementById('e_tcvEurValue');
  if (eur) { tv.className = ''; tv.textContent = '€ ' + eur.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  else { tv.className = 'fx-loading'; tv.textContent = '—'; }

  if (r.tipoCambio && r.currency) {
    const badge = document.getElementById('e_fxBadge');
    badge.style.display = 'inline-flex';
    badge.textContent = `1 ${r.currency} = ${parseFloat(r.tipoCambio).toFixed(4)} EUR`;
  }
  document.getElementById('e_btnDelete').style.display = session && session.perfil === 'admin' ? '' : 'none';
  if (session && session.perfil !== 'admin') document.getElementById('e_responsable').readOnly = true;
  else document.getElementById('e_responsable').readOnly = false;

  document.getElementById('modSearch').style.display = 'none';
  document.getElementById('modEditForm').style.display = 'block';
  window.scrollTo(0, 0);
}

function backToModSearch() {
  document.getElementById('modSearch').style.display = 'block';
  document.getElementById('modEditForm').style.display = 'none';
  _fxRates['e'] = null;
}

async function handleUpdate(e) {
  e.preventDefault();
  const id  = document.getElementById('e_id').value;
  const btn = document.getElementById('e_submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-inline"></span>Guardando...';
  try {
    await CRM.updateOportunidad(id, {
      cliente:      document.getElementById('e_cliente').value,
      industria:    document.getElementById('e_industria').value,
      practica:     document.getElementById('e_practica').value,
      nombre:       document.getElementById('e_nombre').value,
      descripcion:  document.getElementById('e_descripcion').value,
      origen:       document.getElementById('e_origen').value,
      responsable:  document.getElementById('e_responsable').value,
      estado:       document.getElementById('e_estado').value,
      fechaInicio:  document.getElementById('e_fechaInicio').value,
      fechaEntrega: document.getElementById('e_fechaEntrega').value,
      notas:        document.getElementById('e_notas').value,
      tcv:          document.getElementById('e_tcv').value || '0',
      currency:     document.getElementById('e_currency').value,
      tcvEur:       document.getElementById('e_tcvEur').value || '0',
      tipoCambio:   document.getElementById('e_tipoCambio').value || '',
      probabilidad: document.getElementById('e_probabilidad').value || '',
      pm:           document.getElementById('e_pm').value || ''
    });
    TOAST.success('Oportunidad actualizada correctamente.');
    backToModSearch();
    CRM.invalidateCache();
    _modRows = await CRM.getData();
    doModSearch();
  } catch(err) {
    TOAST.error('Error al actualizar. Intentá de nuevo.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Guardar Cambios →';
  }
}

async function handleDelete() {
  const id   = document.getElementById('e_id').value;
  const name = document.getElementById('modEditTitle').textContent;
  if (!confirm(`¿Seguro que querés eliminar "${name}"?`)) return;
  try {
    await CRM.deleteOportunidad(id);
    TOAST.success('Oportunidad eliminada.');
    backToModSearch();
    CRM.invalidateCache();
    _modRows = await CRM.getData();
    doModSearch();
  } catch(err) {
    TOAST.error('Error al eliminar.');
  }
}

// ══════════════════════════════════════════════
// TODAS LAS OPORTUNIDADES
// ══════════════════════════════════════════════
let _tablaRows = [], _sortKey = 'fechaCreacion', _sortDir = -1;

async function initTabla() {
  document.getElementById('todasLoading').style.display = 'flex';
  document.getElementById('todasTable').style.display = 'none';
  _tablaRows = await CRM.getData();
  document.getElementById('todasLoading').style.display = 'none';
  document.getElementById('todasTable').style.display = 'block';

  // Populate responsables
  const resps = [...new Set(_tablaRows.map(r => r.responsable).filter(Boolean))].sort();
  const selR = document.getElementById('t_responsable');
  selR.innerHTML = '<option value="">Todos los responsables</option>';
  resps.forEach(r => selR.innerHTML += `<option>${r}</option>`);

  // Populate clientes
  const clientes = [...new Set(_tablaRows.map(r => r.cliente).filter(Boolean))].sort();
  const selC = document.getElementById('t_cliente');
  selC.innerHTML = '<option value="">Todos los clientes</option>';
  clientes.forEach(cl => selC.innerHTML += `<option>${cl}</option>`);

  renderTabla();
}

function sortTabla(key) {
  if (_sortKey === key) _sortDir *= -1;
  else { _sortKey = key; _sortDir = 1; }
  renderTabla();
}

function renderTabla() {
  const q    = document.getElementById('t_search').value.trim().toLowerCase();
  const est  = document.getElementById('t_estado').value;
  const prac = document.getElementById('t_practica').value;
  const resp = document.getElementById('t_responsable').value;
  const cli  = document.getElementById('t_cliente').value;

  const rows = _tablaRows.filter(r => {
    if (cli  && r.cliente  !== cli)  return false;
    if (est  && r.estado   !== est)  return false;
    if (prac && r.practica !== prac) return false;
    if (resp && r.responsable !== resp) return false;
    if (q) {
      const h = [r.codigo, r.cliente, r.nombre, r.responsable].join(' ').toLowerCase();
      if (!h.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    let av = a[_sortKey] || '', bv = b[_sortKey] || '';
    if (!isNaN(parseFloat(av)) && !isNaN(parseFloat(bv))) return (parseFloat(av) - parseFloat(bv)) * _sortDir;
    return String(av).localeCompare(String(bv)) * _sortDir;
  });

  document.getElementById('todasCount').textContent = `${rows.length} oportunidad${rows.length !== 1 ? 'es' : ''}`;
  const body  = document.getElementById('todasBody');
  const empty = document.getElementById('todasEmpty');
  if (rows.length === 0) { body.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  body.innerHTML = rows.map(r => `
    <tr>
      <td class="col-id">${friendlyId(r)}</td>
      <td style="font-weight:600">${r.cliente || '—'}</td>
      <td style="max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.nombre || '—'}</td>
      <td style="color:var(--text-muted)">${r.responsable || '—'}</td>
      <td><span class="badge ${badgeEstado(r.estado)}">${r.estado || '—'}</span></td>
      <td class="col-action" style="display:flex;gap:6px;justify-content:center">
        <button class="btn-sm" onclick="verOportunidad('${r.id}')">Ver</button>
        ${canEdit(r) ? `<button class="btn-sm" onclick="editFromTabla('${r.id}')">Editar</button>` : ''}
      </td>
    </tr>`).join('');
}

function editFromTabla(id) {
  navigate(document.querySelector('[data-page="modificar"]'));
  setTimeout(() => loadModItem(id), 300);
}

function verOportunidad(id) {
  const r = _tablaRows.find(x => x.id === id);
  if (!r) return;

  document.getElementById('verModalId').textContent = friendlyId(r);
  document.getElementById('verModalTitle').textContent = r.nombre || '—';
  document.getElementById('verModalEditBtn').setAttribute('onclick', `closeVerModal(); editFromTabla('${id}')`);

  const fmtVal = v => v || '—';
  const fmtEURv = v => v ? '€ ' + parseFloat(v).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '—';
  const fmtNum = v => v ? parseFloat(v).toLocaleString('es-AR') : '—';

  const sections = [
    {
      title: 'Información General',
      rows: [
        ['Cliente',       r.cliente],
        ['Industria',     r.industria],
        ['Práctica/Área', r.practica],
        ['Descripción',   r.descripcion],
        ['Origen',        r.origen],
      ]
    },
    {
      title: 'BID',
      rows: [
        ['Responsable',      r.responsable],
        ['Estado',           `<span class="badge ${badgeEstado(r.estado)}">${r.estado || '—'}</span>`],
        ['Fecha de Inicio',  fmtFecha(r.fechaInicio)],
        ['Fecha de Entrega', fmtFecha(r.fechaEntrega)],
        ['Notas',            r.notas],
      ]
    },
    {
      title: 'Datos Comerciales',
      rows: [
        ['TCV',            fmtNum(r.tcv) + (r.currency ? ' ' + r.currency : '')],
        ['TCV EUR',        fmtEURv(r.tcvEur)],
        ['Tipo de Cambio', fmtVal(r.tipoCambio)],
        ['% Probabilidad', r.probabilidad ? r.probabilidad + '%' : '—'],
        ['% PM',           r.pm ? r.pm + '%' : '—'],
      ]
    },
  ];

  document.getElementById('verModalContent').innerHTML = sections.map(s => `
    <div style="margin-bottom:20px">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border)">${s.title}</div>
      ${s.rows.filter(([, v]) => v && v !== '—').map(([label, val]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px">
          <span style="color:var(--text-muted);font-weight:500;flex-shrink:0;margin-right:16px">${label}</span>
          <span style="font-weight:600;text-align:right">${val}</span>
        </div>`).join('')}
    </div>`).join('');

  document.getElementById('verModalOverlay').classList.add('open');
}

function closeVerModal(event) {
  if (event && event.target !== document.getElementById('verModalOverlay')) return;
  document.getElementById('verModalOverlay').classList.remove('open');
}

async function downloadExcelAction() {
  const rows = await CRM.getData();
  CRM.downloadExcel(rows);
}

// ══════════════════════════════════════════════
// ESTADÍSTICAS
// ══════════════════════════════════════════════
let _statsCharts = {};

async function renderStats() {
  document.getElementById('statsLoading').style.display = 'flex';
  document.getElementById('statsContent').style.display = 'none';
  Object.values(_statsCharts).forEach(c => { try { c.destroy(); } catch(e) {} });
  _statsCharts = {};
  const rows = await CRM.getData();
  document.getElementById('statsLoading').style.display = 'none';
  document.getElementById('statsContent').style.display = 'block';

  const totalTCV = rows.reduce((s, r) => s + (parseFloat(r.tcvEur) || 0), 0);
  const probProm = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + (parseFloat(r.probabilidad) || 0), 0) / rows.length) : 0;
  const enDes = rows.filter(r => r.estado === 'En Desarrollo').length;

  document.getElementById('statsKpis').innerHTML = [
    { v: rows.length, l: 'Total Oportunidades' },
    { v: fmtEUR(totalTCV), l: 'TCV EUR Total' },
    { v: enDes, l: 'En Desarrollo' },
    { v: probProm + '%', l: 'Prob. Promedio' }
  ].map(k => `<div class="kpi"><div class="kpi-val">${k.v}</div><div class="kpi-lbl">${k.l}</div></div>`).join('');

  const estadoCounts = {}, estadoTCV = {};
  CRM.ESTADOS.forEach(e => { estadoCounts[e] = 0; estadoTCV[e] = 0; });
  rows.forEach(r => {
    if (estadoCounts[r.estado] !== undefined) {
      estadoCounts[r.estado]++;
      estadoTCV[r.estado] += parseFloat(r.tcvEur) || 0;
    }
  });

  Chart.defaults.font.family = "'Montserrat', sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = '#888';

  _statsCharts.estado = new Chart(document.getElementById('chartEstado'), {
    type: 'doughnut',
    data: { labels: CRM.ESTADOS, datasets: [{ data: CRM.ESTADOS.map(e => estadoCounts[e]), backgroundColor: CRM.ESTADOS.map(e => CRM.ESTADO_COLORS[e]), borderWidth: 0 }] },
    options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14 } } }, cutout: '65%', maintainAspectRatio: false }
  });

  _statsCharts.tcv = new Chart(document.getElementById('chartTCV'), {
    type: 'bar',
    data: { labels: CRM.ESTADOS, datasets: [{ data: CRM.ESTADOS.map(e => estadoTCV[e]), backgroundColor: CRM.ESTADOS.map(e => CRM.ESTADO_COLORS[e]), borderRadius: 6, borderSkipped: false }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#f0ede6' }, ticks: { callback: v => '€' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) } }, x: { grid: { display: false } } }, maintainAspectRatio: false }
  });

  const maxCount = Math.max(...CRM.ESTADOS.map(e => estadoCounts[e] || 0), 1);
  document.getElementById('funnelChart').innerHTML = CRM.ESTADOS.map(e =>
    `<div class="funnel-row"><div class="funnel-label">${e}</div><div class="funnel-track"><div class="funnel-fill" style="width:${Math.round((estadoCounts[e] || 0) / maxCount * 100)}%;background:${CRM.ESTADO_COLORS[e]}"></div></div><div class="funnel-count">${estadoCounts[e] || 0}</div></div>`
  ).join('');

  const origenC = {};
  rows.forEach(r => { if (r.origen) origenC[r.origen] = (origenC[r.origen] || 0) + 1; });
  const origenK = Object.keys(origenC);
  _statsCharts.origen = new Chart(document.getElementById('chartOrigen'), {
    type: 'pie',
    data: { labels: origenK.length ? origenK : ['Sin datos'], datasets: [{ data: origenK.length ? origenK.map(k => origenC[k]) : [1], backgroundColor: PALETTE, borderWidth: 0 }] },
    options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12 } } }, maintainAspectRatio: false }
  });

  const respC = {};
  rows.forEach(r => { if (r.responsable) respC[r.responsable] = (respC[r.responsable] || 0) + 1; });
  const respK = Object.keys(respC).sort((a, b) => respC[b] - respC[a]).slice(0, 8);
  _statsCharts.resp = new Chart(document.getElementById('chartResp'), {
    type: 'bar',
    data: { labels: respK.length ? respK : ['Sin datos'], datasets: [{ data: respK.length ? respK.map(k => respC[k]) : [0], backgroundColor: respK.length ? respK.map(k => colorForValue(k)) : ['#8a38fe'], borderRadius: 6, borderSkipped: false }] },
    options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#f0ede6' }, ticks: { stepSize: 1 } }, y: { grid: { display: false } } }, maintainAspectRatio: false }
  });

  const pracC = {};
  rows.forEach(r => { if (r.practica) pracC[r.practica] = (pracC[r.practica] || 0) + 1; });
  const pracK = Object.keys(pracC).sort((a, b) => pracC[b] - pracC[a]);
  _statsCharts.prac = new Chart(document.getElementById('chartPractica'), {
    type: 'bar',
    data: { labels: pracK.length ? pracK : ['Sin datos'], datasets: [{ data: pracK.length ? pracK.map(k => pracC[k]) : [0], backgroundColor: PALETTE, borderRadius: 6, borderSkipped: false }] },
    options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#f0ede6' }, ticks: { stepSize: 1 } }, y: { grid: { display: false } } }, maintainAspectRatio: false }
  });

  const indC = {};
  rows.forEach(r => { if (r.industria) indC[r.industria] = (indC[r.industria] || 0) + 1; });
  const indK = Object.keys(indC).sort((a, b) => indC[b] - indC[a]);
  _statsCharts.ind = new Chart(document.getElementById('chartIndustria'), {
    type: 'pie',
    data: { labels: indK.length ? indK : ['Sin datos'], datasets: [{ data: indK.length ? indK.map(k => indC[k]) : [1], backgroundColor: PALETTE, borderWidth: 0 }] },
    options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12 } } }, maintainAspectRatio: false }
  });
}

// ══════════════════════════════════════════════
// PERFIL
// ══════════════════════════════════════════════
function renderPerfil() {
  const s = AUTH.getSession();
  if (!s) return;
  const perfBadge = s.perfil === 'admin' ? 'badge-admin' : 'badge-usuario';
  document.getElementById('perfilInfo').innerHTML =
    `<div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
      <div style="width:56px;height:56px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0">${s.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
      <div><div style="font-size:16px;font-weight:700">${s.nombre}</div><div style="font-size:12px;color:var(--text-muted);margin-top:2px">${s.email}</div></div>
    </div>
    ${infoRow('Perfil', `<span class="badge ${perfBadge}">${s.perfil}</span>`)}
    ${infoRow('Estado', '<span class="badge badge-activa">Activo</span>')}`;
  updateThemeUI();
}

function infoRow(label, value) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px"><span style="color:var(--text-muted);font-weight:500">${label}</span><span style="font-weight:600">${value}</span></div>`;
}

function updateThemeUI() {
  const isDark = THEME.getSavedTheme() === 'dark';
  const toggle = document.getElementById('themeToggle');
  const knob   = document.getElementById('themeKnob');
  const label  = document.getElementById('themeLabel');
  if (toggle) toggle.style.background = isDark ? 'var(--accent)' : '#ccc';
  if (knob)   knob.style.transform    = isDark ? 'translateX(20px)' : 'translateX(0)';
  if (label)  label.textContent       = isDark ? 'Oscuro' : 'Claro';
}

function handleThemeToggle() {
  THEME.saveTheme(THEME.getSavedTheme() === 'dark' ? 'light' : 'dark');
  updateThemeUI();
}

async function handleChangePass(e) {
  e.preventDefault();
  const oldPass     = document.getElementById('p_oldPass').value;
  const newPass     = document.getElementById('p_newPass').value;
  const confirmPass = document.getElementById('p_confirmPass').value;
  const btn         = document.getElementById('p_btnChange');
  if (newPass !== confirmPass) { TOAST.error('Las contraseñas nuevas no coinciden.'); return; }
  if (newPass.length < 6)     { TOAST.error('La contraseña debe tener al menos 6 caracteres.'); return; }
  btn.disabled = true;
  btn.textContent = 'Guardando...';
  try {
    const result = await AUTH.changePassword(oldPass, newPass);
    if (result.ok) { TOAST.success('Contraseña actualizada correctamente.'); e.target.reset(); }
    else TOAST.error(result.error);
  } catch(err) {
    TOAST.error('Error de conexión.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Cambiar Contraseña';
  }
}

// ══════════════════════════════════════════════
// USUARIOS
// ══════════════════════════════════════════════
let _allUsers = [];

async function loadUsuarios() {
  document.getElementById('usuariosLoading').style.display = 'flex';
  document.getElementById('usuariosTable').style.display = 'none';
  _allUsers = await AUTH.getAllUsers();
  document.getElementById('usuariosLoading').style.display = 'none';
  document.getElementById('usuariosTable').style.display = 'block';
  document.getElementById('usuariosBody').innerHTML = _allUsers.map(u => `
    <tr>
      <td style="font-weight:600">${u.nombre}</td>
      <td style="color:var(--text-muted);font-size:12px">${u.email}</td>
      <td><span class="badge ${u.perfil === 'admin' ? 'badge-admin' : 'badge-usuario'}">${u.perfil}</span></td>
      <td><span class="badge ${u.activo ? 'badge-activa' : 'badge-cerrada'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td style="text-align:center"><button class="btn-sm" onclick="openUserModal('edit','${u.uid}')">Editar</button></td>
    </tr>`).join('');
}

function openUserModal(mode, uid) {
  document.getElementById('um_mode').value = mode;
  document.getElementById('userModalAlert').className = 'alert';
  document.getElementById('userModalForm').reset();
  if (mode === 'new') {
    document.getElementById('userModalTitle').textContent = 'Nuevo Usuario';
    document.getElementById('userModalSub').textContent = 'Completá los datos del nuevo usuario.';
    document.getElementById('um_btn').textContent = 'Crear Usuario';
    document.getElementById('um_passGroup').style.display = 'block';
    document.getElementById('um_passResetGroup').style.display = 'none';
    document.getElementById('um_pass').required = true;
  } else {
    const u = _allUsers.find(x => x.uid === uid);
    if (!u) return;
    document.getElementById('userModalTitle').textContent = 'Editar Usuario';
    document.getElementById('userModalSub').textContent = `Modificando: ${u.nombre}`;
    document.getElementById('um_usuarioOriginal').value = uid;
    document.getElementById('um_nombre').value = u.nombre;
    document.getElementById('um_email').value = u.email;
    document.getElementById('um_perfil').value = u.perfil;
    document.getElementById('um_activo').value = u.activo ? 'SI' : 'NO';
    document.getElementById('um_passGroup').style.display = 'none';
    document.getElementById('um_passResetGroup').style.display = 'block';
    document.getElementById('um_pass').required = false;
  }
  document.getElementById('userModalOverlay').classList.add('open');
}

function closeUserModal() {
  document.getElementById('userModalOverlay').classList.remove('open');
}

async function handleUserModalSubmit(e) {
  e.preventDefault();
  const mode = document.getElementById('um_mode').value;
  const btn  = document.getElementById('um_btn');
  btn.disabled = true;
  btn.textContent = 'Guardando...';
  try {
    if (mode === 'new') {
      const pass = document.getElementById('um_pass').value;
      if (pass.length < 6) { showModalAlert('La contraseña debe tener al menos 6 caracteres.'); return; }
      const result = await AUTH.addUser({
        nombre:     document.getElementById('um_nombre').value,
        usuario:    document.getElementById('um_email').value.split('@')[0],
        email:      document.getElementById('um_email').value,
        contrasena: pass,
        perfil:     document.getElementById('um_perfil').value,
        activo:     document.getElementById('um_activo').value === 'SI'
      });
      if (result.ok) { TOAST.success('Usuario creado correctamente.'); closeUserModal(); loadUsuarios(); }
      else showModalAlert(result.error || 'Error al crear el usuario.');
    } else {
      const uid = document.getElementById('um_usuarioOriginal').value;
      const data = {
        nombre:  document.getElementById('um_nombre').value,
        email:    document.getElementById('um_email').value,
        perfil:  document.getElementById('um_perfil').value,
        activo:  document.getElementById('um_activo').value === 'SI'
      };
      const newPass = document.getElementById('um_passReset').value;
      if (newPass) {
        if (newPass.length < 6) { showModalAlert('La contraseña debe tener al menos 6 caracteres.'); return; }
        // Actualizar contrasena via Firebase Auth
        const user = firebase.auth().currentUser;
        // Para admin cambiando contrasena de otro, necesitamos Cloud Functions
        // Por ahora, actualizamos solo el perfil
      }
      const ok = await AUTH.updateUser(uid, data);
      if (ok) { TOAST.success('Usuario actualizado correctamente.'); closeUserModal(); loadUsuarios(); }
      else showModalAlert('Error al guardar.');
    }
  } catch(err) {
    showModalAlert('Error de conexión.');
  } finally {
    btn.disabled = false;
    btn.textContent = mode === 'new' ? 'Crear Usuario' : 'Guardar Cambios';
  }
}

function showModalAlert(msg) {
  const box = document.getElementById('userModalAlert');
  box.textContent = msg;
  box.className = 'alert alert-error show';
  document.getElementById('um_btn').disabled = false;
}

// ══════════════════════════════════════════════
// MIS OPORTUNIDADES
// ══════════════════════════════════════════════
let _misRows = [], _misSortKey = 'fechaCreacion', _misSortDir = -1;

async function initMis() {
  document.getElementById('misLoading').style.display = 'flex';
  document.getElementById('misTable').style.display = 'none';
  const session = AUTH.getSession();
  const raw = await CRM.getData();
  _misRows = raw.filter(r => r.responsableUid === session.uid);
  document.getElementById('misLoading').style.display = 'none';
  document.getElementById('misTable').style.display = 'block';
  renderMis();
}

async function misRefresh() {
  CRM.invalidateCache();
  await initMis();
}

function sortMis(key) {
  if (_misSortKey === key) _misSortDir *= -1;
  else { _misSortKey = key; _misSortDir = 1; }
  renderMis();
}

function renderMis() {
  const q   = document.getElementById('mis_search').value.trim().toLowerCase();
  const est = document.getElementById('mis_estado').value;
  const rows = _misRows.filter(r => {
    if (est && r.estado !== est) return false;
    if (q) { const h = [r.codigo, r.cliente, r.nombre].join(' ').toLowerCase(); if (!h.includes(q)) return false; }
    return true;
  }).sort((a, b) => {
    let av = a[_misSortKey] || '', bv = b[_misSortKey] || '';
    if (!isNaN(parseFloat(av)) && !isNaN(parseFloat(bv))) return (parseFloat(av) - parseFloat(bv)) * _misSortDir;
    return String(av).localeCompare(String(bv)) * _misSortDir;
  });

  document.getElementById('misCount').textContent = `${rows.length} oportunidad${rows.length !== 1 ? 'es' : ''}`;
  const body = document.getElementById('misBody'), empty = document.getElementById('misEmpty');
  if (rows.length === 0) { body.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  body.innerHTML = rows.map(r => `
    <tr>
      <td class="col-id">${friendlyId(r)}</td>
      <td style="font-weight:600">${r.cliente || '—'}</td>
      <td style="max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.nombre || '—'}</td>
      <td><span class="badge ${badgeEstado(r.estado)}">${r.estado || '—'}</span></td>
      <td class="col-action" style="display:flex;gap:6px;justify-content:center">
        <button class="btn-sm" onclick="verOportunidad('${r.id}')">Ver</button>
        <button class="btn-sm" onclick="editFromTabla('${r.id}')">Editar</button>
      </td>
    </tr>`).join('');
}

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
function initApp() {
  // Auth check
  const session = AUTH.requireAuth();
  if (!session) return;

  // User info
  document.getElementById('userAvatar').textContent = session.nombre.split(' ').map(n => n[0]).slice(0, 2).join('');
  document.getElementById('userName').textContent   = session.nombre.split(' ').slice(0, 2).join(' ');
  document.getElementById('userPerfil').textContent = session.perfil;
  if (session.perfil === 'admin') document.getElementById('btnUsuarios').style.display = 'flex';

  // Sidebar toggle
  document.getElementById('toggleBtn').addEventListener('click', () =>
    document.getElementById('sidebar').classList.toggle('collapsed')
  );

  // Pre-fill responsable
  document.getElementById('n_responsable').value = session.nombre;
  if (session.perfil !== 'admin') document.getElementById('n_responsable').readOnly = true;

  // Connection check
  checkConexion();
  setInterval(checkConexion, 60000);

  // Real-time listener: si cambian datos en Firestore, actualizar
  CRM.onOportunidadesChange((freshData) => {
    const activeSection = document.querySelector('.page-section.active');
    if (activeSection) {
      const page = activeSection.id.replace('page-', '');
      // Re-render solo si estamos en una seccion de datos
      if (['home', 'mis', 'todas', 'estadisticas'].includes(page)) {
        onPageEnter(page);
      }
    }
  });

  // Load home
  renderHome();
}

// Esperar a que el DOM este listo
document.addEventListener('DOMContentLoaded', initApp);
