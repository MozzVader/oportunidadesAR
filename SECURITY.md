# Security Policy

## Firebase API Keys

Este proyecto utiliza Firebase como backend (Authentication + Firestore). La `apiKey` que aparece en `assets/firebase-config.js` es **publica por diseño** y no representa una vulnerabilidad de seguridad.

### Por que es segura?

Firebase API keys son identificadores publicos, no secretos. La seguridad del proyecto no depende de mantener esta clave en secreto, sino de las siguientes capas de proteccion:

1. **Firebase Authentication** — Todas las operaciones requieren un usuario autenticado con email y contrasena validos.
2. **Firestore Security Rules** — Reglas definidas en `firestore.rules` controlan el acceso por rol (`admin`, `usuario`, `solo lectura`):
   - Lectura: solo usuarios autenticados
   - Escritura/edicion: solo `admin` o `usuario` sobre sus propias oportunidades
   - Eliminacion: solo `admin`
3. **Authorized Domains** — Firebase rechaza automaticamente peticiones desde dominios no autorizados en la consola de Firebase.

### Referencias

- [Firebase Documentation: API Keys](https://firebase.google.com/docs/projects/api-keys)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Stack Overflow: Is it safe to expose Firebase API key?](https://stackoverflow.com/questions/37480857/is-it-safe-to-expose-firebase-api-key-to-the-public)
