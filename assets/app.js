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
// PAGINATION
// ══════════════════════════════════════════════
const PER_PAGE = 20;

function paginate(rows, page) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * PER_PAGE;
  const pageRows = rows.slice(start, start + PER_PAGE);
  return { rows: pageRows, current, totalPages, total, start: start + 1, end: Math.min(start + PER_PAGE, total) };
}

function renderPagination(containerId, state, onPageChange) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (state.totalPages <= 1) { el.style.display = 'none'; return; }
  el.style.display = 'flex';

  const { current, totalPages, total, start, end } = state;
  let pages = [];

  // Always show first page
  pages.push(1);
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) pages.push(i);
  if (current < totalPages - 2) pages.push('...');
  if (totalPages > 1) pages.push(totalPages);

  const btns = pages.map(p => {
    if (p === '...') return '<span class="page-ellipsis">...</span>';
    return `<button class="page-btn${p === current ? ' active' : ''}" data-page="${p}">${p}</button>`;
  }).join('');

  el.innerHTML =
    `<div class="pagination-info">${start}–${end} de ${total}</div>` +
    `<div class="pagination-btns">` +
      `<button class="page-btn" data-page="prev" ${current === 1 ? 'disabled' : ''}>←</button>` +
      btns +
      `<button class="page-btn" data-page="next" ${current === totalPages ? 'disabled' : ''}>→</button>` +
    `</div>`;

  el.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.page;
      if (btn.disabled || btn.classList.contains('active')) return;
      if (val === 'prev') onPageChange(current - 1);
      else if (val === 'next') onPageChange(current + 1);
      else onPageChange(parseInt(val));
    });
  });
}

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
  return s.perfil === 'admin' || r.responsable === s.nombre;
}

function badgeEstado(e) {
  return { 'En Desarrollo': 'badge-desarrollo', 'Entregada': 'badge-entregada', 'Finalizada': 'badge-finalizada', 'Pausa': 'badge-pausa', 'No Go': 'badge-nogo', 'Cancelada': 'badge-cancelada', 'Perdida': 'badge-perdido', 'Ganada': 'badge-ganado' }[e] || '';
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
  home: 'Inicio', nueva: 'Nueva Oportunidad',
  mis: 'Mis Oportunidades', todas: 'Ver Todas', kanban: 'Kanban',
  calendario: 'Calendario', estadisticas: 'Estadísticas', perfil: 'Mi Perfil', log: 'Log de Eventos', usuarios: 'Administración'
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
  else if (page === 'kanban')       initKanban();
  else if (page === 'calendario')   initCalendario();
  else if (page === 'estadisticas') renderStats();
  else if (page === 'perfil')       renderPerfil();
  else if (page === 'log')          initLog();
  else if (page === 'usuarios')     loadUsuarios();
}

// ══════════════════════════════════════════════
// STATUS CHECK
// ══════════════════════════════════════════════
async function checkConexion() {
  // Primero verificar conexion de red (no consume Firebase)
  if (!navigator.onLine) { setStatus('error'); return; }
  setStatus('sincronizando');
  try {
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
  const ganadas  = rows.filter(r => r.estado === 'Ganada').length;
  const perdidas = rows.filter(r => r.estado === 'Perdida').length;
  const winRate  = (ganadas + perdidas) > 0 ? Math.round(ganadas / (ganadas + perdidas) * 100) : 0;

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
      `<div class="etapa-item"><div class="etapa-dot" style="background:${CRM.ESTADO_COLORS[e]}"></div>${escapeHtml(e)} (${counts[e]})</div>`
    ).join('');
  }

  const recientes = rows.slice(0, 5);
  const recientesContent = document.getElementById('recientesContent');
  if (recientesContent) {
    recientesContent.innerHTML = recientes.length === 0
      ? '<div class="empty"><div class="empty-text">Sin oportunidades aún</div></div>'
      : `<table><thead><tr><th>Nombre</th><th>Cliente</th><th>Estado</th></tr></thead><tbody>${recientes.map(r =>
          `<tr><td>${escapeHtml(r.nombre) || '—'}</td><td style="color:var(--text-muted)">${escapeHtml(r.cliente) || '—'}</td><td><span class="badge ${badgeEstado(r.estado)}">${escapeHtml(r.estado) || '—'}</span></td></tr>`
        ).join('')}</tbody></table>`;
  }
}

// ══════════════════════════════════════════════
// FX (Conversión de divisas)
// ══════════════════════════════════════════════
const _fxRates = {};
const _fxCache = {};       // Cache por moneda: { ARS: { rate, ts }, USD: { rate, ts } }
const _FX_CACHE_TTL = 30 * 60 * 1000; // 30 minutos

// Obtiene tipo de cambio (reutilizable, sin depender del DOM)
async function getFXRate(currency) {
  if (!currency || currency === 'EUR') return 1;
  const cached = _fxCache[currency];
  if (cached && (Date.now() - cached.ts < _FX_CACHE_TTL)) return cached.rate;
  try {
    const res  = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
    const data = await res.json();
    const rate = data.rates['EUR'];
    _fxCache[currency] = { rate, ts: Date.now() };
    return rate;
  } catch(e) {
    console.warn(`Error obteniendo FX para ${currency}:`, e);
    return null;
  }
}

// Parsea un número en formato argentino (1.234.567,89) o estándar (1234567.89)
// Soporta símbolo % al final (se ignora)
function parseLocalizedNumber(val) {
  if (val === undefined || val === null || val === '') return NaN;
  let s = String(val).trim();
  // Quitar símbolo % si el usuario lo escribió
  if (s.endsWith('%')) s = s.slice(0, -1).trim();
  if (s === '') return NaN;

  const dotCount   = (s.match(/\./g) || []).length;
  const commaCount = (s.match(/,/g) || []).length;

  // Sin separadores: número plano "1500000"
  if (dotCount === 0 && commaCount === 0) return Number(s);

  // Un solo punto sin comas: decimal estándar "1.5"
  if (dotCount === 1 && commaCount === 0) return Number(s);

  // Formato argentino (puntos=miles, coma=decimal):
  //   "1.500.000"      → 1500000
  //   "1.500.000,89"   → 1500000.89
  //   "1500,50"        → 1500.50
  if (dotCount > 1 || commaCount > 0) {
    return Number(s.replace(/\./g, '').replace(',', '.'));
  }

  // Fallback: formato US (comas=miles, punto=decimal)
  return Number(s.replace(/,/g, ''));
}

async function fetchFX(prefix) {
  const currency = document.getElementById(`${prefix}_currency`).value;
  if (!currency || currency === 'EUR') {
    _fxRates[prefix] = currency === 'EUR' ? 1 : null;
    document.getElementById(`${prefix}_tipoCambio`).value = currency === 'EUR' ? 1 : '';
    document.getElementById(`${prefix}_fxBadge`).style.display = 'none';
    calcFX(prefix);
    return;
  }

  // Verificar cache por moneda (usar getFXRate para reutilizar)
  const cached = _fxCache[currency];
  if (cached && (Date.now() - cached.ts < _FX_CACHE_TTL)) {
    _fxRates[prefix] = cached.rate;
    document.getElementById(`${prefix}_tipoCambio`).value = cached.rate.toFixed(6);
    const badge = document.getElementById(`${prefix}_fxBadge`);
    badge.style.display = 'inline-flex';
    badge.textContent = `1 ${currency} = ${cached.rate.toFixed(4)} EUR`;
    calcFX(prefix);
    return;
  }

  const eurDisplay = document.getElementById(`${prefix}_tcvEurValue`);
  const eurContainer = eurDisplay ? eurDisplay.parentElement : null;
  eurDisplay.className = 'fx-loading';
  eurDisplay.textContent = 'Obteniendo tipo de cambio...';
  if (eurContainer) eurContainer.style.borderColor = 'var(--border)';
  document.getElementById(`${prefix}_fxBadge`).style.display = 'none';
  try {
    const rate = await getFXRate(currency);
    if (rate) {
      _fxRates[prefix] = rate;
      document.getElementById(`${prefix}_tipoCambio`).value = rate.toFixed(6);
      const badge = document.getElementById(`${prefix}_fxBadge`);
      badge.style.display = 'inline-flex';
      badge.textContent = `1 ${currency} = ${rate.toFixed(4)} EUR`;
      calcFX(prefix);
    } else {
      eurDisplay.textContent = 'Error al obtener tipo de cambio';
    }
  } catch(e) {
    eurDisplay.textContent = 'Error al obtener tipo de cambio';
  }
}

function calcFX(prefix) {
  const tcv      = parseLocalizedNumber(document.getElementById(`${prefix}_tcv`).value) || 0;
  const fx       = parseFloat(document.getElementById(`${prefix}_tipoCambio`).value) || _fxRates[prefix];
  const currency = document.getElementById(`${prefix}_currency`).value;
  const display  = document.getElementById(`${prefix}_tcvEurValue`);
  const eurContainer = display ? display.parentElement : null;
  if (!currency) { display.className = 'fx-loading'; display.textContent = 'Seleccioná moneda y TCV'; if (eurContainer) eurContainer.style.borderColor = 'var(--border)'; document.getElementById(`${prefix}_tcvEur`).value = ''; return; }
  if (!fx)       { display.className = 'fx-loading'; display.textContent = 'Obteniendo tipo de cambio...'; if (eurContainer) eurContainer.style.borderColor = 'var(--border)'; return; }
  if (!tcv)      { display.className = 'fx-loading'; display.textContent = 'Ingresá el TCV'; if (eurContainer) eurContainer.style.borderColor = 'var(--border)'; document.getElementById(`${prefix}_tcvEur`).value = ''; return; }
  const eur = tcv * fx;
  display.className = '';
  display.style.color = 'var(--text)';
  display.textContent = '€ ' + eur.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById(`${prefix}_tcvEur`).value = eur.toFixed(2);
  if (eurContainer) eurContainer.style.borderColor = 'var(--accent)';
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
      tcv:          parseLocalizedNumber(document.getElementById('n_tcv').value) || 0,
      currency:     document.getElementById('n_currency').value,
      tcvEur:       document.getElementById('n_tcvEur').value || '0',
      tipoCambio:   document.getElementById('n_tipoCambio').value || '',
      probabilidad: parseLocalizedNumber(document.getElementById('n_probabilidad').value) || 0,
      pm:           parseLocalizedNumber(document.getElementById('n_pm').value) || 0
    });
    CRM.logEvento('creacion', 'Creó la oportunidad', id, '', document.getElementById('n_nombre').value);
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
// EDITAR OPORTUNIDAD (MODAL)
// ══════════════════════════════════════════════

function findRowById(id) {
  return _tablaRows.find(x => x.id === id) || _kanbanRows.find(x => x.id === id) || _calRows.find(x => x.id === id) || _misRows.find(x => x.id === id) || null;
}

async function openEditModal(id) {
  let r = findRowById(id);
  if (!r) r = await CRM.getOportunidad(id);
  if (!r) return;
  const session = AUTH.getSession();
  if (session && session.perfil !== 'admin' && r.responsable !== session.nombre) {
    alert('Solo podés editar oportunidades que te pertenecen.');
    return;
  }
  document.getElementById('e_id').value = id;
  document.getElementById('editModalTitle').textContent = r.nombre;
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
  document.getElementById('e_probabilidad').value = r.probabilidad || '';

  // Manejar tipoCambio y tcvEur: 0 significa "nunca calculado", no "cero"
  const savedRate = (r.tipoCambio && r.tipoCambio !== 0) ? parseFloat(r.tipoCambio) : null;
  const savedEur  = (r.tcvEur && r.tcvEur !== 0) ? parseFloat(r.tcvEur) : 0;
  document.getElementById('e_tipoCambio').value = savedRate ? savedRate.toFixed(6) : '';
  document.getElementById('e_tcvEur').value     = savedEur ? savedEur.toFixed(2) : '';
  _fxRates['e'] = savedRate;

  const tv = document.getElementById('e_tcvEurValue');
  const eurContainer = tv ? tv.parentElement : null;
  if (savedEur) {
    tv.className = '';
    tv.textContent = '€ ' + savedEur.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (eurContainer) eurContainer.style.borderColor = 'var(--accent)';
  } else {
    tv.className = 'fx-loading';
    tv.textContent = '—';
    if (eurContainer) eurContainer.style.borderColor = 'var(--border)';
  }

  const badge = document.getElementById('e_fxBadge');
  if (savedRate && r.currency) {
    badge.style.display = 'inline-flex';
    badge.textContent = `1 ${r.currency} = ${savedRate.toFixed(4)} EUR`;
  } else {
    badge.style.display = 'none';
  }

  document.getElementById('e_btnDelete').style.display = session && session.perfil === 'admin' ? '' : 'none';
  if (session && session.perfil !== 'admin') document.getElementById('e_responsable').readOnly = true;
  else document.getElementById('e_responsable').readOnly = false;

  document.getElementById('editModalOverlay').classList.add('open');

  // Si tiene currency pero no tiene tipo de cambio, buscarlo automáticamente
  if (r.currency && r.currency !== 'EUR' && !savedRate) {
    fetchFX('e');
  }
}

function closeEditModal(event) {
  if (event && event.target !== document.getElementById('editModalOverlay')) return;
  document.getElementById('editModalOverlay').classList.remove('open');
  _fxRates['e'] = null;
}

async function handleUpdate(e) {
  e.preventDefault();
  const id  = document.getElementById('e_id').value;
  const btn = document.getElementById('e_submitBtn');

  // Capturar estado viejo antes de actualizar
  const opp = findRowById(id) || {};
  const oldEstado = opp.estado || '';
  const newEstado = document.getElementById('e_estado').value;

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
      tcv:          parseLocalizedNumber(document.getElementById('e_tcv').value) || 0,
      currency:     document.getElementById('e_currency').value,
      tcvEur:       document.getElementById('e_tcvEur').value || '0',
      tipoCambio:   document.getElementById('e_tipoCambio').value || '',
      probabilidad: parseLocalizedNumber(document.getElementById('e_probabilidad').value) || 0,
      pm:           parseLocalizedNumber(document.getElementById('e_pm').value) || 0
    });

    // Log del evento
    if (oldEstado && newEstado && oldEstado !== newEstado) {
      CRM.logEvento('cambio_estado', `Cambio estado: ${oldEstado} → ${newEstado}`, id, opp.codigo, opp.nombre);
    } else {
      CRM.logEvento('edicion', 'Editó la oportunidad', id, opp.codigo, opp.nombre);
    }
    TOAST.success('Oportunidad actualizada correctamente.');
    closeEditModal();
    CRM.invalidateCache();
    await refreshCurrentPage();
  } catch(err) {
    TOAST.error('Error al actualizar. Intentá de nuevo.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Guardar Cambios →';
  }
}

async function handleDelete() {
  const id   = document.getElementById('e_id').value;
  const name = document.getElementById('editModalTitle').textContent;
  const oppDel = findRowById(id) || {};
  if (!confirm(`¿Seguro que querés eliminar "${name}"?`)) return;
  try {
    await CRM.deleteOportunidad(id);
    CRM.logEvento('eliminacion', 'Eliminó la oportunidad', id, oppDel.codigo, oppDel.nombre);
    TOAST.success('Oportunidad eliminada.');
    closeEditModal();
    CRM.invalidateCache();
    await refreshCurrentPage();
  } catch(err) {
    TOAST.error('Error al eliminar.');
  }
}

async function refreshCurrentPage() {
  const activePage = document.querySelector('.nav-item.active');
  if (!activePage) return;
  const page = activePage.dataset.page;
  if (page === 'todas') await initTabla();
  else if (page === 'mis') await initMis();
  else if (page === 'kanban') await initKanban();
  else if (page === 'calendario') await initCalendario();
  else if (page === 'estadisticas') await renderStats();
  else if (page === 'home') await renderHome();
}

// ══════════════════════════════════════════════
// TODAS LAS OPORTUNIDADES
// ══════════════════════════════════════════════
let _tablaRows = [], _sortKey = 'fechaCreacion', _sortDir = -1, _tablaPage = 1;

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
  resps.forEach(r => selR.innerHTML += `<option>${escapeHtml(r)}</option>`);

  // Populate clientes
  const clientes = [...new Set(_tablaRows.map(r => r.cliente).filter(Boolean))].sort();
  const selC = document.getElementById('t_cliente');
  selC.innerHTML = '<option value="">Todos los clientes</option>';
  clientes.forEach(cl => selC.innerHTML += `<option>${escapeHtml(cl)}</option>`);

  _tablaPage = 1;
  renderTabla();
}

function sortTabla(key) {
  if (_sortKey === key) _sortDir *= -1;
  else { _sortKey = key; _sortDir = 1; }
  _tablaPage = 1;
  renderTabla();
}

function renderTabla(page) {
  if (page !== undefined) _tablaPage = page;
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
  if (rows.length === 0) { body.innerHTML = ''; empty.style.display = 'block'; document.getElementById('todasPagination').style.display = 'none'; return; }
  empty.style.display = 'none';

  const pg = paginate(rows, _tablaPage);
  body.innerHTML = pg.rows.map(r => `
    <tr>
      <td class="col-id">${escapeHtml(friendlyId(r))}</td>
      <td style="font-weight:600">${escapeHtml(r.cliente) || '—'}</td>
      <td style="max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(r.nombre) || '—'}</td>
      <td style="color:var(--text-muted)">${escapeHtml(r.responsable) || '—'}</td>
      <td><span class="badge ${badgeEstado(r.estado)}">${escapeHtml(r.estado) || '—'}</span></td>
      <td class="col-action" style="display:flex;gap:6px;justify-content:center">
        <button class="btn-sm" onclick="verOportunidad('${r.id}')">Ver</button>
        ${canEdit(r) ? `<button class="btn-sm" onclick="editFromTabla('${r.id}')">Editar</button>` : ''}
      </td>
    </tr>`).join('');

  renderPagination('todasPagination', pg, (p) => renderTabla(p));
}

function editFromTabla(id) {
  openEditModal(id);
}

function verOportunidad(id) {
  let r = _tablaRows.find(x => x.id === id) || _kanbanRows.find(x => x.id === id) || _calRows.find(x => x.id === id);
  if (!r) return;

  document.getElementById('verModalId').textContent = friendlyId(r);
  document.getElementById('verModalTitle').textContent = r.nombre || '—';
  document.getElementById('verModalEditBtn').setAttribute('onclick', `closeVerModal(); openEditModal('${id}')`);

  const fmtVal = v => v || '—';
  const fmtEURv = v => v ? '€ ' + parseFloat(v).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '—';
  const fmtNum = v => v ? parseFloat(v).toLocaleString('es-AR') : '—';

  const sections = [
    {
      title: 'Información General',
      rows: [
        ['Cliente',       escapeHtml(r.cliente)],
        ['Industria',     escapeHtml(r.industria)],
        ['Práctica/Área', escapeHtml(r.practica)],
        ['Descripción',   escapeHtml(r.descripcion)],
        ['Origen',        escapeHtml(r.origen)],
      ]
    },
    {
      title: 'BID',
      rows: [
        ['Responsable',      escapeHtml(r.responsable)],
        ['Estado',           `<span class="badge ${badgeEstado(r.estado)}">${escapeHtml(r.estado) || '—'}</span>`],
        ['Fecha de Inicio',  fmtFecha(r.fechaInicio)],
        ['Fecha de Entrega', fmtFecha(r.fechaEntrega)],
        ['Notas',            escapeHtml(r.notas)],
      ]
    },
    {
      title: 'Datos Comerciales',
      rows: [
        ['TCV',            fmtNum(r.tcv) + (r.currency ? ' ' + escapeHtml(r.currency) : '')],
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
// CALENDARIO
// ══════════════════════════════════════════════
let _calYear, _calMonth, _calRows = [];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEMANA = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

async function initCalendario() {
  document.getElementById('calLoading').style.display = 'flex';
  document.getElementById('calContent').style.display = 'none';
  _calRows = await CRM.getData();
  document.getElementById('calLoading').style.display = 'none';
  document.getElementById('calContent').style.display = 'block';
  if (_calYear === undefined) {
    const now = new Date();
    _calYear = now.getFullYear();
    _calMonth = now.getMonth();
  }
  renderCalendario();
}

function calNavMonth(delta) {
  _calMonth += delta;
  if (_calMonth > 11) { _calMonth = 0; _calYear++; }
  if (_calMonth < 0)  { _calMonth = 11; _calYear--; }
  renderCalendario();
}

function calGoToday() {
  const now = new Date();
  _calYear = now.getFullYear();
  _calMonth = now.getMonth();
  renderCalendario();
}

function renderCalendario() {
  document.getElementById('calMonthLabel').textContent = `${MESES[_calMonth]} ${_calYear}`;

  const grid = document.getElementById('calGrid');
  const firstDay = new Date(_calYear, _calMonth, 1);
  const lastDay  = new Date(_calYear, _calMonth + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = lastDay.getDate();

  // Build events map: key = "YYYY-MM-DD", value = [{row, type}]
  const events = {};
  _calRows.forEach(r => {
    if (r.fechaEntrega) {
      const d = toInputDate(r.fechaEntrega);
      if (d) {
        const key = d.substring(0, 10);
        if (!events[key]) events[key] = [];
        events[key].push({ row: r, type: 'entrega' });
      }
    }
    if (r.fechaInicio && r.fechaEntrega) {
      const d = toInputDate(r.fechaInicio);
      if (d) {
        const key = d.substring(0, 10);
        if (!events[key]) events[key] = [];
        events[key].push({ row: r, type: 'inicio' });
      }
    }
  });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  // Previous month trailing days
  const prevLast = new Date(_calYear, _calMonth, 0).getDate();
  let html = '<div class="cal-grid-header">' + DIAS_SEMANA.map(d => `<div class="cal-dow">${d}</div>`).join('') + '</div>';
  html += '<div class="cal-grid-body">';

  // Previous month padding
  for (let i = startDow - 1; i >= 0; i--) {
    html += `<div class="cal-day cal-day-other">${prevLast - i}</div>`;
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${_calYear}-${String(_calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === todayStr;
    const dayEvents = events[dateStr] || [];

    html += `<div class="cal-day${isToday ? ' cal-day-today' : ''}">`;
    html += `<div class="cal-day-num">${d}</div>`;

    if (dayEvents.length > 0) {
      html += '<div class="cal-events">';
      dayEvents.slice(0, 3).forEach(ev => {
        const color = CRM.ESTADO_COLORS[ev.row.estado] || 'var(--text-muted)';
        if (ev.type === 'entrega') {
          html += `<div class="cal-event cal-event-entrega" style="border-left-color:${color}" onclick="verOportunidad('${ev.row.id}')" title="${escapeHtml(ev.row.nombre || '')} — ${escapeHtml(ev.row.cliente || '')}">
            <span class="cal-event-dot" style="background:${color}"></span>
            <span class="cal-event-text">${escapeHtml(ev.row.nombre) || '—'}</span>
          </div>`;
        } else {
          html += `<div class="cal-event cal-event-inicio" onclick="verOportunidad('${ev.row.id}')" title="Inicio: ${escapeHtml(ev.row.nombre || '')}">
            <span class="cal-event-text">${escapeHtml(ev.row.nombre) || '—'}</span>
          </div>`;
        }
      });
      if (dayEvents.length > 3) {
        html += `<div class="cal-event-more">+${dayEvents.length - 3} más</div>`;
      }
      html += '</div>';
    }
    html += '</div>';
  }

  // Next month padding
  const totalCells = startDow + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="cal-day cal-day-other">${i}</div>`;
  }

  html += '</div>';
  grid.innerHTML = html;
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
      <div style="width:56px;height:56px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0">${escapeHtml(s.nombre.split(' ').map(n => n[0]).slice(0, 2).join(''))}</div>
      <div><div style="font-size:16px;font-weight:700">${escapeHtml(s.nombre)}</div><div style="font-size:12px;color:var(--text-muted);margin-top:2px">${escapeHtml(s.email)}</div></div>
    </div>
    ${infoRow('Perfil', `<span class="badge ${perfBadge}">${escapeHtml(s.perfil)}</span>`)}
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
      <td style="font-weight:600">${escapeHtml(u.nombre)}</td>
      <td style="color:var(--text-muted);font-size:12px">${escapeHtml(u.email)}</td>
      <td><span class="badge ${u.perfil === 'admin' ? 'badge-admin' : 'badge-usuario'}">${escapeHtml(u.perfil)}</span></td>
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
      if (pass.length < 6) { showModalAlert('La contraseña debe tener al menos 6 caracteres.'); btn.disabled = false; btn.textContent = 'Crear Usuario'; return; }
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
        if (newPass.length < 6) { showModalAlert('La contraseña debe tener al menos 6 caracteres.'); btn.disabled = false; btn.textContent = 'Guardar Cambios'; return; }
        data.contrasena = newPass;
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
// IMPORT EXCEL
// ══════════════════════════════════════════════
const IMPORT_FIELDS = [
  'Cliente', 'Industria', 'Práctica/Área', 'Nombre de la Oportunidad',
  'Descripción', 'Origen', 'Responsable', 'Estado',
  'Fecha de Inicio', 'Fecha de Entrega', 'Notas',
  'TCV', 'Currency', 'TCV EUR', 'Tipo de Cambio',
  '% Probabilidad', '% PM'
];

const IMPORT_MAP = {
  'Cliente': 'cliente', 'Industria': 'industria', 'Práctica/Área': 'practica',
  'Nombre de la Oportunidad': 'nombre', 'Descripción': 'descripcion',
  'Origen': 'origen', 'Responsable': 'responsable', 'Estado': 'estado',
  'Fecha de Inicio': 'fechaInicio', 'Fecha de Entrega': 'fechaEntrega',
  'Notas': 'notas', 'TCV': 'tcv', 'Currency': 'currency',
  'TCV EUR': 'tcvEur', 'Tipo de Cambio': 'tipoCambio',
  '% Probabilidad': 'probabilidad', '% PM': 'pm'
};

let _importData = [];

function openImportModal() {
  resetImportModal();
  document.getElementById('importModalOverlay').classList.add('open');
  // Setup drag & drop
  const drop = document.getElementById('importDrop');
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('dragover'); };
  drop.ondragleave = () => drop.classList.remove('dragover');
  drop.ondrop = (e) => {
    e.preventDefault();
    drop.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) processImportFile(file);
  };
}

function closeImportModal(event) {
  if (event && event.target !== document.getElementById('importModalOverlay')) return;
  document.getElementById('importModalOverlay').classList.remove('open');
}

function resetImportModal() {
  _importData = [];
  document.getElementById('importStep1').style.display = 'block';
  document.getElementById('importStep2').style.display = 'none';
  document.getElementById('importProgress').style.display = 'none';
  document.getElementById('importResult').style.display = 'none';
  document.getElementById('importFile').value = '';
  document.getElementById('importBtn').disabled = false;
  document.getElementById('importBtnText').textContent = 'Importar Oportunidades →';
  document.getElementById('importBtnSpinner').style.display = 'none';
}

function downloadTemplate() {
  if (typeof XLSX === 'undefined') { TOAST.error('Librería XLSX no disponible.'); return; }
  const cols = IMPORT_FIELDS;
  const ws = XLSX.utils.aoa_to_sheet([cols]);
  // Set column widths
  ws['!cols'] = [25, 18, 14, 30, 20, 14, 18, 14, 14, 14, 20, 12, 10, 12, 14, 14, 10].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Oportunidades');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([wbout], { type: 'application/octet-stream' }));
  a.download = 'plantilla_oportunidades.xlsx';
  a.click();
  TOAST.success('Plantilla descargada.');
}

function handleImportFile(input) {
  const file = input.files[0];
  if (file) processImportFile(file);
}

function processImportFile(file) {
  const validExts = ['.xlsx', '.xls', '.csv'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!validExts.includes(ext)) {
    TOAST.error('Formato no válido. Usá .xlsx o .csv');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (rows.length === 0) {
        TOAST.warning('El archivo está vacío.');
        return;
      }

      // Check that at least some expected columns exist
      const headers = Object.keys(rows[0]);
      const matched = headers.filter(h => IMPORT_MAP[h]);
      if (matched.length < 3) {
        TOAST.error('No se encontraron columnas reconocibles. Descargá la plantilla para ver el formato esperado.');
        return;
      }

      _importData = rows;
      renderImportPreview(file.name, headers, rows);
    } catch(err) {
      console.error('Error leyendo Excel:', err);
      TOAST.error('Error al leer el archivo.');
    }
  };
  reader.readAsArrayBuffer(file);
}

function renderImportPreview(fileName, headers, rows) {
  document.getElementById('importStep1').style.display = 'none';
  document.getElementById('importStep2').style.display = 'block';
  document.getElementById('importFileName').textContent = `📄 ${fileName} — ${rows.length} filas`;
  document.getElementById('importRowCount').textContent = rows.length;

  // Show header mapping info
  const headRow = document.getElementById('importPreviewHead');
  const matchedCols = headers.filter(h => IMPORT_MAP[h]);
  headRow.innerHTML = '<tr>' + matchedCols.map(h =>
    `<th>${escapeHtml(h)}</th>`
  ).join('') + '</tr>';

  // Show first 10 rows
  const previewRows = rows.slice(0, 10);
  const body = document.getElementById('importPreviewBody');
  body.innerHTML = previewRows.map((row, i) =>
    '<tr>' + matchedCols.map(h => {
      const val = row[h] !== undefined ? row[h] : '';
      const isMissing = !val && h === 'Nombre de la Oportunidad';
      return `<td style="${isMissing ? 'color:#f87171;font-weight:600' : ''}">${escapeHtml(val) || '—'}</td>`;
    }).join('') + '</tr>'
  ).join('');

  if (rows.length > 10) {
    body.innerHTML += `<tr><td colspan="${matchedCols.length}" style="text-align:center;color:var(--text-muted);font-style:italic;padding:10px">... y ${rows.length - 10} filas más</td></tr>`;
  }
}

async function executeImport() {
  if (_importData.length === 0) return;

  const btn = document.getElementById('importBtn');
  const progress = document.getElementById('importProgress');
  const result = document.getElementById('importResult');

  btn.disabled = true;
  btn.querySelector('#importBtnText').style.display = 'none';
  btn.querySelector('#importBtnSpinner').style.display = 'inline-block';
  progress.style.display = 'block';
  result.style.display = 'none';

  const total = _importData.length;
  let ok = 0, fail = 0, errors = [];
  const session = AUTH.getSession();

  for (let i = 0; i < total; i++) {
    const row = _importData[i];
    // Map row to data using column mapping
    const data = {};
    Object.keys(IMPORT_MAP).forEach(col => {
      const field = IMPORT_MAP[col];
      let val = row[col];
      if (val !== undefined && val !== '') data[field] = val;
    });

    // Skip rows without a name
    if (!data.nombre) {
      fail++;
      errors.push(`Fila ${i + 2}: falta "Nombre de la Oportunidad"`);
      updateImportProgress(i + 1, total);
      continue;
    }

    // Set responsible to current user if not specified
    if (!data.responsable && session) data.responsable = session.nombre;

    // Default state
    if (!data.estado) data.estado = 'En Desarrollo';

    // Validate estado
    if (!CRM.ESTADOS.includes(data.estado)) {
      fail++;
      errors.push(`Fila ${i + 2}: estado "${data.estado}" no válido`);
      updateImportProgress(i + 1, total);
      continue;
    }

    // Parsear campos numéricos con soporte de formato argentino
    const tcvVal = parseLocalizedNumber(data.tcv);
    if (!isNaN(tcvVal)) data.tcv = tcvVal;
    else data.tcv = 0;

    const probVal = parseLocalizedNumber(data.probabilidad);
    if (!isNaN(probVal)) data.probabilidad = probVal;
    else data.probabilidad = 0;

    const pmVal = parseLocalizedNumber(data.pm);
    if (!isNaN(pmVal)) data.pm = pmVal;
    else data.pm = 0;

    // Calcular TCV EUR si no viene en el Excel pero hay TCV y currency
    if ((!data.tcvEur || parseFloat(data.tcvEur) === 0) && data.tcv > 0 && data.currency) {
      const rate = await getFXRate(data.currency);
      if (rate) {
        data.tcvEur = parseFloat((data.tcv * rate).toFixed(2));
        data.tipoCambio = parseFloat(rate.toFixed(6));
      }
    }

    try {
      await CRM.addOportunidad(data);
      CRM.logEvento('creacion', 'Importó oportunidad masivamente', '', '', data.nombre);
      ok++;
    } catch(err) {
      fail++;
      errors.push(`Fila ${i + 2}: ${err.message}`);
    }

    updateImportProgress(i + 1, total);
  }

  // Done
  btn.disabled = false;
  btn.querySelector('#importBtnText').style.display = 'inline';
  btn.querySelector('#importBtnSpinner').style.display = 'none';
  document.getElementById('importProgressText').textContent = 'Importación finalizada';

  // Show result
  result.style.display = 'block';
  if (fail === 0) {
    result.style.background = 'color-mix(in srgb, #22c55e 10%, transparent)';
    result.style.color = '#16a34a';
    result.innerHTML = `<strong>${ok}</strong> oportunidades importadas correctamente.`;
    TOAST.success(`${ok} oportunidades importadas.`);
  } else {
    result.style.background = 'color-mix(in srgb, #f59e0b 10%, transparent)';
    result.style.color = '#d97706';
    result.innerHTML = `<strong>${ok}</strong> importadas, <strong>${fail}</strong> con errores.<br><details style="margin-top:8px;font-size:11px;cursor:pointer"><summary>Ver errores</summary><div style="margin-top:6px;max-height:120px;overflow:auto">${errors.map(e => `<div>${e}</div>`).join('')}</div></details>`;
    TOAST.warning(`${ok} importadas, ${fail} con errores.`);
  }

  CRM.invalidateCache();
}

function updateImportProgress(current, total) {
  const pct = Math.round(current / total * 100);
  document.getElementById('importProgressBar').style.width = pct + '%';
  document.getElementById('importProgressCount').textContent = `${current}/${total}`;
  document.getElementById('importProgressText').textContent = `Procesando fila ${current}...`;
}

// ══════════════════════════════════════════════
// KANBAN BOARD
// ══════════════════════════════════════════════
let _kanbanRows = [];
let _kanbanDragId = null;

async function initKanban() {
  const loading = document.getElementById('kanbanLoading');
  const board = document.getElementById('kanbanBoard');
  loading.style.display = 'flex';
  board.style.display = 'none';

  const session = AUTH.getSession();
  const raw = await CRM.getData();
  _kanbanRows = raw; // Todos los roles ven todas las cards

  // Populate responsables filter (admin only)
  const selR = document.getElementById('k_responsable');
  const filters = document.getElementById('kanbanFilters');
  if (session.perfil === 'admin') {
    filters.style.display = 'flex';
    const resps = [...new Set(_kanbanRows.map(r => r.responsable).filter(Boolean))].sort();
    selR.innerHTML = '<option value="">Todos los responsables</option>';
    resps.forEach(r => selR.innerHTML += `<option>${escapeHtml(r)}</option>`);
  } else {
    filters.style.display = 'flex';
    selR.style.display = 'none';
  }

  loading.style.display = 'none';
  board.style.display = 'flex';
  renderKanban();
}

function renderKanban() {
  const q = document.getElementById('k_search').value.trim().toLowerCase();
  const resp = document.getElementById('k_responsable').value;
  const session = AUTH.getSession();

  let rows = _kanbanRows;
  if (resp) rows = rows.filter(r => r.responsable === resp);
  if (q) rows = rows.filter(r => {
    const h = [r.codigo, r.nombre, r.cliente, r.responsable].join(' ').toLowerCase();
    return h.includes(q);
  });

  const board = document.getElementById('kanbanBoard');
  board.innerHTML = CRM.ESTADOS.map(estado => {
    const color = CRM.ESTADO_COLORS[estado];
    const cards = rows.filter(r => r.estado === estado);
    return `
      <div class="kanban-col" data-estado="${escapeHtml(estado)}">
        <div class="kanban-col-header">
          <div class="kanban-col-title">
            <div class="kanban-col-dot" style="background:${color}"></div>
            ${escapeHtml(estado)}
            <span class="kanban-col-count">${cards.length}</span>
          </div>
        </div>
        <div class="kanban-col-body" data-estado="${escapeHtml(estado)}">
          ${cards.length === 0 ? '<div class="kanban-col-empty">Sin oportunidades</div>' :
            cards.map(r => renderKanbanCard(r)).join('')}
        </div>
      </div>`;
  }).join('');

  // Setup drag & drop on column bodies
  board.querySelectorAll('.kanban-col-body').forEach(colBody => {
    colBody.addEventListener('dragover', (e) => {
      e.preventDefault();
      colBody.classList.add('dragover');
      colBody.closest('.kanban-col').classList.add('dragover');
    });
    colBody.addEventListener('dragleave', (e) => {
      if (!colBody.contains(e.relatedTarget)) {
        colBody.classList.remove('dragover');
        colBody.closest('.kanban-col').classList.remove('dragover');
      }
    });
    colBody.addEventListener('drop', async (e) => {
      e.preventDefault();
      colBody.classList.remove('dragover');
      colBody.closest('.kanban-col').classList.remove('dragover');
      const newEstado = colBody.dataset.estado;
      if (!_kanbanDragId || !_kanbanDragEstado) return;
      if (_kanbanDragEstado === newEstado) return;
      await handleKanbanDrop(_kanbanDragId, newEstado);
      _kanbanDragId = null;
      _kanbanDragEstado = null;
    });
  });
}

function renderKanbanCard(r) {
  const color = CRM.ESTADO_COLORS[r.estado] || 'var(--border)';
  const tcvDisplay = r.tcv ? Number(r.tcv).toLocaleString('es-AR') + (r.currency ? ' ' + escapeHtml(r.currency) : '') : '—';
  return `
    <div class="kanban-card" draggable="true" data-id="${r.id}" data-estado="${escapeHtml(r.estado)}" style="border-left-color:${color}">
      <div class="kanban-card-id">${escapeHtml(friendlyId(r))}</div>
      <div class="kanban-card-client">${escapeHtml(r.cliente) || '—'}</div>
      <div class="kanban-card-name">${escapeHtml(r.nombre) || '—'}</div>
      <div class="kanban-card-meta">
        <span>${escapeHtml(r.responsable) || '—'}</span>
        <span class="kanban-card-tcv">${tcvDisplay}</span>
      </div>
    </div>`;
}

// Setup card drag events via event delegation
document.addEventListener('dragstart', (e) => {
  const card = e.target.closest('.kanban-card');
  if (!card) return;
  _kanbanDragId = card.dataset.id;
  _kanbanDragEstado = card.dataset.estado;
  card.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', card.dataset.id);
});

document.addEventListener('dragend', (e) => {
  const card = e.target.closest('.kanban-card');
  if (card) card.classList.remove('dragging');
  document.querySelectorAll('.kanban-col-body.dragover, .kanban-col.dragover').forEach(el => {
    el.classList.remove('dragover');
  });
});

// Click on card to view details
document.addEventListener('click', (e) => {
  const card = e.target.closest('.kanban-card');
  if (!card || e.target.closest('.kanban-card.dragging')) return;
  const id = card.dataset.id;
  // Make sure _tablaRows is loaded for verOportunidad
  if (_kanbanRows.length > 0 && _kanbanDragId !== id) {
    verOportunidad(id);
  }
});

async function handleKanbanDrop(id, newEstado) {
  const r = _kanbanRows.find(x => x.id === id);
  if (!r) return;

  const oldEstado = r.estado;
  if (oldEstado === newEstado) return;

  // Check edit permissions
  const session = AUTH.getSession();
  if (session.perfil === 'solo lectura') {
    TOAST.error('No tenés permisos para mover oportunidades.');
    return;
  }
  if (session.perfil !== 'admin' && r.responsable !== session.nombre) {
    TOAST.error('No tenés permisos para mover esta oportunidad.');
    return;
  }

  // Optimistic update
  r.estado = newEstado;
  renderKanban();

  try {
    await CRM.updateOportunidad(id, { estado: newEstado });
    CRM.logEvento('cambio_estado', `Cambio estado: ${oldEstado} → ${newEstado}`, id, r.codigo, r.nombre);
    TOAST.success(`"${r.nombre}" → ${newEstado}`);
    // Refresh data in background
    const fresh = await CRM.getData();
    _kanbanRows = fresh; // Todos los roles ven todas las cards
    renderKanban();
  } catch(err) {
    // Rollback on error
    r.estado = oldEstado;
    renderKanban();
    TOAST.error('Error al actualizar el estado.');
  }
}

// ══════════════════════════════════════════════
// MIS OPORTUNIDADES
// ══════════════════════════════════════════════
let _misRows = [], _misSortKey = 'fechaCreacion', _misSortDir = -1, _misPage = 1;

async function initMis() {
  document.getElementById('misLoading').style.display = 'flex';
  document.getElementById('misTable').style.display = 'none';
  const session = AUTH.getSession();
  const raw = await CRM.getData();
  _misRows = raw.filter(r => r.responsable === session.nombre);
  document.getElementById('misLoading').style.display = 'none';
  document.getElementById('misTable').style.display = 'block';
  _misPage = 1;
  renderMis();
}

async function misRefresh() {
  CRM.invalidateCache();
  await initMis();
}

function sortMis(key) {
  if (_misSortKey === key) _misSortDir *= -1;
  else { _misSortKey = key; _misSortDir = 1; }
  _misPage = 1;
  renderMis();
}

function renderMis(page) {
  if (page !== undefined) _misPage = page;
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
  if (rows.length === 0) { body.innerHTML = ''; empty.style.display = 'block'; document.getElementById('misPagination').style.display = 'none'; return; }
  empty.style.display = 'none';

  const pg = paginate(rows, _misPage);
  body.innerHTML = pg.rows.map(r => `
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

  renderPagination('misPagination', pg, (p) => renderMis(p));
}

// ══════════════════════════════════════════════
// LOG DE EVENTOS
// ══════════════════════════════════════════════
function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `Hace ${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

const ACCION_STYLES = {
  creacion:      { icon: '➕', color: '#22c55e', label: 'Creación' },
  edicion:       { icon: '✏️', color: '#3b82f6', label: 'Edición' },
  eliminacion:   { icon: '🗑️', color: '#ef4444', label: 'Eliminación' },
  cambio_estado: { icon: '🔄', color: '#f59e0b', label: 'Cambio de estado' }
};

async function initLog() {
  const loading = document.getElementById('logLoading');
  const feed    = document.getElementById('logFeed');
  const empty   = document.getElementById('logEmpty');
  loading.style.display = 'flex';
  feed.style.display = 'none';
  empty.style.display = 'none';

  const events = await CRM.getLogEventos(150);
  loading.style.display = 'none';

  if (events.length === 0) { empty.style.display = 'block'; return; }

  // Agrupar por fecha
  const groups = {};
  events.forEach(ev => {
    const d = new Date(ev.fecha);
    const dayKey = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(ev);
  });

  let html = '';
  Object.entries(groups).forEach(([dayLabel, dayEvents]) => {
    html += `<div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--border)">${dayLabel}</div>`;
    dayEvents.forEach(ev => {
      const style = ACCION_STYLES[ev.accion] || ACCION_STYLES.edicion;
      const oppLink = ev.oppId ? `<span style="color:var(--accent);font-weight:600;cursor:pointer" onclick="verOportunidadLog('${ev.oppId}')">${ev.oppCodigo || ev.oppNombre || ev.oppId.substring(0,8)}</span>` : '';
      html += `
        <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid color-mix(in srgb, var(--border) 50%, transparent)">
          <div style="width:32px;height:32px;border-radius:8px;background:color-mix(in srgb, ${style.color} 12%, transparent);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">${style.icon}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:500;color:var(--text);line-height:1.4">
              <span style="font-weight:600">${ev.usuario || 'Usuario'}</span>
              ${ev.detalle}
              ${oppLink}
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;display:flex;align-items:center;gap:8px">
              <span style="background:color-mix(in srgb, ${style.color} 15%, transparent);color:${style.color};padding:1px 8px;border-radius:10px;font-weight:600;font-size:10px">${style.label}</span>
              <span>${timeAgo(ev.fecha)}</span>
            </div>
          </div>
        </div>`;
    });
  });

  feed.innerHTML = html;
  feed.style.display = 'block';
}

function verOportunidadLog(id) {
  openEditModal(id);
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
  if (session.perfil === 'admin') document.getElementById('btnLog').style.display = 'flex';

  // Ocultar secciones para "solo lectura"
  if (session.perfil === 'solo lectura') {
    document.getElementById('btnNueva').style.display = 'none';
    document.getElementById('btnModificar').style.display = 'none';
    document.getElementById('btnMis').style.display = 'none';
    document.querySelectorAll('.btn-nueva-oport').forEach(b => b.style.display = 'none');
  }

  // Sidebar toggle
  document.getElementById('toggleBtn').addEventListener('click', () =>
    document.getElementById('sidebar').classList.toggle('collapsed')
  );

  // Pre-fill responsable
  document.getElementById('n_responsable').value = session.nombre;
  if (session.perfil !== 'admin') document.getElementById('n_responsable').readOnly = true;

  // Connection check
  checkConexion();
  setInterval(checkConexion, 300000); // 5 minutos

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
