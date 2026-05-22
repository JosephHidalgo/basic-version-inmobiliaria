async function renderConfiguracion(container) {
  container.innerHTML = '<div class="loading">Cargando...</div>';

  let backupInfo = { ruta: '', existe: false, tamaño: null, ultima_modificacion: null, backups: '' };
  let backups = [];

  try {
    backupInfo = await apiGet('/backup/info');
    backups = await apiGet('/backup/list');
  } catch {}

  const token = getToken();
  let userName = 'Usuario';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    userName = payload.nombre || payload.username;
  } catch {}

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Cambiar Contraseña</h3>
      </div>
      <div style="max-width: 400px;">
        <form id="changePasswordForm" onsubmit="handleChangePassword(event)">
          <div class="form-group">
            <label class="form-label" for="currentPassword">Contraseña Actual</label>
            <input class="form-control" type="password" id="currentPassword" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="newPassword">Nueva Contraseña</label>
            <input class="form-control" type="password" id="newPassword" required minlength="6">
          </div>
          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirmar Nueva Contraseña</label>
            <input class="form-control" type="password" id="confirmPassword" required minlength="6">
          </div>
          <div id="passwordMessage" style="display:none;" class="alert"></div>
          <button type="submit" class="btn btn-primary">Actualizar Contraseña</button>
        </form>
      </div>
    </div>

    <div class="card" style="margin-top: 24px;">
      <div class="card-header">
        <h3 class="card-title">Base de Datos</h3>
        <button class="btn btn-primary btn-sm" onclick="crearBackup()">Crear Backup Ahora</button>
      </div>
      <div class="detail-grid" style="grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));">
        <div class="detail-item">
          <div class="detail-label">Ubicación</div>
          <div class="detail-value" style="font-size:12px; word-break:break-all;">${backupInfo.ruta || 'Cargando...'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Estado</div>
          <div class="detail-value">
            <span class="badge badge-${backupInfo.existe ? 'success' : 'danger'}">
              ${backupInfo.existe ? 'Archivo presente' : 'No encontrado'}
            </span>
          </div>
        </div>
        ${backupInfo.tamaño ? `
        <div class="detail-item">
          <div class="detail-label">Tamaño</div>
          <div class="detail-value">${(backupInfo.tamaño / 1024).toFixed(1)} KB</div>
        </div>
        ` : ''}
        ${backupInfo.ultima_modificacion ? `
        <div class="detail-item">
          <div class="detail-label">Última modificación</div>
          <div class="detail-value">${new Date(backupInfo.ultima_modificacion).toLocaleString()}</div>
        </div>
        ` : ''}
        <div class="detail-item">
          <div class="detail-label">Carpeta de Backups</div>
          <div class="detail-value" style="font-size:12px; word-break:break-all;">${backupInfo.backups || 'Cargando...'}</div>
        </div>
      </div>

      <div style="margin-top:16px;" id="backupList">
        ${backups.length === 0 ? `
          <div class="empty-state" style="padding:16px;">
            <p>No hay backups aún. Haz clic en "Crear Backup Ahora".</p>
          </div>
        ` : `
          <div style="font-size:13px; font-weight:600; color:var(--gray-500); margin-bottom:8px;">
            Backups disponibles (máx. 10 automáticos):
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            ${backups.map(b => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--gray-50); border-radius:6px; font-size:13px;">
                <span>${b.nombre}</span>
                <span style="color:var(--gray-500);">
                  ${new Date(b.fecha).toLocaleString()} — ${(b.tamaño / 1024).toFixed(1)} KB
                </span>
                <button class="btn btn-outline btn-sm" onclick="descargarBackup('${b.nombre}')">Descargar</button>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>

    <div class="card" style="margin-top: 24px;">
      <div class="card-header">
        <h3 class="card-title">Información del Sistema</h3>
      </div>
      <div class="detail-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
        <div class="detail-item">
          <div class="detail-label">Versión</div>
          <div class="detail-value">1.0.0</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Usuario</div>
          <div class="detail-value">${userName}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Servidor</div>
          <div class="detail-value">http://localhost:3000</div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 24px; background: var(--warning-light); border: 1px solid var(--warning);">
      <div style="display:flex; gap:12px; align-items:start;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" style="flex-shrink:0; margin-top:2px;">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div>
          <strong style="color:var(--gray-900);">Para no perder tus datos:</strong>
          <ul style="margin-top:6px; padding-left:20px; font-size:13px; color:var(--gray-700);">
            <li>La base de datos está en el archivo <strong>backend/database.db</strong></li>
            <li>Los recibos PDF se guardan en <strong>backend/recibos/</strong></li>
            <li>Los backups automáticos se crean cada vez que inicias el sistema (máx. 10)</li>
            <li>Para respaldar manualmente: usa el botón <strong>"Crear Backup Ahora"</strong></li>
            <li>Para migrar a otra PC: copia toda la carpeta del sistema</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

async function handleChangePassword(event) {
  event.preventDefault();

  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const messageEl = document.getElementById('passwordMessage');

  if (newPassword !== confirmPassword) {
    messageEl.className = 'alert alert-error';
    messageEl.textContent = 'Las contraseñas nuevas no coinciden.';
    messageEl.style.display = 'block';
    return;
  }

  try {
    await apiPut('/auth/change-password', { currentPassword, newPassword });
    messageEl.className = 'alert alert-success';
    messageEl.textContent = 'Contraseña actualizada correctamente.';
    messageEl.style.display = 'block';
    document.getElementById('changePasswordForm').reset();
  } catch (err) {
    messageEl.className = 'alert alert-error';
    messageEl.textContent = err.message;
    messageEl.style.display = 'block';
  }
}

async function crearBackup() {
  const btn = document.querySelector('.card-header .btn-primary');
  btn.disabled = true;
  btn.textContent = 'Creando...';

  try {
    const result = await apiPost('/backup/now');
    alert(`Backup creado exitosamente:\n${result.archivo}`);
    navigateTo('#/configuracion');
  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Crear Backup Ahora';
  }
}

async function descargarBackup(nombre) {
  try {
    const token = getToken();
    const response = await fetch(`/api/backup/download/${nombre}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Error al descargar');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert('Error: ' + err.message);
  }
}
