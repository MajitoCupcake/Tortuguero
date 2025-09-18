// control.js
// RECUERDA: reemplaza BASE_URL por tu MockAPI (sin slash final)
const BASE_URL = 'https://68c8bab9ceef5a150f622cf3.mockapi.io/api/v1';
const API = BASE_URL + '/tortugueros';

// ============================
// FUNCIONES PRINCIPALES
// ============================

async function fetchTortugueros() {
  const r = await fetch(API);
  return r.json();
}

function createTortugueroCard(t) {
  const col = document.createElement('div');
  col.className = 'col-md-6 col-lg-4';
  col.innerHTML = `
    <div class="card p-3 tort-card animate__animated animate__fadeInUp">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <h5 class="mb-0">${escapeHTML(t.name)}</h5>
        <small class="text-muted">ID: ${t.id}</small>
      </div>
      <div class="mb-2">
        ${t.devices.map(d => `
          <div class="device-switch mb-2" id="dev-${t.id}-${d.id}">
            <div>
              <div class="dev-name">${escapeHTML(d.name)}</div>
              <small class="text-muted">${d.type}</small>
            </div>
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="sw-${t.id}-${d.id}" ${d.isOn ? 'checked' : ''}>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary btn-sm" onclick="refreshTortuguero('${t.id}')">Refrescar</button>
        <button class="btn btn-outline-secondary btn-sm" onclick="renameTortugueroPrompt('${t.id}')">Renombrar</button>
      </div>
    </div>
  `;
  // attach events after DOM nodes exist
  setTimeout(() => {
    t.devices.forEach(d => {
      const inp = document.getElementById(`sw-${t.id}-${d.id}`);
      if (inp) inp.addEventListener('change', () => toggleDevice(t.id, d.id));
    });
  }, 0);
  return col;
}

async function renderControls() {
  const cont = document.getElementById('tortugueroContainer');
  cont.innerHTML = '';
  const tortugueros = await fetchTortugueros();
  if (!tortugueros || tortugueros.length === 0) {
    cont.innerHTML = `<div class="col-12"><div class="alert alert-info">No hay tortugueros aún. Ve a Admin para crear uno.</div></div>`;
    return;
  }
  tortugueros.forEach(t => cont.appendChild(createTortugueroCard(t)));
}

// ============================
// HELPERS
// ============================

// Helper: safely escape text inserted into HTML
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));
}

// Mostrar notificaciones con Bootstrap Toast
function mostrarToast(mensaje, tipo = "primary") {
  const toastEl = document.getElementById("liveToast");
  if (!toastEl) return; // evitar errores si no existe el contenedor
  const toastBody = toastEl.querySelector(".toast-body");

  toastEl.className = `toast align-items-center text-bg-${tipo} border-0`;
  toastBody.textContent = mensaje;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

// ============================
// ACCIONES SOBRE DISPOSITIVOS
// ============================

async function toggleDevice(tortId, deviceId) {
  // get latest tortuguero
  const res = await fetch(`${API}/${tortId}`);
  const tort = await res.json();

  const device = tort.devices.find(d => d.id === deviceId);
  if (!device) return alert('Dispositivo no encontrado.');

  const target = !device.isOn;

  // Regla: si se enciende el filtro, encender la bomba también
  if (device.type === 'filter' && target === true) {
    const pump = tort.devices.find(x => x.type === 'pump');
    if (pump && !pump.isOn) {
      pump.isOn = true;
      pump.history = pump.history || [];
      pump.history.push({
        isOn: true,
        timestamp: new Date().toISOString(),
        note: 'Auto-encendido por filtro'
      });

      // Notificación al usuario
      mostrarToast("⚠️ El filtro se encendió, por lo tanto la bomba también fue activada.", "warning");
    }
  }

  // Cambiar el estado del dispositivo actual
  device.isOn = target;
  device.history = device.history || [];
  device.history.push({
    isOn: device.isOn,
    timestamp: new Date().toISOString(),
    note: 'Cambio manual'
  });

  // update lastUpdated at tortuguero level (optional)
  tort.lastUpdated = new Date().toISOString();

  // persist full tortuguero (PUT)
  await fetch(`${API}/${tortId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tort)
  });

  // Re-render completo para mantener consistencia
  await renderControls();
}

async function refreshTortuguero(tid) {
  await renderControls();
}

async function renameTortugueroPrompt(tid) {
  const res = await fetch(`${API}/${tid}`);
  const tort = await res.json();
  const nuevo = prompt('Nuevo nombre del tortuguero', tort.name);
  if (nuevo && nuevo.trim().length) {
    tort.name = nuevo.trim();
    await fetch(`${API}/${tid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tort)
    });
    renderControls();
  }
}
// Mostrar alertas bonitas con Bootstrap
function showAlert(message, type = "info") {
  const alertContainer = document.createElement("div");
  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3" role="alert" style="z-index: 3000;">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
  document.body.appendChild(alertContainer);

  setTimeout(() => {
    alertContainer.remove();
  }, 3000);
}

// Pantalla de colores
function flashScreen(colorClass) {
  const flash = document.getElementById("flash");
  flash.className = `flash ${colorClass}`;
  flash.style.display = "block";
  setTimeout(() => {
    flash.style.display = "none";
  }, 1000);
}

// Dispositivos con avisos y animaciones
function prenderLuzUV() {
  showAlert("💡 Luz UV encendida", "primary");
  flashScreen("purple");
}

function prenderBomba() {
  showAlert("💧 Bomba encendida", "success");
  flashScreen("white");
}

function prenderFiltro() {
  showAlert("🌊 Filtro encendido", "info");
  flashScreen("blue");
}


// ============================
// INIT
// ============================
renderControls();
