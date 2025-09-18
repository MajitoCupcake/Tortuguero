// monitor.js
const BASE_URL = 'https://68c8bab9ceef5a150f622cf3.mockapi.io/api/v1';
const API = BASE_URL + '/tortugueros';

let charts = {}; // key: `${tortId}_${devId}`

async function fetchTortugueros(){
  const r = await fetch(API);
  return r.json();
}

function createDeviceCard(tort, dev){
  const idKey = `${tort.id}_${dev.id}`;
  return `
    <div class="col-md-6 col-lg-4">
      <div class="card device-block animate__animated animate__fadeInUp">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 class="mb-0">${escapeHTML(tort.name)}</h6>
              <small class="text-muted">${escapeHTML(dev.name)} — ${dev.type}</small>
            </div>
            <div>
              <span id="status-${idKey}" class="status-badge ${dev.isOn ? 'status-on' : 'status-off'}">
                ${dev.isOn ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          <canvas id="chart-${idKey}" height="100"></canvas>

          <h6 class="mt-3">Últimos 10 estados</h6>
          <div class="table-responsive">
            <table class="table table-sm">
              <thead><tr><th>#</th><th>Estado</th><th>Fecha</th></tr></thead>
              <tbody id="tbl-${idKey}"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function escapeHTML(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

// render full monitor page
async function renderMonitor(){
  const container = document.getElementById('monitorContainer');
  container.innerHTML = '';
  const tortugueros = await fetchTortugueros();
  if(!tortugueros || tortugueros.length===0){
    container.innerHTML = `<div class="col-12"><div class="alert alert-info">No hay tortugueros creados aún.</div></div>`;
    return;
  }

  // build markup
  tortugueros.forEach(t => {
    t.devices.forEach(d => {
      container.insertAdjacentHTML('beforeend', createDeviceCard(t,d));
    });
  });

  // initial fill charts & tables
  updateAll(tortugueros);
}

function buildChart(idKey, labels, data){
  const ctx = document.getElementById(`chart-${idKey}`).getContext('2d');
  if(charts[idKey]) {
    charts[idKey].data.labels = labels;
    charts[idKey].data.datasets[0].data = data;
    charts[idKey].update();
    return;
  }
  charts[idKey] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Estado',
        data,
        fill: true,
        tension: 0.3,
        borderColor: '#6a11cb',
        backgroundColor: 'rgba(106,17,203,0.12)'
      }]
    },
    options: {
      scales: {
        y: { min:0, max:1, ticks:{ stepSize:1, callback: v => v? 'ON':'OFF' } }
      },
      plugins: { legend:{ display:false } },
      animation: { duration: 300 }
    }
  });
}

function updateDeviceUI(tort, dev){
  const idKey = `${tort.id}_${dev.id}`;
  // status badge
  const st = document.getElementById(`status-${idKey}`);
  if(st) {
    st.textContent = dev.isOn ? 'ON' : 'OFF';
    st.className = `status-badge ${dev.isOn ? 'status-on' : 'status-off'}`;
  }
  // table
  const tbody = document.getElementById(`tbl-${idKey}`);
  if(tbody){
    tbody.innerHTML = '';
    const history = (dev.history || []).slice(-10).reverse(); // newest first -> show newest top
    history.forEach((h, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${idx+1}</td><td>${h.isOn ? 'ON' : 'OFF'}</td><td>${new Date(h.timestamp).toLocaleString()}</td>`;
      tbody.appendChild(tr);
    });

    // chart data (chronological asc)
    const histForChart = (dev.history || []).slice(-10);
    const labels = histForChart.map(h => new Date(h.timestamp).toLocaleTimeString());
    const data = histForChart.map(h => h.isOn ? 1 : 0);
    buildChart(idKey, labels, data);
  }
}

function updateAll(tortugueros){
  tortugueros.forEach(t => {
    t.devices.forEach(d => updateDeviceUI(t,d));
  });
}

async function liveUpdate(){
  const tortugueros = await fetchTortugueros();
  updateAll(tortugueros);
}

// initialize
renderMonitor();
// refresh every 2 seconds
setInterval(liveUpdate, 2000);
