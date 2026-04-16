/**
 * migrate.js — Script de migración: Google Sheets → Firestore
 *
 * Cómo usar:
 * 1. Instala Node.js (v14+)
 * 2. npm install firebase-admin
 * 3. Descarga la clave privada de tu servicio desde:
 *    Firebase Console → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada
 * 4. Guarda el JSON como "serviceAccountKey.json" en esta carpeta
 * 5. Exporta los datos de Google Sheets como CSV (o usa la API del Worker actual)
 * 6. Ejecuta: node migrate.js
 *
 * El script lee los datos desde el Worker actual (API), los transforma
 * al formato Firestore y los escribe en la colección "oportunidades".
 * También migra los usuarios a la colección "usuarios".
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ─── CONFIGURACIÓN ───
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'serviceAccountKey.json');
const WORKER_API_URL = 'https://oportunidadesar.javier-sd-atos.workers.dev';

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('❌ No se encontró serviceAccountKey.json');
  console.error('   Descargá la clave desde Firebase Console > Cuentas de servicio');
  process.exit(1);
}

const serviceAccount = require(SERVICE_ACCOUNT_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// ─── MAPEO: Columnas del Sheet → Campos Firestore ───
const FIELD_MAP = {
  'ID':                      'legacyId',
  'Cliente':                 'cliente',
  'Industria':               'industria',
  'Práctica/Área':           'practica',
  'Nombre de la Oportunidad': 'nombre',
  'Descripción':             'descripcion',
  'Origen':                  'origen',
  'Responsable':             'responsable',
  'Estado':                  'estado',
  'Fecha de Inicio':         'fechaInicio',
  'Fecha de Entrega':        'fechaEntrega',
  'Notas':                   'notas',
  'TCV':                     'tcv',
  'Currency':                'currency',
  'TCV EUR':                 'tcvEur',
  'Tipo de Cambio':          'tipoCambio',
  '% Probabilidad':          'probabilidad',
  '% PM':                    'pm',
  'Fecha Creación':          'fechaCreacion',
  'Fecha de Modificación':   'fechaModificacion'
};

const NUMERIC_FIELDS = ['tcv', 'tcvEur', 'tipoCambio', 'probabilidad', 'pm'];

// ─── FETCH DATOS DEL WORKER ───
async function fetchFromWorker(target) {
  const url = `${WORKER_API_URL}?target=${target}&action=get`;
  console.log(`📡 Obteniendo datos de ${target}...`);
  const res = await fetch(url, { method: 'GET', redirect: 'follow' });
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (json.ok) return json.data;
    throw new Error(json.error || 'Error desconocido');
  } catch (e) {
    console.error(`❌ Error parseando respuesta de ${target}:`, e.message);
    console.error('   Respuesta cruda (primeros 500 chars):', text.substring(0, 500));
    throw e;
  }
}

// ─── TRANSFORMAR FILA ───
function transformRow(row) {
  const doc = {};
  for (const [sheetCol, firestoreField] of Object.entries(FIELD_MAP)) {
    let val = row[sheetCol];
    if (val === undefined || val === null) val = '';

    // Convertir numéricos
    if (NUMERIC_FIELDS.includes(firestoreField)) {
      val = parseFloat(val) || 0;
    }

    doc[firestoreField] = val;
  }

  // Agregar campos adicionales
  const now = new Date().toISOString();
  if (!doc.fechaCreacion) doc.fechaCreacion = now;
  if (!doc.fechaModificacion) doc.fechaModificacion = now;
  doc.createdBy = ''; // Se actualizará cuando se sepa el UID del responsable

  return doc;
}

// ─── MIGRAR OPORTUNIDADES ───
async function migrateOportunidades() {
  console.log('\n📊 ─── MIGRANDO OPORTUNIDADES ───');
  const rows = await fetchFromWorker('oportunidades');
  console.log(`   Encontradas ${rows.length} oportunidades`);

  let created = 0, errors = 0;
  const batch = db.batch();
  const maxBatchSize = 450; // Firestore limit is 500
  let batchCount = 0;

  for (const row of rows) {
    try {
      const doc = transformRow(row);
      const ref = db.collection('oportunidades').doc(); // Auto-generated ID
      // Guardar el ID legacy para referencia
      if (doc.legacyId) {
        doc.legacyId = String(doc.legacyId);
      }
      batch.set(ref, doc);
      created++;
      batchCount++;

      if (batchCount >= maxBatchSize) {
        console.log(`   Escribiendo batch de ${batchCount} documentos...`);
        await batch.commit();
        batchCount = 0;
      }
    } catch (e) {
      console.error(`   ❌ Error transformando fila:`, e.message);
      errors++;
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    console.log(`   Escribiendo batch final de ${batchCount} documentos...`);
    await batch.commit();
  }

  console.log(`   ✅ ${created} oportunidades migradas, ${errors} errores`);
  return { created, errors };
}

// ─── MIGRAR USUARIOS ───
async function migrateUsuarios() {
  console.log('\n👥 ─── MIGRANDO USUARIOS ───');
  const rows = await fetchFromWorker('usuarios');
  console.log(`   Encontrados ${rows.length} usuarios`);

  let created = 0, errors = 0;

  for (const row of rows) {
    try {
      const email = (row['Email'] || '').trim().toLowerCase();
      const nombre = row['Nombre'] || '';
      const usuario = row['Usuario'] || '';
      const perfil = (row['Perfil'] || 'usuario').toLowerCase();
      const activo = row['Activo'] === 'SI';

      if (!email) {
        console.log(`   ⚠️  Usuario "${usuario}" sin email, saltando creación en Auth`);
        continue;
      }

      // Intentar crear el usuario en Firebase Auth
      let uid;
      try {
        const userRecord = await admin.auth().createUser({
          email: email,
          password: 'Cambiar123!', // Password temporal, el usuario debe cambiarlo
          displayName: nombre,
          disabled: !activo
        });
        uid = userRecord.uid;
        console.log(`   ✅ Auth creado: ${email} (${uid})`);
      } catch (e) {
        if (e.code === 'auth/email-already-exists') {
          // El usuario ya existe en Auth, obtener su UID
          const userRecord = await admin.auth().getUserByEmail(email);
          uid = userRecord.uid;
          console.log(`   ℹ️  Auth ya existe: ${email} (${uid})`);
        } else {
          console.error(`   ❌ Error creando Auth para ${email}:`, e.message);
          errors++;
          continue;
        }
      }

      // Crear/actualizar perfil en Firestore
      await db.collection('usuarios').doc(uid).set({
        usuario: usuario,
        nombre: nombre,
        email: email,
        perfil: perfil,
        activo: activo
      }, { merge: true });

      created++;
    } catch (e) {
      console.error(`   ❌ Error migrando usuario:`, e.message);
      errors++;
    }
  }

  console.log(`   ✅ ${created} usuarios migrados, ${errors} errores`);
  return { created, errors };
}

// ─── MAIN ───
async function main() {
  console.log('🚀 INICIO DE MIGRACIÓN A FIREBASE');
  console.log('==================================\n');

  const start = Date.now();

  try {
    // 1. Migrar usuarios primero (necesitamos los UIDs)
    const usersResult = await migrateUsuarios();

    // 2. Migrar oportunidades
    const opoResult = await migrateOportunidades();

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n🏁 MIGRACIÓN COMPLETADA en ${elapsed}s`);
    console.log(`   Oportunidades: ${opoResult.created} creadas, ${opoResult.errors} errores`);
    console.log(`   Usuarios: ${usersResult.created} creados, ${usersResult.errors} errores`);

    if (usersResult.created > 0) {
      console.log('\n⚠️  NOTA: Los usuarios fueron creados con password temporal "Cambiar123!"');
      console.log('   Cada usuario debería cambiar su contraseña al primer ingreso.');
    }
  } catch (e) {
    console.error('\n💥 ERROR FATAL:', e.message);
    process.exit(1);
  }
}

main();
