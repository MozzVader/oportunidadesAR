# PRESALES AR

<p align="center">
  <strong>CRM de Oportunidades Comerciales</strong><br>
  Gestión de pipeline, seguimiento y análisis para equipos de presales.
</p>

---

## Características

- **Dashboard interactivo** con KPIs, pipeline por estado y gráficos de distribución
- **Gestión de oportunidades** con campos completos (cliente, industria, práctica, TCV, probabilidad, PM)
- **Edición inline** — editar oportunidades desde un modal sin abandonar la pantalla actual
- **Tablero Kanban** con drag & drop para mover oportunidades entre estados
- **Vista Calendario** — calendario mensual con fechas de entrega e inicio por oportunidad
- **Log de Eventos** — registro de actividad (creación, edición, cambio de estado, eliminación)
- **Estadísticas avanzadas** — gráficos por estado, origen, responsable, práctica e industria
- **Roles y permisos** granulares (admin, usuario, solo lectura)
- **Carga masiva** desde Excel (importar oportunidades por lotes)
- **Exportación a Excel** de las oportunidades filtradas
- **Modo claro/oscuro** con persistencia por usuario
- **Diseño glassmorphism** responsive
- **Notificaciones toast** — feedback visual en tiempo real sobre acciones
- **Offline-first** con persistencia de Firestore
- **Tiempo real** — cambios se sincronizan automáticamente entre pestañas

## Estados de Oportunidad

| Estado | Descripción |
|---|---|
| En Desarrollo | Oportunidad en etapa inicial |
| Entregada | Propuesta enviada al cliente |
| Finalizada | Cerrada exitosamente |
| Pausa | Temporalmente detenida |
| No Go | Descartada por el equipo |
| Cancelada | Cancelada por el cliente |
| Perdida | No ganada |
| Ganada | Cerrada y ganada |

## Roles y Permisos

| Acción | Admin | Usuario | Solo Lectura |
|---|:---:|:---:|:---:|
| Ver todas las oportunidades | ✅ | ✅ | ✅ |
| Ver Kanban (todas las cards) | ✅ | ✅ | ✅ |
| Ver Calendario | ✅ | ✅ | ✅ |
| Ver Estadísticas | ✅ | ✅ | ✅ |
| Ver Log de Eventos | ✅ | ✅ | ✅ |
| Crear oportunidad | ✅ | ✅ | ❌ |
| Editar oportunidad propia | ✅ | ✅ | ❌ |
| Editar oportunidad ajena | ✅ | ❌ | ❌ |
| Mover card en Kanban (propia) | ✅ | ✅ | ❌ |
| Mover card en Kanban (ajena) | ✅ | ❌ | ❌ |
| Eliminar oportunidad | ✅ | ❌ | ❌ |
| Administrar usuarios | ✅ | ❌ | ❌ |

## Tech Stack

| Capa | Tecnología |
|---|---|
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Autenticación | Firebase Auth (Email/Password) |
| Base de datos | Cloud Firestore |
| Deploy | GitHub Pages |
| Estilos | Glassmorphism, CSS custom properties, Tailwind-free |

## Estructura del Proyecto

```
├── index.html              # App principal (SPA)
├── login.html              # Página de login
├── favicon.svg
├── firestore.rules         # Reglas de seguridad de Firestore
├── migrate.js              # Script de migración (Google Sheets → Firestore)
├── SECURITY.md             # Política de seguridad
├── .gitignore
└── assets/
    ├── app.js              # Lógica principal de la SPA
    ├── firebase-auth.js    # Autenticación (login, logout, CRUD usuarios)
    ├── firebase-config.js  # Configuración de Firebase
    ├── firebase-db.js      # Capa de datos (CRUD oportunidades, cache)
    ├── style.css           # Estilos unificados (glassmorphism, dark mode)
    └── theme.js            # Gestión de tema claro/oscuro por usuario
```

## Despliegue

La app se despliega automáticamente en **GitHub Pages** cuando se hace push a la rama `main`.

Los cambios que requieren acción manual en Firebase:

1. **Firestore Rules** — Actualizar desde [Firebase Console](https://console.firebase.google.com/) > Firestore > Rules con el contenido de `firestore.rules`
2. **Authorized Domains** — Agregar el dominio de GitHub Pages en Firebase Console > Authentication > Settings > Authorized Domains

## Seguridad

La API key de Firebase que aparece en el código es **pública por diseño** y no representa un riesgo de seguridad. Ver [SECURITY.md](SECURITY.md) para más detalles.

## Licencia

Uso interno — PRESALES AR
