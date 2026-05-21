let currentTab = 'pendientes';

async function renderCobros(container) {
  container.innerHTML = '<div class="loading">Cargando...</div>';

  try {
    const [cuotas, pagosRecientes] = await Promise.all([
      apiGet('/cuotas/pendientes'),
      apiGet('/pagos?limit=20'),
    ]);

    container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-bar" style="margin:0;">
            <div class="tab-bar">
              <button class="tab-btn ${currentTab === 'pendientes' ? 'active' : ''}" onclick="switchCobrosTab('pendientes')">
                Cuotas Pendientes <span class="badge badge-warning" style="margin-left:6px;">${cuotas.length}</span>
              </button>
              <button class="tab-btn ${currentTab === 'historial' ? 'active' : ''}" onclick="switchCobrosTab('historial')">
                Historial de Pagos
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="cobrosContent">
        ${currentTab === 'pendientes' ? renderPendientesHTML(cuotas) : renderHistorialHTML(pagosRecientes)}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Error: ${err.message}</div>`;
  }
}

function switchCobrosTab(tab) {
  currentTab = tab;
  renderCobros(document.getElementById('pageContent'));
}

function renderPendientesHTML(cuotas) {
  if (cuotas.length === 0) {
    return `
      <div class="card">
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>No hay cuotas pendientes</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Proyecto / Lote</th>
              <th>N° Cuota</th>
              <th>Vencimiento</th>
              <th>Monto</th>
              <th>Pagado</th>
              <th>Mora</th>
              <th>Saldo</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            ${cuotas.map(c => {
              const saldo = (c.monto || 0) + (c.mora || 0) - (c.monto_pagado || 0);
              return `
                <tr class="cuota-${c.estado}">
                  <td><strong>${c.cliente_nombre}</strong><br><small>${c.cliente_dni || ''}</small></td>
                  <td>${c.proyecto_nombre}<br><small>${c.lote_codigo}</small></td>
                  <td>${c.numero_cuota}</td>
                  <td>${c.fecha_vencimiento}</td>
                  <td>S/ ${(c.monto || 0).toFixed(2)}</td>
                  <td>S/ ${(c.monto_pagado || 0).toFixed(2)}</td>
                  <td>S/ ${(c.mora || 0).toFixed(2)}</td>
                  <td><strong>S/ ${saldo > 0 ? saldo.toFixed(2) : '0.00'}</strong></td>
                  <td><span class="badge badge-${c.estado}">${c.estado}</span></td>
                  <td>
                    <button class="btn btn-primary btn-sm" onclick="showPagoForm(${c.id})">
                      Cobrar
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderHistorialHTML(pagos) {
  if (!pagos || pagos.length === 0) {
    return `
      <div class="card">
        <div class="empty-state">
          <p>No hay pagos registrados</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Recibo</th>
              <th>Cliente</th>
              <th>Proyecto / Lote</th>
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
                <td>${p.cliente_nombre || '-'}</td>
                <td>${p.proyecto_nombre || ''}<br><small>${p.lote_codigo || ''}</small></td>
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
    </div>
  `;
}

async function showPagoForm(cuotaId) {
  try {
    const cuotas = await apiGet('/cuotas/pendientes');
    const cuota = cuotas.find(c => c.id === cuotaId);
    if (!cuota) {
      alert('Cuota no encontrada.');
      return;
    }

    const saldo = (cuota.monto || 0) + (cuota.mora || 0) - (cuota.monto_pagado || 0);
    const montoSugerido = (cuota.monto || 0) + (cuota.mora || 0);

    openModal('Registrar Pago', `
      <form id="pagoForm" onsubmit="savePago(event, ${cuotaId})">
        <div class="card" style="padding:12px; margin-bottom:16px; background:var(--gray-50);">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:13px;">
            <div><strong>Cliente:</strong> ${cuota.cliente_nombre}</div>
            <div><strong>DNI:</strong> ${cuota.cliente_dni || '-'}</div>
            <div><strong>Proyecto:</strong> ${cuota.proyecto_nombre}</div>
            <div><strong>Lote:</strong> ${cuota.lote_codigo}</div>
            <div><strong>Cuota N°:</strong> ${cuota.numero_cuota}</div>
            <div><strong>Vencimiento:</strong> ${cuota.fecha_vencimiento}</div>
            <div><strong>Monto cuota:</strong> S/ ${(cuota.monto || 0).toFixed(2)}</div>
            <div><strong>Mora actual:</strong> S/ ${(cuota.mora || 0).toFixed(2)}</div>
            <div><strong>Ya pagado:</strong> S/ ${(cuota.monto_pagado || 0).toFixed(2)}</div>
            <div><strong>Saldo:</strong> S/ ${saldo > 0 ? saldo.toFixed(2) : '0.00'}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Monto a Cobrar (S/)</label>
            <input class="form-control" type="number" step="0.01" id="pMonto" value="${montoSugerido.toFixed(2)}" required placeholder="0.00">
          </div>
          <div class="form-group">
            <label class="form-label">Mora Extra (S/)</label>
            <input class="form-control" type="number" step="0.01" id="pMora" value="${(cuota.mora || 0).toFixed(2)}" placeholder="0.00">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Método de Pago</label>
            <select class="form-control" id="pMetodo">
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="deposito">Depósito</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Observaciones</label>
          <textarea class="form-control" id="pObservaciones" placeholder="Opcional"></textarea>
        </div>
        <div id="pagoMessage" style="display:none;" class="alert"></div>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top: 24px;">
          <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">Registrar Pago</button>
        </div>
      </form>
    `);
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function savePago(event, cuotaId) {
  event.preventDefault();
  const messageEl = document.getElementById('pagoMessage');

  const data = {
    cuota_id: cuotaId,
    monto_pagado: parseFloat(document.getElementById('pMonto').value) || 0,
    mora_cobrada: parseFloat(document.getElementById('pMora').value) || 0,
    metodo_pago: document.getElementById('pMetodo').value,
    observaciones: document.getElementById('pObservaciones').value.trim(),
  };

  try {
    const result = await apiPost('/pagos', data);
    closeModal();

    if (result.recibo_generado) {
      showAlert(`Pago registrado exitosamente. Recibo N° ${result.numero_recibo} generado.`, 'success');
    } else {
      showAlert(`Pago registrado. Recibo N° ${result.numero_recibo} (PDF no disponible).`, 'success');
    }

    renderCobros(document.getElementById('pageContent'));
  } catch (err) {
    messageEl.className = 'alert alert-error';
    messageEl.textContent = err.message;
    messageEl.style.display = 'block';
  }
}

async function downloadRecibo(pagoId) {
  try {
    const token = getToken();
    const response = await fetch(`/api/pagos/${pagoId}/recibo`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al descargar recibo');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo-${pagoId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function showAlert(message, type) {
  const container = document.getElementById('pageContent');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  alert.style.marginBottom = '16px';
  container.insertBefore(alert, container.firstChild);
  setTimeout(() => alert.remove(), 5000);
}
