# Guía para Codex y asistentes de programación · Reto Azure Bootcamp

## Objetivo no negociable

Crear una landing de ropa visible desde Azure App Service, con catálogo de ropa definido estáticamente en frontend y banner de promoción cuyo texto se lee por el servidor desde `promociones/mensaje.txt` en un Azure Blob Storage privado. La lectura de Blob Storage debe utilizar System-assigned Managed Identity de App Service y Azure RBAC; no agregar connection strings, SAS ni Storage account keys al repositorio, frontend o pipeline.

## Estado de la solución

- `public/index.html`, `public/styles.css`, `public/app.js`: landing responsive, productos hardcodeados, bolsa simulada.
- `server.js`: Express, `/api/promocion` con SDK Azure Blob y `ManagedIdentityCredential` en App Service; en Codespaces/local `DefaultAzureCredential`.
- `.env.example`: nombres de variables no secretas.
- `README.md`: runbook de despliegue, identidad, RBAC, Storage y pruebas.

## Reglas para próximos cambios

1. Mantener el banner actualizado leyendo Blob al cargar página sin guardar el texto en HTML/JS fuente.
2. Mostrar claramente `DEMO` cuando Storage no esté listo, y `EN VIVO` solo cuando `fuente=azure-blob`.
3. No confundir que la web esté visible con que el reto de identidad administrada esté probado; verificar `GET /api/promocion` con fuente azure-blob después de editar mensaje.txt.
4. No añadir cuentas de servicio ni contraseñas para saltarse el RBAC.
5. Antes de fusionar a `main`, probar `npm run check`, `npm start`, que `/api/health` sea 200 y que en modo demo `/api/promocion` devuelva JSON con `fuente=demo`.
6. Usar una rama feature y un Pull Request; no romper la rama main.
7. Gestionar costos con planes apropiados de App Service y Storage y limpiar recursos de prueba.

## Entorno de desarrollo

La captura del usuario muestra Codespaces asociado a `lesssC/hack_azure_bootcamp_front` en `/workspaces/hack_azure_bootcamp_front`, que difiere del URL textual `lesssC/hack_azure_bootcamp`. Confirmar el nombre exacto del repositorio antes de hacer pushes o desplegar.
