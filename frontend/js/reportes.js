let reportesTab = 'cobros';

async function renderReportes(container) {
  container.innerHTML = '<div class="loading">Cargando...</div>';
  reportesTab = 'cobros';
  renderReportesContent(container);
}

async function renderReportesContent(container) {
  container.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="tab-bar">
          <button class="tab-btn ${reportesTab === 'cobros' ? 'active' : ''}" onclick="switchReportesTab('cobros')">Cobros por Fecha</button>
          <button class="tab-btn ${reportesTab === 'lotes' ? 'active' : ''}" onclick="switchReportesTab('lotes')">Lotes Disponibles</button>
          <button class="tab-btn ${reportesTab === 'cliente' ? 'active' : ''}" onclick="switchReportesTab('cliente')">Estado de Cuenta</button>
          <button class="tab-btn ${reportesTab === 'morosos' ? 'active' : ''}" onclick="switchReportesTab('morosos')">Clientes con Mora</button>
        </div>
      </div>
    </div>
    <div id="reportesContent">
      <div class="loading">Cargando...</div>
    </div>
  `;

  switch (reportesTab) {
    case 'cobros': renderReporteCobros(); break;
    case 'lotes': renderReporteLotes(); break;
    case 'cliente': renderReporteCliente(); break;
    case 'morosos': renderReporteMorosos(); break;
  }
}

function switchReportesTab(tab) {
  reportesTab = tab;
  renderReportesContent(document.getElementById('pageContent'));
}

async function renderReporteCobros() {
  const el = document.getElementById('reportesContent');
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const desdeDefault = monthAgo.toISOString().split('T')[0];

  el.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Reporte de Cobros</h3>
      </div>
      <div style="display:flex; gap:12px; align-items:end; flex-wrap:wrap; margin-bottom:16px;">
        <div class="form-group" style="margin:0;">
          <label class="form-label">Desde</label>
          <input class="form-control" type="date" id="repCobrosDesde" value="${desdeDefault}">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Hasta</label>
          <input class="form-control" type="date" id="repCobrosHasta" value="${today}">
        </div>
        <button class="btn btn-primary" onclick="buscarReporteCobros()">Buscar</button>
        <button class="btn btn-outline" onclick="imprimirReporte('cobros')">Imprimir</button>
      </div>
      <div id="reporteCobrosResult">
        <div class="empty-state"><p>Selecciona un rango de fechas y haz clic en Buscar</p></div>
      </div>
    </div>
  `;
}

async function buscarReporteCobros() {
  const el = document.getElementById('reporteCobrosResult');
  const desde = document.getElementById('repCobrosDesde').value;
  const hasta = document.getElementById('repCobrosHasta').value;

  if (!desde || !hasta) {
    el.innerHTML = '<div class="alert alert-error">Selecciona ambas fechas</div>';
    return;
  }

  el.innerHTML = '<div class="loading">Cargando...</div>';

  try {
    const data = await apiGet(`/reportes/cobros?desde=${desde}&hasta=${hasta}`);

    el.innerHTML = `
      <div style="display:flex; gap:16px; margin-bottom:16px;">
        <div style="padding:12px 20px; background:var(--success-light); border-radius:var(--radius);">
          <div style="font-size:20px; font-weight:700; color:var(--success);">S/ ${(data.total || 0).toFixed(2)}</div>
          <div style="font-size:12px; color:var(--gray-600);">Total Cobrado</div>
        </div>
        <div style="padding:12px 20px; background:var(--warning-light); border-radius:var(--radius);">
          <div style="font-size:20px; font-weight:700; color:var(--warning);">S/ ${(data.totalMora || 0).toFixed(2)}</div>
          <div style="font-size:12px; color:var(--gray-600);">Total en Mora</div>
        </div>
        <div style="padding:12px 20px; background:var(--gray-100); border-radius:var(--radius);">
          <div style="font-size:20px; font-weight:700; color:var(--gray-600);">${data.pagos.length}</div>
          <div style="font-size:12px; color:var(--gray-600);">Pagos Registrados</div>
        </div>
      </div>
      ${data.pagos.length === 0 ? `
        <div class="empty-state"><p>No hay pagos en este rango</p></div>
      ` : `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Recibo</th>
                <th>Cliente</th>
                <th>Proyecto / Lote</th>
                <th>Monto</th>
                <th>Mora</th>
                <th>Método</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${data.pagos.map(p => `
                <tr>
                  <td><strong>${p.numero_recibo || '-'}</strong></td>
                  <td>${p.cliente_nombre || '-'}</td>
                  <td>${p.proyecto_nombre || ''}<br><small>${p.lote_codigo || ''}</small></td>
                  <td>S/ ${(p.monto_pagado || 0).toFixed(2)}</td>
                  <td>S/ ${(p.mora_cobrada || 0).toFixed(2)}</td>
                  <td><span class="badge badge-${p.metodo_pago || 'efectivo'}">${p.metodo_pago || 'efectivo'}</span></td>
                  <td>${p.fecha_pago || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;
  } catch (err) {
    el.innerHTML = `<div class="alert alert-error">Error: ${err.message}</div>`;
  }
}

async function renderReporteLotes() {
  const el = document.getElementById('reportesContent');

  try {
    const lotes = await apiGet('/reportes/lotes');

    el.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Lotes Disponibles</h3>
          <button class="btn btn-outline btn-sm" onclick="imprimirReporte('lotes')">Imprimir</button>
        </div>
        ${lotes.length === 0 ? `
          <div class="empty-state"><p>No hay lotes disponibles</p></div>
        ` : `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Área (m²)</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                ${lotes.map(l => `
                  <tr>
                    <td><strong>${l.proyecto_nombre}</strong><br><small>${l.proyecto_ubicacion || ''}</small></td>
                    <td>${l.codigo}</td>
                    <td>${l.nombre || '-'}</td>
                    <td>${l.area_m2 || 0}</td>
                    <td><strong>S/ ${(l.precio_total || 0).toFixed(2)}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="alert alert-error">Error: ${err.message}</div>`;
  }
}

async function renderReporteCliente() {
  const el = document.getElementById('reportesContent');

  try {
    const clientes = await apiGet('/clientes');

    el.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Estado de Cuenta por Cliente</h3>
        </div>
        <div class="form-group">
          <label class="form-label">Seleccionar Cliente</label>
          <select class="form-control" id="repClienteSelect" onchange="buscarEstadoCuenta()">
            <option value="">Seleccionar cliente...</option>
            ${clientes.map(c => `<option value="${c.id}">${c.nombre} (${c.dni || ''})</option>`).join('')}
          </select>
        </div>
        <div id="reporteClienteResult">
          <div class="empty-state"><p>Selecciona un cliente para ver su estado de cuenta</p></div>
        </div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="alert alert-error">Error: ${err.message}</div>`;
  }
}

async function buscarEstadoCuenta() {
  const el = document.getElementById('reporteClienteResult');
  const clienteId = document.getElementById('repClienteSelect').value;

  if (!clienteId) {
    el.innerHTML = '<div class="empty-state"><p>Selecciona un cliente</p></div>';
    return;
  }

  el.innerHTML = '<div class="loading">Cargando...</div>';

  try {
    const data = await apiGet(`/reportes/cliente/${clienteId}`);

    const totalDeuda = data.ventas.reduce((s, v) => s + v.saldo_pendiente, 0);
    const totalPagado = data.ventas.reduce((s, v) => s + v.total_pagado, 0);

    el.innerHTML = `
      <div style="margin-top:16px;">
        <div class="card" style="margin-bottom:16px; background:var(--gray-50);">
          <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px;">
            <div><strong>Cliente:</strong> ${data.cliente.nombre}</div>
            <div><strong>DNI:</strong> ${data.cliente.dni || '-'}</div>
            <div><strong>Teléfono:</strong> ${data.cliente.telefono || '-'}</div>
            <div><strong>Email:</strong> ${data.cliente.email || '-'}</div>
          </div>
        </div>
        <div style="display:flex; gap:16px; margin-bottom:16px;">
          <div style="padding:12px 20px; background:var(--primary-light); border-radius:var(--radius);">
            <div style="font-size:20px; font-weight:700; color:var(--primary);">S/ ${(totalPagado || 0).toFixed(2)}</div>
            <div style="font-size:12px; color:var(--gray-600);">Total Pagado</div>
          </div>
          <div style="padding:12px 20px; background:${totalDeuda > 0 ? 'var(--danger-light)' : 'var(--success-light)'}; border-radius:var(--radius);">
            <div style="font-size:20px; font-weight:700; color:${totalDeuda > 0 ? 'var(--danger)' : 'var(--success)'};">S/ ${(totalDeuda || 0).toFixed(2)}</div>
            <div style="font-size:12px; color:var(--gray-600);">Saldo Pendiente</div>
          </div>
        </div>
        ${data.ventas.length === 0 ? `
          <div class="empty-state"><p>Este cliente no tiene ventas registradas</p></div>
        ` : data.ventas.map(v => `
          <div class="card" style="margin-bottom:12px;">
            <div class="card-header">
              <h4 style="font-size:14px; font-weight:600;">
                ${v.proyecto_nombre} — Lote ${v.lote_codigo}
                <span style="font-weight:400; color:var(--gray-500); margin-left:8px;">
                  (${v.tipo_pago} | S/ ${(v.precio_acordado || 0).toFixed(2)})
                </span>
              </h4>
              <div style="display:flex; gap:8px; font-size:12px;">
                <span>Pagado: S/ ${(v.total_pagado || 0).toFixed(2)}</span>
                <span style="color:${v.saldo_pendiente > 0 ? 'var(--danger)' : 'var(--success)'};">Saldo: S/ ${(v.saldo_pendiente || 0).toFixed(2)}</span>
              </div>
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Vencimiento</th>
                    <th>Monto</th>
                    <th>Pagado</th>
                    <th>Mora</th>
                    <th>Saldo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${v.cuotas.map(c => {
                    const saldo = c.monto + c.mora - c.monto_pagado;
                    return `
                      <tr class="cuota-${c.estado}">
                        <td>${c.numero_cuota}</td>
                        <td>${c.fecha_vencimiento}</td>
                        <td>S/ ${(c.monto || 0).toFixed(2)}</td>
                        <td>S/ ${(c.monto_pagado || 0).toFixed(2)}</td>
                        <td>S/ ${(c.mora || 0).toFixed(2)}</td>
                        <td>S/ ${(saldo > 0 ? saldo : 0).toFixed(2)}</td>
                        <td><span class="badge badge-${c.estado}">${c.estado}</span></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="alert alert-error">Error: ${err.message}</div>`;
  }
}

async function renderReporteMorosos() {
  const el = document.getElementById('reportesContent');

  try {
    const morosos = await apiGet('/reportes/morosos');

    el.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Clientes con Cuotas Vencidas</h3>
          <button class="btn btn-outline btn-sm" onclick="imprimirReporte('morosos')">Imprimir</button>
        </div>
        ${morosos.length === 0 ? `
          <div class="empty-state">
            <p>No hay clientes con cuotas vencidas</p>
          </div>
        ` : `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>DNI</th>
                  <th>Teléfono</th>
                  <th>Cuotas Vencidas</th>
                  <th>Deuda Total</th>
                </tr>
              </thead>
              <tbody>
                ${morosos.map(m => `
                  <tr>
                    <td><strong>${m.nombre}</strong></td>
                    <td>${m.dni || '-'}</td>
                    <td>${m.telefono || '-'}</td>
                    <td><span class="badge badge-danger">${m.cuotas_vencidas}</span></td>
                    <td><strong style="color:var(--danger);">S/ ${(m.deuda_total || 0).toFixed(2)}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="alert alert-error">Error: ${err.message}</div>`;
  }
}

function imprimirReporte(tipo) {
  const content = document.getElementById('reportesContent');
  const title = document.getElementById('pageTitle').textContent;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <link rel="stylesheet" href="css/styles.css">
        <style>
          body { padding: 20px; font-family: system-ui, sans-serif; }
          .no-print { display: none; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { font-size: 12px; text-transform: uppercase; color: #64748b; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        <hr>
        ${content.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}
