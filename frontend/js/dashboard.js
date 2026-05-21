async function renderDashboard(container) {
  container.innerHTML = '<div class="loading">Cargando...</div>';

  try {
    const [proyectos, clientes] = await Promise.all([
      apiGet('/proyectos'),
      apiGet('/clientes'),
    ]);

    const totalLotes = proyectos.reduce((sum, p) => sum + (p.total_lotes || 0), 0);
    const lotesDisponibles = proyectos.reduce((sum, p) => sum + (p.lotes_disponibles || 0), 0);

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="stat-info">
            <h3>${proyectos.length}</h3>
            <p>Proyectos Activos</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div class="stat-info">
            <h3>${lotesDisponibles}</h3>
            <p>Lotes Disponibles</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div class="stat-info">
            <h3>${totalLotes - lotesDisponibles}</h3>
            <p>Lotes Vendidos / Reservados</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon yellow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div class="stat-info">
            <h3>${clientes.length}</h3>
            <p>Clientes Registrados</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Proyectos Recientes</h3>
          <a href="#/proyectos" class="btn btn-outline btn-sm">Ver todos</a>
        </div>
        ${proyectos.length === 0 ? `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <p>No hay proyectos aún. Crea tu primer proyecto.</p>
            <button class="btn btn-primary" onclick="window.location.hash='#/proyectos'">Crear Proyecto</button>
          </div>
        ` : `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Ubicación</th>
                  <th>Lotes</th>
                  <th>Disponibles</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${proyectos.slice(0, 5).map(p => `
                  <tr>
                    <td><strong>${p.nombre}</strong></td>
                    <td>${p.ubicacion || '-'}</td>
                    <td>${p.total_lotes || 0}</td>
                    <td>${p.lotes_disponibles || 0}</td>
                    <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Error al cargar dashboard: ${err.message}</div>`;
  }
}
