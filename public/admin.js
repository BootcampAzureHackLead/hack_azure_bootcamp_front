'use strict';

const $ = (id) => document.getElementById(id);

let autoRefreshTimer = null;

function formatTime(date) {
  return date.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function addLogEntry(method, url, status, latencyMs, payload) {
  const tbody = $('logTableBody');
  const emptyRow = tbody.querySelector('.empty-log-row');
  if (emptyRow) {
    emptyRow.remove();
  }

  const tr = document.createElement('tr');
  const isOk = status >= 200 && status < 300;
  const badgeClass = isOk ? 'http-badge-200' : 'http-badge-503';
  const preview = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);

  tr.innerHTML = `
    <td>${formatTime(new Date())}</td>
    <td><strong>${method}</strong></td>
    <td><code>${url}</code></td>
    <td><span class="${badgeClass}">${status}</span></td>
    <td>${latencyMs} ms</td>
    <td title="${preview.replace(/"/g, '&quot;')}">${preview.length > 60 ? preview.slice(0, 60) + '…' : preview}</td>
  `;

  tbody.insertBefore(tr, tbody.firstChild);

  // Mantener máximo 50 registros en el historial
  while (tbody.children.length > 50) {
    tbody.removeChild(tbody.lastChild);
  }
}

/**
 * Consulta el endpoint GET /health
 */
async function checkHealth(log = true) {
  const start = performance.now();
  const badge = $('healthBadge');
  const codeEl = $('healthHttpCode');
  const latencyEl = $('healthLatency');
  const lastCheckEl = $('healthLastCheck');
  const jsonEl = $('healthJson');

  try {
    const res = await fetch('/health', { cache: 'no-store' });
    const latency = Math.round(performance.now() - start);
    let data;
    try {
      data = await res.json();
    } catch {
      data = { status: 'parse_error' };
    }

    codeEl.textContent = `${res.status} ${res.statusText || (res.ok ? 'OK' : 'Error')}`;
    latencyEl.textContent = `${latency} ms`;
    lastCheckEl.textContent = formatTime(new Date());
    jsonEl.textContent = JSON.stringify(data, null, 2);

    if (res.ok && data.status === 'ok') {
      badge.textContent = 'ONLINE (200)';
      badge.className = 'status-pill status-ok';
    } else {
      badge.textContent = `FALLO (${res.status})`;
      badge.className = 'status-pill status-error';
    }

    if (log) {
      addLogEntry('GET', '/health', res.status, latency, data);
    }
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    const latency = Math.round(performance.now() - start);
    codeEl.textContent = 'ERROR DE RED';
    latencyEl.textContent = `${latency} ms`;
    lastCheckEl.textContent = formatTime(new Date());
    jsonEl.textContent = JSON.stringify({ error: error.message }, null, 2);
    badge.textContent = 'OFFLINE';
    badge.className = 'status-pill status-error';

    if (log) {
      addLogEntry('GET', '/health', 0, latency, { error: error.message });
    }
    return { ok: false, status: 0, error: error.message };
  }
}

/**
 * Consulta el endpoint GET /api/promotion
 */
async function checkPromotion(log = true) {
  const start = performance.now();
  const badge = $('promotionBadge');
  const codeEl = $('promotionHttpCode');
  const latencyEl = $('promotionLatency');
  const lastCheckEl = $('promotionLastCheck');
  const jsonEl = $('promotionJson');
  const textQuote = $('promotionTextPreview');

  try {
    const res = await fetch('/api/promotion', { cache: 'no-store' });
    const latency = Math.round(performance.now() - start);
    let data;
    try {
      data = await res.json();
    } catch {
      data = { error: 'Invalid JSON' };
    }

    codeEl.textContent = `${res.status} ${res.statusText || (res.ok ? 'OK' : 'Unavailable')}`;
    latencyEl.textContent = `${latency} ms`;
    lastCheckEl.textContent = formatTime(new Date());
    jsonEl.textContent = JSON.stringify(data, null, 2);

    if (res.status === 200 && data.message) {
      badge.textContent = 'EN VIVO (200 OK)';
      badge.className = 'status-pill status-ok';
      textQuote.textContent = `"${data.message}"`;
      textQuote.classList.remove('promo-unavailable');
    } else if (res.status === 503) {
      badge.textContent = '503 NO DISPONIBLE';
      badge.className = 'status-pill status-error';
      textQuote.textContent = `⚠️ Promoción no disponible (${data.error || 'Promotion unavailable'}). Verifique que Azure Blob Storage tenga mensaje.txt y permisos de Managed Identity.`;
      textQuote.classList.add('promo-unavailable');
    } else {
      badge.textContent = `HTTP ${res.status}`;
      badge.className = 'status-pill status-error';
      textQuote.textContent = data.error || data.message || 'Error desconocido';
      textQuote.classList.add('promo-unavailable');
    }

    if (log) {
      addLogEntry('GET', '/api/promotion', res.status, latency, data);
    }
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    const latency = Math.round(performance.now() - start);
    codeEl.textContent = 'ERROR DE RED';
    latencyEl.textContent = `${latency} ms`;
    lastCheckEl.textContent = formatTime(new Date());
    jsonEl.textContent = JSON.stringify({ error: error.message }, null, 2);
    badge.textContent = 'ERROR DE CONEXIÓN';
    badge.className = 'status-pill status-error';
    textQuote.textContent = 'No se pudo conectar al servidor.';
    textQuote.classList.add('promo-unavailable');

    if (log) {
      addLogEntry('GET', '/api/promotion', 0, latency, { error: error.message });
    }
    return { ok: false, status: 0, error: error.message };
  }
}

/**
 * Consulta un endpoint arbitrario y lo registra en la tabla
 */
async function testEndpoint(method, url) {
  const start = performance.now();
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const latency = Math.round(performance.now() - start);
    let data;
    try {
      data = await res.json();
    } catch {
      data = { raw: await res.text() };
    }
    addLogEntry(method, url, res.status, latency, data);
  } catch (error) {
    const latency = Math.round(performance.now() - start);
    addLogEntry(method, url, 0, latency, { error: error.message });
  }
}

/**
 * Actualiza los dos paneles principales simultáneamente
 */
async function refreshAll() {
  const refreshBtn = $('refreshBtn');
  refreshBtn.disabled = true;
  refreshBtn.classList.add('loading');

  await Promise.all([checkHealth(false), checkPromotion(false)]);

  refreshBtn.disabled = false;
  refreshBtn.classList.remove('loading');
}

/**
 * Gestión del intervalo de auto-refresco
 */
function setupAutoRefresh() {
  const checkbox = $('autoRefreshCheck');

  function start() {
    stop();
    autoRefreshTimer = setInterval(() => {
      if (!document.hidden) {
        refreshAll();
      }
    }, 10000);
  }

  function stop() {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
      autoRefreshTimer = null;
    }
  }

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      start();
      refreshAll();
    } else {
      stop();
    }
  });

  if (checkbox.checked) {
    start();
  }
}

// Configuración de eventos
$('refreshBtn').addEventListener('click', () => refreshAll());
$('btnTestPromotion').addEventListener('click', () => checkPromotion(true));
$('btnTestHealth').addEventListener('click', () => checkHealth(true));
$('btnTestPromocionEs').addEventListener('click', () => testEndpoint('GET', '/api/promocion'));
$('btnTestHealthEs').addEventListener('click', () => testEndpoint('GET', '/api/health'));

$('btnClearLogs').addEventListener('click', () => {
  const tbody = $('logTableBody');
  tbody.innerHTML = '<tr class="empty-log-row"><td colspan="6">Historial limpiado.</td></tr>';
});

// Inicialización
refreshAll();
setupAutoRefresh();
