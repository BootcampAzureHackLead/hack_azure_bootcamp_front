# LUMERA · Landing de ropa en Azure App Service

**Reto Azure Bootcamp:** landing comercial con catálogo **estático** y banner **dinámico** leído en el backend desde el blob `mensaje.txt` con **Managed Identity**. El frontend no guarda ni recibe credenciales de Storage. Los precios y el carrito son demostrativos.

## Arquitectura

```text
Navegador → Azure App Service (Node.js / Express)
   ├── GET /                  → public/index.html + CSS/JS con productos hardcodeados
   └── GET /api/promocion     → Blob Storage (mensaje.txt)
                                    ↑ Azure RBAC: Storage Blob Data Reader
                            App Service Managed Identity (system-assigned)
```

El frontend llama a `/api/promocion` en el **mismo origen**. El servidor usa `ManagedIdentityCredential` cuando corre en Azure App Service (detección `WEBSITE_INSTANCE_ID`) y `DefaultAzureCredential` en Codespaces/local. La consulta no se almacena en caché; cambiar `mensaje.txt` modifica el banner en el siguiente refresco de la página sin reconstruir ni publicar la web.

## 1. Abrir y ejecutar en GitHub Codespaces

La rama recomendada es `feat/landing-ropa-azure-storage`.

```bash
# Dentro de /workspaces/hack_azure_bootcamp_front
npm install
npm run check
npm start
```

En la pestaña **Puertos**, abre el puerto `3000` (o pulsa **Open in Browser** cuando Codespaces lo sugiera). El banner mostrará `DEMO` hasta configurar Azure Storage. El catálogo, filtros, bolsa y diseño funcionan sin recursos de Azure.

## 2. Crear Storage y mensaje.txt

1. En Azure Portal, crea o reutiliza un **Storage Account** tipo StorageV2, con región compatible, redundancia LRS para un entorno de prueba y presupuesto controlado.
2. En **Contenedores**, crea un contenedor privado llamado `promociones` (sin acceso anónimo).
3. Sube un blob **Block blob** llamado `mensaje.txt`, de tipo `text/plain`, con texto, por ejemplo:

   `¡20% de descuento en nuestra nueva colección! Solo esta semana ✳`

4. Apunta **solo** el nombre de la cuenta de Storage. **No copies claves ni connection strings al proyecto.**

## 3. Crear Azure App Service

1. Crea una **Web App** para **Node.js 20 o 22 LTS**, en Linux, y selecciona un plan disponible dentro del presupuesto.
2. En **Identidad**, activa la identidad administrada **Asignada por el sistema** (*System assigned*).
3. En el Storage Account → **Control de acceso (IAM)**, asigna **Storage Blob Data Reader** a la identidad de la Web App. Para minimizar privilegios, limita el ámbito al contenedor `promociones` si Azure lo permite. Este paso requiere permisos para crear asignaciones de roles; ser colaborador no siempre basta.
4. En App Service → **Variables de entorno** agrega:
   - `AZURE_STORAGE_ACCOUNT_NAME` = nombre de la cuenta (sin `.blob.core.windows.net`)
   - `AZURE_STORAGE_CONTAINER_NAME` = `promociones`
   - `AZURE_STORAGE_BLOB_NAME` = `mensaje.txt`
5. Despliega esta rama o `main` mediante **Deployment Center / GitHub Actions**. El comando de inicio es `npm start`. Usa puerto asignado por App Service (`process.env.PORT`).

## 4. Validar los requisitos del reto

1. Accede a `https://<tu-app>.azurewebsites.net` y verifica catálogo estático, filtros y carrito demo.
2. Confirma que la cinta superior muestre la promoción junto a **EN VIVO**.
3. Abre directamente `https://<tu-app>.azurewebsites.net/api/promocion`: JSON con `fuente: "azure-blob"`.
4. Abre Azure Portal → Storage → `promociones/mensaje.txt` y cambia el texto.
5. Recarga la landing: aparece la promoción nueva sin cambios en GitHub ni redeploy.
6. Verifica que el contenedor sea privado y que no haya credenciales en HTML, JavaScript, commits o variables públicas. La identidad de App Service tiene permisos de solo lectura.

## 5. Pruebas en Codespaces con Storage real (opcional)

Para leer Azure Blob desde Codespaces con `DefaultAzureCredential`, instala Azure CLI si no existe, ejecuta `az login --use-device-code` y asigna **Storage Blob Data Reader** a tu usuario en la cuenta o contenedor. Exporta las tres variables con los nombres de arriba y reinicia `npm start`. No subas `.env` ni claves. Evita cambiar permisos de la suscripción sin autorización.

## Endpoints y estados

| Ruta | Respuesta | Uso |
|---|---|---|
| `/` | HTML landing | Catálogo estático |
| `/api/promocion` | `mensaje`, `fuente`, `actualizado` | Banner dinámico |
| `/api/health` | `{ estado: 'ok' }` | Salud del servidor |

- `fuente = azure-blob`: Storage accesible mediante identidad. **Es el resultado válido del reto.**
- `fuente = demo`: aún no hay nombre de Storage configurado.
- `fuente = fallback`, HTTP 503: falta permiso RBAC, el blob no existe, timeout u otro error de Storage. Revisar registros del servidor. **No equivale a integración exitosa.**

## Cuidados

- No imprimir tokens, encabezados Authorization, SAS ni claves de Storage.
- El frontend usa `textContent` para el mensaje de Storage (sin ejecutar HTML del blob).
- `mensaje.txt` está limitado a 2 KB en servidor y a 180 caracteres en el banner.
- No se procesan pagos reales. Las imágenes son de Unsplash y requieren conectividad a internet.
- El plan de App Service, Storage, logs y transferencia pueden generar costos; eliminar los recursos después del reto si ya no se necesitan.

## Documentación Microsoft

- https://learn.microsoft.com/en-us/entra/identity-platform/multi-service-web-app-access-storage
- https://learn.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-nodejs
- https://learn.microsoft.com/en-us/azure/app-service/deploy-github-actions
