// assets/firebase-db.js — CRUD con Firestore

const OPORTUNIDADES_COL = 'oportunidades';

const COLUMNS = [
  'codigo', 'cliente', 'industria', 'practica',
  'nombre', 'descripcion', 'origen',
  'responsable', 'responsableUid', 'estado', 'fechaInicio', 'fechaEntrega',
  'notas', 'tcv', 'currency', 'tcvEur', 'tipoCambio',
  'probabilidad', 'pm', 'fechaCreacion', 'fechaModificacion'
];

const ESTADOS  = ['En Desarrollo', 'Entregada', 'Finalizada', 'Pausa', 'Perdida', 'Ganada'];
const ORIGENES = ['Fertilización', 'Otro', 'Proyecto', 'Renovación', 'RFP'];
const ESTADO_COLORS = {
  'En Desarrollo': '#fde68a',
  'Entregada':     '#93c5fd',
  'Finalizada':    '#86efac',
  'Pausa':         '#fdba74',
  'Perdida':       '#fca5a5',
  'Ganada':        '#a7f3d0'
};

// ── CACHE ──
let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 300000; // 5 minutos

function invalidateCache() {
  _cache = null;
  _cacheTs = 0;
}

// ── MAPEO: Firestore doc → objeto plano ──
function docToObj(doc) {
  const d = doc.data();
  return {
    id:              doc.id,
    codigo:          d.codigo || '',
    cliente:         d.cliente         || '',
    industria:       d.industria       || '',
    practica:        d.practica        || '',
    nombre:          d.nombre          || '',
    descripcion:     d.descripcion     || '',
    origen:          d.origen          || '',
    responsable:     d.responsable     || '',
    responsableUid:  d.responsableUid  || '',
    estado:          d.estado          || '',
    fechaInicio:     d.fechaInicio     || '',
    fechaEntrega:    d.fechaEntrega    || '',
    notas:           d.notas           || '',
    tcv:             d.tcv             || 0,
    currency:        d.currency        || '',
    tcvEur:          d.tcvEur          || 0,
    tipoCambio:      d.tipoCambio      || 0,
    probabilidad:    d.probabilidad    || 0,
    pm:              d.pm              || 0,
    fechaCreacion:   d.fechaCreacion   || '',
    fechaModificacion: d.fechaModificacion || ''
  };
}

// ── GET DATA ──
async function getData(forceRefresh = false) {
  if (!forceRefresh && _cache && (Date.now() - _cacheTs) < CACHE_TTL) {
    return _cache;
  }
  try {
    const snap = await firebase.firestore().collection(OPORTUNIDADES_COL)
      .orderBy('fechaCreacion', 'desc')
      .get();
    _cache = snap.docs.map(docToObj);
    _cacheTs = Date.now();
    return _cache;
  } catch(e) {
    console.error('Error obteniendo datos:', e);
    return _cache || [];
  }
}

// ── COUNTER (código secuencial OPP-XXXX) ──
async function getNextCodigo() {
  const counterRef = firebase.firestore().collection('counters').doc('oportunidades');
  try {
    const result = await firebase.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(counterRef);
      if (!snap.exists) {
        tx.set(counterRef, { nextId: 2 });
        return 1;
      }
      const nextId = snap.data().nextId || 1;
      tx.update(counterRef, { nextId: nextId + 1 });
      return nextId;
    });
    return 'OPP-' + String(result).padStart(4, '0');
  } catch(e) {
    console.error('Error obteniendo código secuencial:', e);
    throw new Error('No se pudo generar el código de oportunidad. Verificá que el documento counters/oportunidades exista en Firestore.');
  }
}

// ── ADD ──
async function addOportunidad(data) {
  try {
    const session = AUTH.getSession();
    const now = new Date().toISOString();
    const codigo = await getNextCodigo();

    const docData = {
      codigo:            codigo,
      cliente:           data.cliente         || '',
      industria:         data.industria       || '',
      practica:          data.practica        || '',
      nombre:            data.nombre          || '',
      descripcion:       data.descripcion     || '',
      origen:            data.origen          || '',
      responsable:       data.responsable     || '',
      responsableUid:    session ? session.uid : '',
      estado:            data.estado          || 'En Desarrollo',
      fechaInicio:       data.fechaInicio     || '',
      fechaEntrega:      data.fechaEntrega    || '',
      notas:             data.notas           || '',
      tcv:               parseFloat(data.tcv) || 0,
      currency:          data.currency        || '',
      tcvEur:            parseFloat(data.tcvEur) || 0,
      tipoCambio:        parseFloat(data.tipoCambio) || 0,
      probabilidad:      parseFloat(data.probabilidad) || 0,
      pm:                parseFloat(data.pm)  || 0,
      fechaCreacion:     now,
      fechaModificacion: now,
      createdBy:         session ? session.uid : ''
    };

    const ref = await firebase.firestore().collection(OPORTUNIDADES_COL).add(docData);
    invalidateCache();
    return ref.id;
  } catch(e) {
    console.error('Error agregando oportunidad:', e);
    throw e;
  }
}

// ── UPDATE ──
async function updateOportunidad(id, data) {
  try {
    const now = new Date().toISOString();
    const updateData = {
      ...data,
      fechaModificacion: now
    };
    // Limpiar campos undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) updateData[key] = '';
    });
    // Convertir numericos
    if ('tcv' in updateData)          updateData.tcv          = parseFloat(updateData.tcv) || 0;
    if ('tcvEur' in updateData)       updateData.tcvEur       = parseFloat(updateData.tcvEur) || 0;
    if ('tipoCambio' in updateData)   updateData.tipoCambio   = parseFloat(updateData.tipoCambio) || 0;
    if ('probabilidad' in updateData) updateData.probabilidad = parseFloat(updateData.probabilidad) || 0;
    if ('pm' in updateData)           updateData.pm           = parseFloat(updateData.pm) || 0;

    await firebase.firestore().collection(OPORTUNIDADES_COL).doc(id).update(updateData);
    invalidateCache();
    return true;
  } catch(e) {
    console.error('Error actualizando oportunidad:', e);
    throw e;
  }
}

// ── DELETE ──
async function deleteOportunidad(id) {
  try {
    await firebase.firestore().collection(OPORTUNIDADES_COL).doc(id).delete();
    invalidateCache();
    return true;
  } catch(e) {
    console.error('Error eliminando oportunidad:', e);
    throw e;
  }
}

// ── GET BY ID ──
async function getOportunidad(id) {
  try {
    const doc = await firebase.firestore().collection(OPORTUNIDADES_COL).doc(id).get();
    if (!doc.exists) return null;
    return docToObj(doc);
  } catch(e) {
    console.error('Error obteniendo oportunidad:', e);
    return null;
  }
}

// ── REAL-TIME LISTENER ──
function onOportunidadesChange(callback) {
  return firebase.firestore().collection(OPORTUNIDADES_COL)
    .orderBy('fechaCreacion', 'desc')
    .onSnapshot(snap => {
      _cache = snap.docs.map(docToObj);
      _cacheTs = Date.now();
      callback(_cache);
    }, err => {
      console.error('Error en listener de oportunidades:', err);
    });
}

// ── DOWNLOAD EXCEL ──
function downloadExcel(rows) {
  if (typeof XLSX === 'undefined') return;
  try {
    // Mapear a formato original con nombres legibles para el Excel
    const mapped = rows.map(r => ({
      'Código':                  r.codigo || r.id.substring(0,8),
      'Cliente':                 r.cliente,
      'Industria':               r.industria,
      'Práctica/Área':           r.practica,
      'Nombre de la Oportunidad': r.nombre,
      'Descripción':             r.descripcion,
      'Origen':                  r.origen,
      'Responsable':             r.responsable,
      'Estado':                  r.estado,
      'Fecha de Inicio':         r.fechaInicio,
      'Fecha de Entrega':        r.fechaEntrega,
      'Notas':                   r.notas,
      'TCV':                     r.tcv,
      'Currency':                r.currency,
      'TCV EUR':                 r.tcvEur,
      'Tipo de Cambio':          r.tipoCambio,
      '% Probabilidad':          r.probabilidad,
      '% PM':                    r.pm,
      'Fecha Creación':          r.fechaCreacion,
      'Fecha Modificación':      r.fechaModificacion
    }));

    const cols = ['Código','Cliente','Industria','Práctica/Área','Nombre de la Oportunidad','Descripción','Origen','Responsable','Estado','Fecha de Inicio','Fecha de Entrega','Notas','TCV','Currency','TCV EUR','Tipo de Cambio','% Probabilidad','% PM','Fecha Creación','Fecha Modificación'];
    const ws = XLSX.utils.json_to_sheet(mapped.length ? mapped : [Object.fromEntries(cols.map(c => [c, '']))]);
    ws['!cols'] = [12,25,18,14,30,20,14,18,14,14,14,20,12,10,12,14,14,10,14,14].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Oportunidades');

    const estadoCounts = {};
    ESTADOS.forEach(e => estadoCounts[e] = 0);
    rows.forEach(r => { if (estadoCounts[r.estado] !== undefined) estadoCounts[r.estado]++; });

    const ws2 = XLSX.utils.aoa_to_sheet([
      ['RESUMEN PIPELINE', ''],
      ['Generado', new Date().toLocaleString('es-AR')],
      ['', ''],
      ['Total Oportunidades', rows.length],
      ['TCV EUR Total', rows.reduce((s, r) => s + (parseFloat(r.tcvEur) || 0), 0)],
      ['', ''],
      ['ESTADO', 'CANTIDAD'],
      ...ESTADOS.map(e => [e, estadoCounts[e] || 0])
    ]);
    ws2['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Resumen');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([wbout], { type: 'application/octet-stream' }));
    a.download = 'oportunidades.xlsx';
    a.click();
  } catch(e) {
    console.error('Error exportando Excel:', e);
  }
}

window.CRM = {
  getData, addOportunidad, updateOportunidad, deleteOportunidad,
  getOportunidad, downloadExcel, onOportunidadesChange, getNextCodigo,
  COLUMNS, ESTADOS, ORIGENES, ESTADO_COLORS, invalidateCache
};
