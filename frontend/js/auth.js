document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.style.display = 'none';
      loginBtn.disabled = true;
      loginBtn.textContent = 'Iniciando sesión...';

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      if (!username || !password) {
        loginError.textContent = 'Todos los campos son requeridos.';
        loginError.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Iniciar Sesión';
        return;
      }

      try {
        const data = await apiPost('/auth/login', { username, password });
        setToken(data.token);
        window.location.href = '/';
      } catch (err) {
        loginError.textContent = err.message || 'Error al iniciar sesión.';
        loginError.style.display = 'block';
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Iniciar Sesión';
      }
    });
  }
});
