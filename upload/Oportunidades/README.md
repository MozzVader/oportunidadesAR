# PRESALES AR v2.0 — Registro de Oportunidades (Firebase)

Migración de la SPA original (Cloudflare Worker + Google Sheets) a **Firebase** (Firestore + Auth).

## 📁 Estructura del Proyecto

```
├── index.html              ← SPA principal (con Firebase SDK)
├── login.html              ← Login con Firebase Auth (email)
├── favicon.svg             ← Ícono de la app
├── assets/
│   ├── firebase-config.js  ← Configuración e inicialización de Firebase
│   ├── firebase-auth.js    ← Autenticación con Firebase Auth
│   ├── firebase-db.js      ← CRUD con Firestore SDK
│   ├── app.js              ← Lógica principal de la aplicación
│   ├── style.css           ← Estilos compartidos
│   └── theme.js            ← Tema claro/oscuro
├── firestore.rules         ← Reglas de seguridad de Firestore
├── migrate.js              ← Script de migración Sheets → Firestore
└── README.md               ← Este archivo
```

## 🔧 Setup de Firebase

### 1. Crear proyecto en Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Crear un nuevo proyecto (ej: `presales-ar`)
3. Agregar una **app web** al proyecto (ícono `</>`)

### 2. Habilitar Authentication

1. Ir a **Authentication** → **Sign-in method**
2. Habilitar **Email/Password**
3. En **Settings** → configurar dominios autorizados (ej: `tu-usuario.github.io`)

### 3. Crear base de datos Firestore

1. Ir a **Firestore Database** → **Create database**
2. Elegir **Production mode** (las reglas están en `firestore.rules`)
3. Seleccionar la ubicación más cercana (ej: `southamerica-east1`)

### 4. Configurar la app

Editar `assets/firebase-config.js` y pegar los valores de tu proyecto:

```javascript
const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROYECTO.firebaseapp.com",
  projectId:         "TU_PROYECTO_ID",
  storageBucket:     "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId:             "TU_APP_ID"
};
```

Los valores los encontrás en: **Configuración del proyecto** → **General** → **Tus apps** → **Config**

### 5. Desplegar reglas de seguridad

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # Seleccionar tu proyecto y el archivo firestore.rules
firebase deploy --only firestore:rules
```

### 6. Crear el primer usuario admin

Opción A: Desde Firebase Console → Authentication → Users → Add user

Opción B: Mediante el script de migración (ver abajo)

Luego, crear el documento en Firestore:

1. Ir a **Firestore Database**
2. Colección `usuarios` → Agregar documento
3. ID del documento = **UID** del usuario (de Authentication)
4. Campos:
   - `usuario` (string): nombre de usuario
   - `nombre` (string): nombre completo
   - `email` (string): email del usuario
   - `perfil` (string): "admin"
   - `activo` (boolean): true

## 🚚 Migración de Datos

### Requisitos

- Node.js v14+
- Clave de cuenta de servicio (service account key)

### Pasos

1. Descargar clave privada:
   - Firebase Console → **Configuración** → **Cuentas de servicio**
   - **Generar nueva clave privada**
   - Guardar como `serviceAccountKey.json` en la raíz del proyecto

2. Instalar dependencias:
   ```bash
   npm install firebase-admin
   ```

3. Ejecutar migración:
   ```bash
   node migrate.js
   ```

El script:
- Lee los datos del Worker actual (oportunidades y usuarios)
- Crea los usuarios en Firebase Auth con password temporal `Cambiar123!`
- Guarda los perfiles en la colección `usuarios` de Firestore
- Migra todas las oportunidades a la colección `oportunidades`

### Notas importantes

- Los usuarios se crean con password temporal `Cambiar123!`
- Cada usuario deberá cambiar su contraseña en el primer ingreso
- La migración es idempotente: si un usuario ya existe en Auth, se usa su UID existente
- Los IDs originales de Google Sheets se guardan en el campo `legacyId`

## 🌐 Deploy en GitHub Pages

1. Subir todos los archivos a un repositorio de GitHub
2. Ir a **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: `main` / `/ (root)`
5. Guardar

La app estará disponible en: `https://tu-usuario.github.io/nombre-repo/`

### Dominios autorizados

En Firebase Console → Authentication → Settings → Authorized domains:
- Agregar: `tu-usuario.github.io`

## 🔄 Cambios respecto a v1.0

| Aspecto | v1.0 | v2.0 |
|---------|------|------|
| Base de datos | Google Sheets (via Worker) | Firestore |
| Autenticación | SHA-256 + Sheets | Firebase Auth |
| Login | Usuario + password | Email + password |
| API | Cloudflare Worker | Firebase SDK directo |
| Seguridad | Worker sin validación | Firestore Security Rules |
| Offline | No | Persistencia Firestore |
| Tiempo real | No (polling) | onSnapshot listeners |
| Concurrencia | Limitada | Ilimitada |
| Costo | Worker + Sheets API | Firebase Free Tier |

## ⚠️ Limitaciones conocidas

1. **Admin cambiando contraseñas de otros usuarios**: Requiere Firebase Cloud Functions. Actualmente, solo se actualiza el perfil en Firestore.
2. **GitHub Pages es solo hosting estático**: No hay backend propio, pero Firebase provee todo lo necesario.
3. **IDs de oportunidades**: En v1.0 eran numéricos (#1, #2...), en v2.0 son Firestore auto-IDs (string de 20 chars). El campo `legacyId` conserva el ID original.

## 🛠 Solución de problemas

### "auth/unauthorized-domain"
Agregar el dominio de GitHub Pages en Firebase Console → Authentication → Settings → Authorized domains.

### "Missing or insufficient permissions"
Verificar que las `firestore.rules` estén desplegadas y que el usuario tenga el perfil correcto en la colección `usuarios`.

### Datos no aparecen
1. Verificar que `firebase-config.js` tenga los valores correctos
2. Verificar que Firestore esté en modo producción (no test)
3. Abrir la consola del navegador para ver errores

### Login con email
Recordar que ahora se usa **email** en lugar de usuario. Los usuarios deben ingresar su email registrado.
