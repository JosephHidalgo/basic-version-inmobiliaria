function renderConfiguracion(container) {
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
        <h3 class="card-title">Información del Sistema</h3>
      </div>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">Versión</div>
          <div class="detail-value">1.0.0</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Usuario</div>
          <div class="detail-value" id="configUserName">-</div>
        </div>
      </div>
    </div>
  `;

  try {
    const token = getToken();
    const payload = JSON.parse(atob(token.split('.')[1]));
    document.getElementById('configUserName').textContent = payload.nombre || payload.username;
  } catch {}
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
