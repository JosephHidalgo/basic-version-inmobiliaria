const routes = {
  'dashboard': { title: 'Dashboard', render: renderDashboard },
  'proyectos': { title: 'Proyectos', render: renderProyectos },
  'lotes': { title: 'Lotes', render: renderLotes },
  'ventas': { title: 'Ventas', render: renderVentas },
  'cobros': { title: 'Cobros', render: renderCobros },
  'clientes': { title: 'Clientes', render: renderClientes },
  'configuracion': { title: 'Configuración', render: renderConfiguracion },
};

let currentRoute = '';

function navigateTo(hash) {
  const path = hash.replace('#/', '') || 'dashboard';
  const parts = path.split('/');
  const route = parts[0];

  if (!routes[route]) {
    window.location.hash = '#/dashboard';
    return;
  }

  currentRoute = route;

  const title = route === 'lotes' && window.proyectoActual?.nombre
    ? `${window.proyectoActual.nombre} — Lotes`
    : routes[route].title;
  document.getElementById('pageTitle').textContent = title;

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.route === route);
  });

  const content = document.getElementById('pageContent');
  const id = parts[1] || null;

  if (route === 'lotes' && id) {
    routes[route].render(content, parseInt(id));
  } else {
    routes[route].render(content);
  }
}

function handleLogout() {
  removeToken();
  window.location.href = '/login.html';
}

function initApp() {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  const token = getToken();
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    document.getElementById('userName').textContent = payload.nombre || payload.username;
  } catch {
    document.getElementById('userName').textContent = 'Usuario';
  }

  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  document.querySelectorAll('.nav-item[data-route]').forEach(item => {
    item.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
    });
  });

  window.addEventListener('hashchange', () => navigateTo(window.location.hash));
  navigateTo(window.location.hash || '#/dashboard');
}

function openModal(title, bodyHTML) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

document.addEventListener('DOMContentLoaded', initApp);
