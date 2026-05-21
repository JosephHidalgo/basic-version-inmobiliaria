let ventaActualId = null;

async function renderVentas(container) {
  ventaActualId = null;
  container.innerHTML = '<div class="loading">Cargando...</div>';

  try {
    const ventas = await apiGet('/ventas');
    container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn btn-primary" onclick="showCreateVentaForm()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva Venta
          </button>
        </div>
      </div>

      ${ventas.length === 0 ? `
        <div class="card">
          <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p>No hay ventas registradas</p>
            <button class="btn btn-primary" onclick="showCreateVentaForm()">Registrar Primera Venta</button>
          </div>
        </div>
      ` : `
        <div class="card">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Cliente</th>
                  <th>Proyecto / Lote</th>
                  <th>Tipo</th>
                  <th>Precio</th>
                  <th>Inicial</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${ventas.map(v => `
                  <tr>
                    <td>${v.id}</td>
                    <td><strong>${v.cliente_nombre}</strong><br><small>${v.cliente_dni || ''}</small></td>
                    <td>${v.proyecto_nombre}<br><small>${v.lote_codigo} — ${v.lote_nombre || ''}</small></td>
                    <td><span class="badge badge-${v.tipo_pago === 'contado' ? 'success' : 'warning'}">${v.tipo_pago}</span></td>
                    <td>S/ ${(v.precio_acordado || 0).toFixed(2)}</td>
                    <td>S/ ${(v.cuota_inicial || 0).toFixed(2)}</td>
                    <td>${v.fecha_venta || '-'}</td>
                    <td><span class="badge badge-${v.estado}">${v.estado}</span></td>
                    <td>
                      <button class="btn btn-outline btn-sm" onclick="showVentaDetail(${v.id})">Ver</button>
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

async function showCreateVentaForm() {
  try {
    const [proyectos, clientes] = await Promise.all([
      apiGet('/proyectos'),
      apiGet('/clientes'),
    ]);

    openModal('Nueva Venta', `
      <form id="ventaForm" onsubmit="saveVenta(event)">
        <div class="form-group">
          <label class="form-label">Proyecto</label>
          <select class="form-control" id="vProyecto" onchange="loadLotesDisponibles()" required>
            <option value="">Seleccionar proyecto...</option>
            ${proyectos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Lote</label>
          <select class="form-control" id="vLote" required>
            <option value="">Primero selecciona un proyecto</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Cliente</label>
          <select class="form-control" id="vCliente" required>
            <option value="">Seleccionar cliente...</option>
            ${clientes.map(c => `<option value="${c.id}">${c.nombre} (${c.dni || ''})</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Precio Acordado (S/)</label>
            <input class="form-control" type="number" step="0.01" id="vPrecio" required placeholder="0.00">
          </div>
          <div class="form-group">
            <label class="form-label">Fecha de Venta</label>
            <input class="form-control" type="date" id="vFecha" value="${new Date().toISOString().split('T')[0]}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Tipo de Pago</label>
          <select class="form-control" id="vTipoPago" onchange="toggleCreditoFields()" required>
            <option value="contado">Contado</option>
            <option value="credito">Crédito</option>
          </select>
        </div>
        <div id="creditoFields" style="display:none;">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Cuota Inicial (S/)</label>
              <input class="form-control" type="number" step="0.01" id="vInicial" placeholder="0.00">
            </div>
            <div class="form-group">
              <label class="form-label">N° de Cuotas</label>
              <input class="form-control" type="number" min="1" id="vNumCuotas" placeholder="Ej: 12">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Frecuencia</label>
            <select class="form-control" id="vFrecuencia">
              <option value="diaria">Diaria</option>
              <option value="semanal">Semanal</option>
              <option value="mensual" selected>Mensual</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Observaciones</label>
          <textarea class="form-control" id="vObservaciones" placeholder="Observaciones opcionales"></textarea>
        </div>
        <div id="ventaMessage" style="display:none;" class="alert"></div>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top: 24px;">
          <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">Registrar Venta</button>
        </div>
      </form>
    `);
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function loadLotesDisponibles() {
  const proyectoId = document.getElementById('vProyecto').value;
  const select = document.getElementById('vLote');
  select.innerHTML = '<option value="">Cargando...</option>';

  if (!proyectoId) {
    select.innerHTML = '<option value="">Primero selecciona un proyecto</option>';
    return;
  }

  try {
    const lotes = await apiGet(`/lotes/proyecto/${proyectoId}`);
    const disponibles = lotes.filter(l => l.estado !== 'vendido');
    select.innerHTML = disponibles.length === 0
      ? '<option value="">No hay lotes disponibles</option>'
      : '<option value="">Seleccionar lote...</option>' +
        disponibles.map(l => `<option value="${l.id}">${l.codigo} — ${l.nombre || ''} (S/ ${(l.precio_total || 0).toFixed(2)})</option>`).join('');
  } catch (err) {
    select.innerHTML = '<option value="">Error al cargar</option>';
  }
}

function toggleCreditoFields() {
  const tipo = document.getElementById('vTipoPago').value;
  document.getElementById('creditoFields').style.display = tipo === 'credito' ? 'block' : 'none';
}

async function saveVenta(event) {
  event.preventDefault();

  const data = {
    lote_id: parseInt(document.getElementById('vLote').value),
    cliente_id: parseInt(document.getElementById('vCliente').value),
    precio_acordado: parseFloat(document.getElementById('vPrecio').value) || 0,
    fecha_venta: document.getElementById('vFecha').value,
    tipo_pago: document.getElementById('vTipoPago').value,
    observaciones: document.getElementById('vObservaciones').value.trim(),
  };

  if (data.tipo_pago === 'credito') {
    data.cuota_inicial = parseFloat(document.getElementById('vInicial').value) || 0;
    data.num_cuotas = parseInt(document.getElementById('vNumCuotas').value) || 0;
    data.frecuencia_cuota = document.getElementById('vFrecuencia').value;
  }

  const messageEl = document.getElementById('ventaMessage');

  try {
    await apiPost('/ventas', data);
    closeModal();
    navigateTo('#/ventas');
  } catch (err) {
    messageEl.className = 'alert alert-error';
    messageEl.textContent = err.message;
    messageEl.style.display = 'block';
  }
}

async function showVentaDetail(id) {
  ventaActualId = id;
  const container = document.getElementById('pageContent');
  container.innerHTML = '<div class="loading">Cargando...</div>';

  try {
    const [venta, pagos] = await Promise.all([
      apiGet(`/ventas/${id}`),
      apiGet(`/pagos?venta_id=${id}`),
    ]);

    container.innerHTML = `
      <button class="back-btn" onclick="navigateTo('#/ventas')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Volver a Ventas
      </button>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Venta N° ${venta.id}</h3>
          <span class="badge badge-${venta.estado}">${venta.estado}</span>
        </div>
        <div class="detail-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
          <div class="detail-item">
            <div class="detail-label">Cliente</div>
            <div class="detail-value">${venta.cliente_nombre}</div>
            <small>DNI: ${venta.cliente_dni || '-'} | Tel: ${venta.cliente_telefono || '-'}</small>
          </div>
          <div class="detail-item">
            <div class="detail-label">Proyecto</div>
            <div class="detail-value">${venta.proyecto_nombre}</div>
            <small>${venta.proyecto_ubicacion || ''}</small>
          </div>
          <div class="detail-item">
            <div class="detail-label">Lote</div>
            <div class="detail-value">${venta.lote_codigo}</div>
            <small>${venta.lote_nombre || ''} — ${venta.area_m2 || 0} m²</small>
          </div>
          <div class="detail-item">
            <div class="detail-label">Precio Acordado</div>
            <div class="detail-value">S/ ${(venta.precio_acordado || 0).toFixed(2)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Tipo de Pago</div>
            <div class="detail-value"><span class="badge badge-${venta.tipo_pago === 'contado' ? 'success' : 'warning'}">${venta.tipo_pago}</span></div>
          </div>
          ${venta.tipo_pago === 'credito' ? `
            <div class="detail-item">
              <div class="detail-label">Cuota Inicial</div>
              <div class="detail-value">S/ ${(venta.cuota_inicial || 0).toFixed(2)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">N° de Cuotas</div>
              <div class="detail-value">${venta.num_cuotas}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Monto por Cuota</div>
              <div class="detail-value">S/ ${(venta.monto_cuota || 0).toFixed(2)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Frecuencia</div>
              <div class="detail-value">${venta.frecuencia_cuota}</div>
            </div>
          ` : ''}
          <div class="detail-item">
            <div class="detail-label">Fecha de Venta</div>
            <div class="detail-value">${venta.fecha_venta || '-'}</div>
          </div>
          ${venta.observaciones ? `
            <div class="detail-item" style="grid-column: 1 / -1;">
              <div class="detail-label">Observaciones</div>
              <div class="detail-value">${venta.observaciones}</div>
            </div>
          ` : ''}
        </div>
      </div>

      ${venta.tipo_pago === 'credito' && venta.cuotas ? `
        <div class="card" style="margin-top: 24px;">
          <div class="card-header">
            <h3 class="card-title">Cronograma de Cuotas</h3>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Fecha Vencimiento</th>
                  <th>Monto</th>
                  <th>Pagado</th>
                  <th>Mora</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${venta.cuotas.map(c => {
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
      ` : ''}

      <div class="card" style="margin-top: 24px;">
        <div class="card-header">
          <h3 class="card-title">Historial de Pagos</h3>
        </div>
        ${!pagos || pagos.length === 0 ? `
          <div class="empty-state">
            <p>No hay pagos registrados para esta venta</p>
          </div>
        ` : `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Recibo</th>
                  <th>Cuota N°</th>
                  <th>Monto</th>
                  <th>Mora</th>
                  <th>Método</th>
                  <th>Fecha</th>
                  <th>Recibo</th>
                </tr>
              </thead>
              <tbody>
                ${pagos.map(p => `
                  <tr>
                    <td><strong>${p.numero_recibo || '-'}</strong></td>
                    <td>${p.numero_cuota || '-'}</td>
                    <td>S/ ${(p.monto_pagado || 0).toFixed(2)}</td>
                    <td>S/ ${(p.mora_cobrada || 0).toFixed(2)}</td>
                    <td><span class="badge badge-${p.metodo_pago || 'efectivo'}">${p.metodo_pago || 'efectivo'}</span></td>
                    <td>${p.fecha_pago || '-'}</td>
                    <td>
                      <button class="btn btn-outline btn-sm" onclick="downloadRecibo(${p.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        PDF
                      </button>
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
