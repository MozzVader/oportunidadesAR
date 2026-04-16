---
Task ID: 2-a
Agent: Main Agent
Task: Eliminar campo "usuario" del modal de creación/modificación de usuarios + Agregar IDs amigables OPP-XXXX

Work Log:
- Verificado firebase-auth.js: addUser() usa instancia secundaria de Firebase + createUserWithEmailAndPassword — funciona correctamente
- Eliminado campo "Usuario" del modal de usuarios (index.html): removido input um_usuario
- Eliminado campo "Usuario" de la tabla de usuarios (index.html): removido columna <th>Usuario</th>
- Actualizado app.js: removido rendering de columna usuario en loadUsuarios(), removido set/get de um_usuario en openUserModal()
- Actualizado app.js: handleUserModalSubmit genera campo `usuario` automáticamente a partir del email (part before @)
- Actualizado app.js: removido "Usuario" del perfil del usuario (renderPerfil)
- Agregado campo `codigo` secuencial (OPP-XXXX) en firebase-db.js: función getNextCodigo() con transacción Firestore
- Agregado campo `codigo` a docToObj(), addOportunidad(), COLUMNS, y export Excel
- Agregado helper friendlyId(r) en app.js que devuelve r.codigo o fallback a r.id.substring(0,8)
- Reemplazados todos los displays de Firebase ID por código amigable: tablas (todas, mis), modal ver, buscador modificar
- Actualizadas búsquedas para buscar por código (modSearch, tabla, mis)
- Copiado firebase-db.js actualizado a upload dir

Stage Summary:
- Campo "Usuario" eliminado completamente del admin de usuarios
- Códigos OPP-0001, OPP-0002, etc. implementados para nuevas oportunidades
- Firestore necesita documento counters/oportunidades (se crea automáticamente al primer uso)
- Oportunidades existentes muestran fallback (ID truncado) hasta que se les asigne código
