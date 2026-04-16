// assets/firebase-config.js — Configuracion de Firebase
//
// INSTRUCCIONES:
// 1. Crear un proyecto en https://console.firebase.google.com/
// 2. Agregar una app web al proyecto
// 3. Habilitar Authentication > Email/Password
// 4. Crear una base de datos Firestore (modo produccion o prueba)
// 5. En Configuracion del proyecto > General, copiar los valores de tu app web
// 6. Pegar los valores abajo

const firebaseConfig = {
  apiKey:            "TU_API_KEY_AQUI",
  authDomain:        "TU_PROYECTO.firebaseapp.com",
  projectId:         "TU_PROYECTO_ID",
  storageBucket:     "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId:             "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Habilitar persistencia offline de Firestore
firebase.firestore().enablePersistence({ synchronizeTabs: true })
  .catch(err => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistencia offline no disponible: multiples tabs abiertos.');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistencia offline no soportada en este navegador.');
    }
  });

// Exportar referencias globales
window.db   = firebase.firestore();
window.auth = firebase.auth();
