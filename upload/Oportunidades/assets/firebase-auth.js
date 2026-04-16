// assets/firebase-auth.js — Autenticacion con Firebase Auth

const SESSION_KEY = 'presales_ar_session';

// ── LOGIN ──
async function login(email, password) {
  try {
    const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
    // Cargar perfil desde Firestore
    const doc = await firebase.firestore().collection('usuarios').doc(cred.user.uid).get();
    if (!doc.exists) {
      await firebase.auth().signOut();
      throw new Error('Perfil de usuario no encontrado en la base de datos.');
    }
    const profile = doc.data();
    if (!profile.activo) {
      await firebase.auth().signOut();
      throw new Error('Tu cuenta esta desactivada. Contacta al administrador.');
    }
    const session = {
      uid:     cred.user.uid,
      usuario: profile.usuario || '',
      nombre:  profile.nombre  || '',
      email:   profile.email   || cred.user.email,
      perfil:  profile.perfil  || 'usuario'
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, session };
  } catch(e) {
    const msg = {
      'auth/user-not-found':       'No existe un usuario con ese email.',
      'auth/wrong-password':       'Contrasena incorrecta.',
      'auth/invalid-email':        'Email invalido.',
      'auth/too-many-requests':    'Demasiados intentos. Intenta mas tarde.',
      'auth/invalid-credential':   'Email o contrasena incorrectos.',
      'auth/user-disabled':        'Tu cuenta esta deshabilitada.'
    }[e.code] || e.message || 'Error de conexion. Intenta de nuevo.';
    return { ok: false, error: msg };
  }
}

// ── SESSION ──
function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function refreshSession(profile) {
  const session = getSession();
  if (!session) return;
  const updated = { ...session, nombre: profile.nombre, email: profile.email, perfil: profile.perfil, activo: profile.activo };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
}

// ── LOGOUT ──
function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  firebase.auth().signOut().then(() => {
    window.location.href = 'login.html';
  }).catch(() => {
    window.location.href = 'login.html';
  });
}

// ── REQUIRE AUTH ──
function requireAuth() {
  const session = getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

// ── CHANGE PASSWORD ──
async function changePassword(oldPassword, newPassword) {
  try {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('No hay sesion activa.');
    // Re-autenticar
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, oldPassword);
    await user.reauthenticateWithCredential(credential);
    // Actualizar contrasena
    await user.updatePassword(newPassword);
    return { ok: true };
  } catch(e) {
    const msg = {
      'auth/wrong-password':        'Contrasena actual incorrecta.',
      'auth/weak-password':         'La nueva contrasena debe tener al menos 6 caracteres.',
      'auth/requires-recent-login': 'Necesitas iniciar sesion de nuevo para cambiar la contrasena.',
      'auth/invalid-credential':    'Contrasena actual incorrecta.'
    }[e.code] || e.message || 'Error al cambiar la contrasena.';
    return { ok: false, error: msg };
  }
}

// ── GET ALL USERS ──
async function getAllUsers() {
  try {
    const snap = await firebase.firestore().collection('usuarios').orderBy('nombre').get();
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  } catch(e) {
    console.error('Error obteniendo usuarios:', e);
    return [];
  }
}

// ── UPDATE USER ──
async function updateUser(uid, data) {
  try {
    await firebase.firestore().collection('usuarios').doc(uid).update(data);
    // Si el usuario editado es el actual, actualizar sesion
    const session = getSession();
    if (session && session.uid === uid) {
      const updatedDoc = await firebase.firestore().collection('usuarios').doc(uid).get();
      if (updatedDoc.exists) refreshSession(updatedDoc.data());
    }
    return true;
  } catch(e) {
    console.error('Error actualizando usuario:', e);
    return false;
  }
}

// ── ADD USER ──
// Usa una instancia secundaria de Firebase para no cerrar la sesion del admin
async function addUser(data) {
  try {
    const secondaryApp = firebase.initializeApp(firebase.app().options, 'Secondary_' + Date.now());
    const cred = await secondaryApp.auth().createUserWithEmailAndPassword(data.email, data.contrasena);
    // Guardar perfil en Firestore
    await firebase.firestore().collection('usuarios').doc(cred.user.uid).set({
      usuario: data.usuario,
      nombre:  data.nombre,
      email:   data.email,
      perfil:  data.perfil  || 'usuario',
      activo:  data.activo !== undefined ? data.activo : true
    });
    // Cerrar sesion del secondary app y eliminarlo
    await secondaryApp.auth().signOut();
    await secondaryApp.delete();
    return { ok: true, uid: cred.user.uid };
  } catch(e) {
    // Intentar limpiar la app secundaria
    try {
      const apps = firebase.apps.filter(a => a.name.startsWith('Secondary_'));
      for (const app of apps) { await app.delete(); }
    } catch(cleanupErr) {}
    const msg = {
      'auth/email-already-in-use': 'Ya existe un usuario con ese email.',
      'auth/weak-password':        'La contrasena debe tener al menos 6 caracteres.',
      'auth/invalid-email':        'Email invalido.'
    }[e.code] || e.message || 'Error al crear usuario.';
    return { ok: false, error: msg };
  }
}

// ── SEND PASSWORD RESET ──
async function sendPasswordReset(email) {
  try {
    await firebase.auth().sendPasswordResetEmail(email);
    return { ok: true };
  } catch(e) {
    const msg = {
      'auth/user-not-found': 'No existe un usuario con ese email.',
      'auth/invalid-email':  'Email invalido.'
    }[e.code] || e.message || 'Error al enviar email de reseteo.';
    return { ok: false, error: msg };
  }
}

// ── LISTEN FOR AUTH STATE ──
function onAuthChange(callback) {
  firebase.auth().onAuthStateChanged(user => {
    callback(user);
  });
}

window.AUTH = { login, getSession, refreshSession, logout, requireAuth, changePassword, getAllUsers, updateUser, addUser, sendPasswordReset, onAuthChange };
