async function renderProyectos(container) {
  container.innerHTML = '<div class="loading">Cargando...</div>';

  try {
    const proyectos = await apiGet('/proyectos');
    container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn btn-primary" onclick="showCreateProyectoForm()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo Proyecto
          </button>
        </div>
      </div>

      ${proyectos.length === 0 ? `
        <div class="card">
          <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <p>No hay proyectos registrados</p>
            <button class="btn btn-primary" onclick="showCreateProyectoForm()">Crear Primer Proyecto</button>
          </div>
        </div>
      ` : `
        <div class="list-container">
          ${proyectos.map(p => `
            <div class="list-item">
              <div class="list-item-info">
                <h4>${p.nombre}</h4>
                <p>${p.ubicacion || 'Sin ubicación'} · ${p.total_lotes || 0} lotes · ${p.lotes_disponibles || 0} disponibles</p>
              </div>
              <div class="list-item-actions">
                <span class="badge badge-${p.estado}">${p.estado}</span>
                <button class="btn btn-outline btn-sm" onclick="navigateToLotes(${p.id}, '${p.nombre}')">Ver Lotes</button>
                <button class="btn btn-outline btn-sm" onclick="showEditProyectoForm(${p.id})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="confirmDeleteProyecto(${p.id})">Eliminar</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Error: ${err.message}</div>`;
  }
}

function showCreateProyectoForm() {
  openModal('Nuevo Proyecto', getProyectoFormHTML());
}

function showEditProyectoForm(id) {
  apiGet(`/proyectos/${id}`).then(proyecto => {
    openModal('Editar Proyecto', getProyectoFormHTML(proyecto));
  }).catch(err => {
    alert('Error: ' + err.message);
  });
}

function getProyectoFormHTML(proyecto = null) {
  const isEdit = !!proyecto;
  return `
    <form id="proyectoForm" onsubmit="saveProyecto(event, ${isEdit ? proyecto.id : 'null'})">
      <div class="form-group">
        <label class="form-label" for="proyNombre">Nombre del Proyecto</label>
        <input class="form-control" type="text" id="proyNombre" value="${isEdit ? proyecto.nombre : ''}" required placeholder="Ej: Residencial Las Palmas">
      </div>
      <div class="form-group">
        <label class="form-label" for="proyUbicacion">Ubicación</label>
        <input class="form-control" type="text" id="proyUbicacion" value="${isEdit ? proyecto.ubicacion : ''}" placeholder="Ej: Sector Norte, Ciudad">
      </div>
      <div class="form-group">
        <label class="form-label" for="proyDescripcion">Descripción</label>
        <textarea class="form-control" id="proyDescripcion" placeholder="Descripción del proyecto">${isEdit ? proyecto.descripcion : ''}</textarea>
      </div>
      ${isEdit ? `
        <div class="form-group">
          <label class="form-label" for="proyEstado">Estado</label>
          <select class="form-control" id="proyEstado">
            <option value="activo" ${proyecto.estado === 'activo' ? 'selected' : ''}>Activo</option>
            <option value="inactivo" ${proyecto.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
          </select>
        </div>
      ` : ''}
      <div style="display:flex; gap:8px; justify-content:flex-end; margin-top: 24px;">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar Cambios' : 'Crear Proyecto'}</button>
      </div>
    </form>
  `;
}

async function saveProyecto(event, id) {
  event.preventDefault();
  const data = {
    nombre: document.getElementById('proyNombre').value.trim(),
    ubicacion: document.getElementById('proyUbicacion').value.trim(),
    descripcion: document.getElementById('proyDescripcion').value.trim(),
  };

  if (id) {
    data.estado = document.getElementById('proyEstado').value;
  }

  try {
    if (id) {
      await apiPut(`/proyectos/${id}`, data);
    } else {
      await apiPost('/proyectos', data);
    }
    closeModal();
    navigateTo('#/proyectos');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function confirmDeleteProyecto(id) {
  if (!confirm('¿Estás seguro de eliminar este proyecto? También se eliminarán todos sus lotes.')) return;

  try {
    await apiDelete(`/proyectos/${id}`);
    navigateTo('#/proyectos');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function navigateToLotes(proyectoId, proyectoNombre) {
  window.proyectoActual = { id: proyectoId, nombre: proyectoNombre };
  window.location.hash = `#/lotes/${proyectoId}`;
}
