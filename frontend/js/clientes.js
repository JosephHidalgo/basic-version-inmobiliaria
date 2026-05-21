async function renderClientes(container) {
  container.innerHTML = '<div class="loading">Cargando...</div>';

  try {
    const clientes = await apiGet('/clientes');
    container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn btn-primary" onclick="showCreateClienteForm()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo Cliente
          </button>
          <div class="search-bar" style="margin:0;">
            <input class="form-control" type="text" id="clienteSearch" placeholder="Buscar por nombre o DNI..." oninput="searchClientes()">
          </div>
        </div>
      </div>

      ${clientes.length === 0 ? `
        <div class="card">
          <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
            <p>No hay clientes registrados</p>
            <button class="btn btn-primary" onclick="showCreateClienteForm()">Registrar Primer Cliente</button>
          </div>
        </div>
      ` : `
        <div class="card">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>DNI</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="clientesTableBody">
                ${clientes.map(c => `
                  <tr>
                    <td><strong>${c.nombre}</strong></td>
                    <td>${c.dni || '-'}</td>
                    <td>${c.telefono || '-'}</td>
                    <td>${c.email || '-'}</td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn btn-outline btn-sm" onclick="showEditClienteForm(${c.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="confirmDeleteCliente(${c.id})">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `}
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Error: ${err.message}</div>`;
  }
}

let searchTimeout;

function searchClientes() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const q = document.getElementById('clienteSearch').value.trim();
    try {
      const clientes = q ? await apiGet(`/clientes?search=${encodeURIComponent(q)}`) : await apiGet('/clientes');
      const tbody = document.getElementById('clientesTableBody');
      if (tbody) {
        tbody.innerHTML = clientes.map(c => `
          <tr>
            <td><strong>${c.nombre}</strong></td>
            <td>${c.dni || '-'}</td>
            <td>${c.telefono || '-'}</td>
            <td>${c.email || '-'}</td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-outline btn-sm" onclick="showEditClienteForm(${c.id})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="confirmDeleteCliente(${c.id})">Eliminar</button>
              </div>
            </td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error('Error searching clientes:', err);
    }
  }, 300);
}

function showCreateClienteForm() {
  openModal('Nuevo Cliente', getClienteFormHTML());
}

function showEditClienteForm(id) {
  apiGet(`/clientes/${id}`).then(cliente => {
    openModal('Editar Cliente', getClienteFormHTML(cliente));
  }).catch(err => alert('Error: ' + err.message));
}

function getClienteFormHTML(cliente = null) {
  const isEdit = !!cliente;
  return `
    <form id="clienteForm" onsubmit="saveCliente(event, ${isEdit ? cliente.id : 'null'})">
      <div class="form-group">
        <label class="form-label" for="cliNombre">Nombre Completo</label>
        <input class="form-control" type="text" id="cliNombre" value="${isEdit ? cliente.nombre : ''}" required placeholder="Nombre y apellidos">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="cliDni">DNI</label>
          <input class="form-control" type="text" id="cliDni" value="${isEdit ? cliente.dni : ''}" required placeholder="12345678">
        </div>
        <div class="form-group">
          <label class="form-label" for="cliTelefono">Teléfono</label>
          <input class="form-control" type="text" id="cliTelefono" value="${isEdit ? cliente.telefono : ''}" placeholder="999 888 777">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="cliEmail">Email</label>
        <input class="form-control" type="email" id="cliEmail" value="${isEdit ? cliente.email : ''}" placeholder="cliente@email.com">
      </div>
      <div class="form-group">
        <label class="form-label" for="cliDireccion">Dirección</label>
        <textarea class="form-control" id="cliDireccion" placeholder="Dirección del cliente">${isEdit ? cliente.direccion : ''}</textarea>
      </div>
      <div style="display:flex; gap:8px; justify-content:flex-end; margin-top: 24px;">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar Cambios' : 'Crear Cliente'}</button>
      </div>
    </form>
  `;
}

async function saveCliente(event, id) {
  event.preventDefault();
  const data = {
    nombre: document.getElementById('cliNombre').value.trim(),
    dni: document.getElementById('cliDni').value.trim(),
    telefono: document.getElementById('cliTelefono').value.trim(),
    email: document.getElementById('cliEmail').value.trim(),
    direccion: document.getElementById('cliDireccion').value.trim(),
  };

  try {
    if (id) {
      await apiPut(`/clientes/${id}`, data);
    } else {
      await apiPost('/clientes', data);
    }
    closeModal();
    navigateTo('#/clientes');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function confirmDeleteCliente(id) {
  if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
  try {
    await apiDelete(`/clientes/${id}`);
    navigateTo('#/clientes');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}
