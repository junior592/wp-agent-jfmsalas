# Protocolo operativo para editar jfmsalas.com sin hacer perder tiempo al usuario

## Regla principal

No se debe pedir al usuario que navegue GitHub, Actions, logs, Codex ni pantallas tecnicas. Si una operacion exige una credencial, permiso o desbloqueo que solo el propietario puede conceder, se debe pedir una unica cosa concreta y explicar por que es imposible hacerlo sin esa autorizacion.

## Estado probado

- El repositorio `junior592/wp-agent-jfmsalas` existe.
- El workflow y el script existen.
- La conexion a WordPress por REST API funciona.
- La API localizo correctamente la pagina `Mi Obra` con id `4217` y slug `mi-obra`.
- El intento de escritura fallo con `rest_cannot_edit` y HTTP 401.
- Diagnostico: las credenciales REST guardadas no tienen permisos efectivos para editar esa pagina.

## Lo que no debe repetirse

- No pedir al usuario que relance ejecuciones sin haber cambiado una causa concreta.
- No pedir capturas de GitHub salvo que sea la unica manera de ver un error.
- No insistir con Codex/GitHub si el bloqueo esta en permisos de WordPress.
- No convertir una prueba simple en un flujo largo.

## Ruta tecnica correcta

Para que el asistente pueda editar WordPress mediante REST API se necesita una de estas dos vias:

### Via A: credencial temporal de aplicacion de WordPress

Requisitos:

- `WP_URL`: `https://jfmsalas.com`
- `WP_USER`: usuario administrador real de WordPress
- `WP_APP_PASSWORD`: contrasena de aplicacion creada desde ese mismo usuario administrador

La contrasena debe ser temporal y revocable.

### Via B: plugin puente en WordPress

Crear un plugin pequeno que exponga acciones cerradas y seguras, por ejemplo:

- cambiar slug de una pagina concreta
- actualizar menu concreto
- crear redireccion concreta
- limpiar cache
- verificar resultado

Este plugin debe exigir una clave temporal y limitar las acciones permitidas.

## Politica de seguridad

- Nunca pedir la contrasena normal de WordPress.
- Aceptar solo contrasenas de aplicacion temporales o claves revocables.
- No guardar credenciales en archivos del repositorio.
- No imprimir secretos en logs.
- Tras completar una operacion, pedir revocar la clave temporal.

## Flujo futuro correcto

Cuando el usuario pida un cambio web:

1. Identificar si es contenido, estructura, URL, menu, SEO, tienda o diseno.
2. Confirmar internamente si se puede hacer por REST API o requiere editor visual/plugin.
3. Ejecutar primero lectura/verificacion.
4. Ejecutar cambio solo si hay credencial con permisos.
5. Verificar publicamente el resultado.
6. Responder solo con: hecho, que se cambio, que no se toco, y si queda algo pendiente.

## Bloqueo actual

El asistente no puede crear por si mismo una contrasena de aplicacion de WordPress, porque WordPress solo la genera dentro de una sesion ya autenticada de administrador. Sin esa credencial o un puente equivalente, no existe acceso de escritura remoto seguro.
