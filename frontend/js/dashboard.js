async function renderDashboard(container) {
  container.innerHTML = '<div class="loading">Cargando...</div>';

  try {
    const data = await apiGet('/reportes/dashboard');

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="stat-info">
            <h3>${data.proyectos.activos}</h3>
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
            <h3>${data.lotes.disponibles}</h3>
            <p>Lotes Disponibles</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
          </div>
          <div class="stat-info">
            <h3>S/ ${(data.cobros_hoy.total || 0).toFixed(2)}</h3>
            <p>Cobros del Día (${data.cobros_hoy.cantidad} pagos)</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="stat-info">
            <h3>${data.cuotas_vencidas}</h3>
            <p>Cuotas Vencidas</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon yellow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div class="stat-info">
            <h3>${data.clientes}</h3>
            <p>Clientes Registrados</p>
          </div>
        </div>
      </div>

      ${data.cuotas_vencen_semana && data.cuotas_vencen_semana.length > 0 ? `
        <div class="card" style="margin-bottom:24px;">
          <div class="card-header">
            <h3 class="card-title">Cuotas por Vencer esta Semana</h3>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Proyecto / Lote</th>
                  <th>N° Cuota</th>
                  <th>Vence</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                ${data.cuotas_vencen_semana.map(c => `
                  <tr>
                    <td>${c.cliente_nombre}</td>
                    <td>${c.proyecto_nombre}<br><small>${c.lote_codigo}</small></td>
                    <td>${c.numero_cuota}</td>
                    <td>${c.fecha_vencimiento}</td>
                    <td>S/ ${(c.monto || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      ${data.ultimos_pagos && data.ultimos_pagos.length > 0 ? `
        <div class="card" style="margin-bottom:24px;">
          <div class="card-header">
            <h3 class="card-title">Últimos Pagos Registrados</h3>
            <a href="#/cobros" class="btn btn-outline btn-sm" onclick="setTimeout(() => switchCobrosTab('historial'), 100)">Ver todos</a>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Recibo</th>
                  <th>Cliente</th>
                  <th>Cuota</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                ${data.ultimos_pagos.map(p => `
                  <tr>
                    <td><strong>${p.numero_recibo || '-'}</strong></td>
                    <td>${p.cliente_nombre}</td>
                    <td>N° ${p.numero_cuota}</td>
                    <td>S/ ${(p.monto_pagado || 0).toFixed(2)}</td>
                    <td><span class="badge badge-${p.metodo_pago || 'efectivo'}">${p.metodo_pago || 'efectivo'}</span></td>
                    <td>${p.fecha_pago}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Resumen de Lotes</h3>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:16px; text-align:center;">
          <div style="padding:16px; background:var(--success-light); border-radius:var(--radius);">
            <div style="font-size:28px; font-weight:700; color:var(--success);">${data.lotes.disponibles || 0}</div>
            <div style="font-size:13px; color:var(--gray-600);">Disponibles</div>
          </div>
          <div style="padding:16px; background:var(--primary-light); border-radius:var(--radius);">
            <div style="font-size:28px; font-weight:700; color:var(--primary);">${data.lotes.vendidos || 0}</div>
            <div style="font-size:13px; color:var(--gray-600);">Vendidos</div>
          </div>
          <div style="padding:16px; background:var(--warning-light); border-radius:var(--radius);">
            <div style="font-size:28px; font-weight:700; color:var(--warning);">${data.lotes.reservados || 0}</div>
            <div style="font-size:13px; color:var(--gray-600);">Reservados</div>
          </div>
          <div style="padding:16px; background:var(--gray-100); border-radius:var(--radius);">
            <div style="font-size:28px; font-weight:700; color:var(--gray-600);">${data.lotes.total || 0}</div>
            <div style="font-size:13px; color:var(--gray-600);">Total</div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Error al cargar dashboard: ${err.message}</div>`;
  }
}
