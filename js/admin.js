const API_URL = "https://68c8bab9ceef5a150f622cf3.mockapi.io/api/v1/tortugueros";

document.getElementById("tortugueroForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("tortugueroName").value;

  const nuevoTortuguero = {
    name,
    devices: [
      { id: "pump", name: "Bomba", type: "pump", isOn: false, history: [] },
      { id: "filter", name: "Filtro", type: "filter", isOn: false, history: [] },
      { id: "uv", name: "Lámpara UV", type: "uv_light", isOn: false, history: [] }
    ]
  };

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nuevoTortuguero)
  });

  e.target.reset();
  cargarTortugueros();
});

async function cargarTortugueros() {
  const res = await fetch(API_URL);
  const tortugueros = await res.json();

  const list = document.getElementById("tortugueroList");
  list.innerHTML = "";

  tortugueros.forEach(t => {
    const card = document.createElement("div");
    card.className = "col-md-4 mb-3 animate__animated animate__fadeInUp";
    card.innerHTML = `
      <div class="card p-3">
        <h5>${t.name}</h5>
        <button class="btn btn-danger btn-sm" onclick="eliminarTortuguero('${t.id}')">Eliminar</button>
      </div>
    `;
    list.appendChild(card);
  });
}

async function eliminarTortuguero(id) {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  cargarTortugueros();
}
let editId = null;

function openEditModal(id, currentName) {
  editId = id;
  document.getElementById("editName").value = currentName;
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

document.getElementById("saveEdit").addEventListener("click", async () => {
  const newName = document.getElementById("editName").value.trim();
  if (!newName) return;

  await fetch(`${API}/${editId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: newName })
  });

  location.reload();
});


cargarTortugueros();
