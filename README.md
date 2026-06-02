# Agente seguro WordPress jfmsalas.com

Agente preparado para gestionar de forma controlada el cambio:

`/mi-obra/` -> `/obra/`

Estado actual:

- No se ha ejecutado ningun cambio en WordPress.
- No hay credenciales dentro del repositorio.
- El script esta protegido por modo seguro por defecto.

## Objetivo

1. Conectar con WordPress REST API.
2. Localizar la pagina con slug `mi-obra`.
3. Cambiar su slug a `obra` solo cuando se confirme explicitamente.
4. Comprobar el resultado.

## Secretos necesarios

El workflow espera estos secretos de GitHub Actions:

- `WP_URL`
- `WP_USER`
- `WP_APP_PASSWORD`

## Seguridad

El workflow se ejecuta en modo seguro por defecto. No modifica WordPress salvo que se lance manualmente con:

- `dry_run=false`
- `confirm_change_slug=true`

El script no edita diseno, textos, galerias, plantillas ni estructura visual.
