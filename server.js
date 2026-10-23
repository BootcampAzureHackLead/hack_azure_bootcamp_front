import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential, ManagedIdentityCredential } from '@azure/identity';

const app = express();
app.disable('x-powered-by');
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const FALLBACK_TEXT = 'Nueva colección disponible · Descubre prendas para cada momento';

// La identidad administrada existe SOLO en Azure App Service. En Codespaces se
// usa DefaultAzureCredential si se inició sesión con Azure CLI (az login).
// No se usa connection string, account key ni SAS para acceder a Blob Storage.
let cachedBlobClient;
function getBlobClient() {
  const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const container = process.env.AZURE_STORAGE_CONTAINER_NAME || 'promociones';
  const name = process.env.AZURE_STORAGE_BLOB_NAME || 'mensaje.txt';
  if (!account || !/^[a-z0-9]{3,24}$/.test(account)) return null;
  if (!cachedBlobClient) {
    const serviceUrl = `https://${account}.blob.core.windows.net`;
    const credential = process.env.WEBSITE_INSTANCE_ID
      ? new ManagedIdentityCredential()
      : new DefaultAzureCredential();
    cachedBlobClient = new BlobServiceClient(serviceUrl, credential)
      .getContainerClient(container).getBlobClient(name);
  }
  return cachedBlobClient;
}

app.get('/api/promocion', async (_req, res) => {
  res.set('Cache-Control', 'no-store, max-age=0');
  const blobClient = getBlobClient();
  if (!blobClient) {
    return res.json({ mensaje: FALLBACK_TEXT, fuente: 'demo', actualizado: null });
  }
  try {
    // Leer en cada petición, así editar mensaje.txt NO requiere redeploy.
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 8000);
    try {
      const response = await blobClient.download(0, undefined, {
        abortSignal: abortController.signal
      });
      const buffers = [];
      let bytes = 0;
      for await (const chunk of response.readableStreamBody) {
        bytes += chunk.length;
        if (bytes > 2048) throw new Error('mensaje.txt supera 2 KB');
        buffers.push(chunk);
      }
      const mensaje = Buffer.concat(buffers).toString('utf8')
        .replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 180);
      if (!mensaje) throw new Error('mensaje.txt esta vacio');
      return res.json({ mensaje, fuente: 'azure-blob', actualizado: response.lastModified || null });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error('[PROMOCION_STORAGE]', error?.statusCode || error?.name || 'Error');
    return res.status(503).json({
      mensaje: FALLBACK_TEXT,
      fuente: 'fallback',
      error: 'No se pudo leer la promocion de Azure Blob Storage'
    });
  }
});

app.get('/api/health', (_req, res) => res.json({ estado: 'ok', aplicacion: 'lumera' }));
app.use(express.static(path.join(currentDir, 'public'), {
  etag: true,
  maxAge: 0,
  setHeaders(res) { res.set('X-Content-Type-Options', 'nosniff'); }
}));
app.get('*', (_req, res) => res.sendFile(path.join(currentDir, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LUMERA listo en http://localhost:${PORT}`);
  console.log(`Storage: ${process.env.AZURE_STORAGE_ACCOUNT_NAME ? 'configurado' : 'modo demostracion'}`);
});
