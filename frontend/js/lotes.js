async function renderLotes(container, proyectoId) {
  container.innerHTML = '<div class="loading">Cargando...</div>';

  try {
    const [lotes, proyecto] = await Promise.all([
      apiGet(`/lotes/proyecto/${proyectoId}`),
      apiGet(`/proyectos/${proyectoId}`),
    ]);

    container.innerHTML = `
      <button class="back-btn" onclick="window.location.hash='#/proyectos'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Volver a Proyectos
      </button>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${proyecto.nombre} — Lotes</h3>
          <button class="btn btn-primary" onclick="showCreateLoteForm(${proyectoId})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo Lote
          </button>
        </div>

        ${lotes.length === 0 ? `
          <div class="empty-state">
            <p>No hay lotes registrados en este proyecto</p>
            <button class="btn btn-primary" onclick="showCreateLoteForm(${proyectoId})">Crear Primer Lote</button>
          </div>
        ` : `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Área (m²)</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${lotes.map(l => `
                  <tr>
                    <td><strong>${l.codigo}</strong></td>
                    <td>${l.nombre || '-'}</td>
                    <td>${l.area_m2 || 0}</td>
                    <td>S/ ${(l.precio_total || 0).toFixed(2)}</td>
                    <td><span class="badge badge-${l.estado}">${l.estado}</span></td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn btn-outline btn-sm" onclick="showEditLoteForm(${l.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="confirmDeleteLote(${l.id})">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Error: ${err.message}</div>`;
  }
}

function showCreateLoteForm(proyectoId) {
  openModal('Nuevo Lote', getLoteFormHTML(proyectoId));
}

function showEditLoteForm(id) {
  apiGet(`/lotes/${id}`).then(lote => {
    openModal('Editar Lote', getLoteFormHTML(lote.proyecto_id, lote));
  }).catch(err => alert('Error: ' + err.message));
}

function getLoteFormHTML(proyectoId, lote = null) {
  const isEdit = !!lote;
  return `
    <form id="loteForm" onsubmit="saveLote(event, ${proyectoId}, ${isEdit ? lote.id : 'null'})">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="lotCodigo">Código</label>
          <input class="form-control" type="text" id="lotCodigo" value="${isEdit ? lote.codigo : ''}" required placeholder="Ej: A-01">
        </div>
        <div class="form-group">
          <label class="form-label" for="lotNombre">Nombre</label>
          <input class="form-control" type="text" id="lotNombre" value="${isEdit ? lote.nombre : ''}" placeholder="Ej: Lote A-01">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="lotArea">Área (m²)</label>
          <input class="form-control" type="number" step="0.01" id="lotArea" value="${isEdit ? lote.area_m2 : ''}" placeholder="0.00">
        </div>
        <div class="form-group">
          <label class="form-label" for="lotPrecio">Precio Total (S/)</label>
          <input class="form-control" type="number" step="0.01" id="lotPrecio" value="${isEdit ? lote.precio_total : ''}" placeholder="0.00">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="lotEstado">Estado</label>
        <select class="form-control" id="lotEstado">
          <option value="disponible" ${isEdit && lote.estado === 'disponible' ? 'selected' : ''}>Disponible</option>
          <option value="reservado" ${isEdit && lote.estado === 'reservado' ? 'selected' : ''}>Reservado</option>
          <option value="vendido" ${isEdit && lote.estado === 'vendido' ? 'selected' : ''}>Vendido</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="lotDescripcion">Descripción</label>
        <textarea class="form-control" id="lotDescripcion" placeholder="Descripción del lote">${isEdit ? lote.descripcion : ''}</textarea>
      </div>
      <div style="display:flex; gap:8px; justify-content:flex-end; margin-top: 24px;">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar Cambios' : 'Crear Lote'}</button>
      </div>
    </form>
  `;
}

async function saveLote(event, proyectoId, id) {
  event.preventDefault();
  const data = {
    proyecto_id: proyectoId,
    codigo: document.getElementById('lotCodigo').value.trim(),
    nombre: document.getElementById('lotNombre').value.trim(),
    area_m2: parseFloat(document.getElementById('lotArea').value) || 0,
    precio_total: parseFloat(document.getElementById('lotPrecio').value) || 0,
    estado: document.getElementById('lotEstado').value,
    descripcion: document.getElementById('lotDescripcion').value.trim(),
  };

  try {
    if (id) {
      await apiPut(`/lotes/${id}`, data);
    } else {
      await apiPost('/lotes', data);
    }
    closeModal();
    renderLotes(document.getElementById('pageContent'), proyectoId);
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function confirmDeleteLote(id) {
  if (!confirm('¿Estás seguro de eliminar este lote?')) return;
  try {
    await apiDelete(`/lotes/${id}`);
    const proyectoId = window.proyectoActual?.id;
    if (proyectoId) {
      renderLotes(document.getElementById('pageContent'), proyectoId);
    } else {
      navigateTo('#/proyectos');
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}
