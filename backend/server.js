require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('./middleware/auth');
const { hacerBackup, listarBackups, getDbInfo } = require('./backup');

const authRoutes = require('./routes/auth');
const proyectosRoutes = require('./routes/proyectos');
const lotesRoutes = require('./routes/lotes');
const clientesRoutes = require('./routes/clientes');
const ventasRoutes = require('./routes/ventas');
const cuotasRoutes = require('./routes/cuotas');
const pagosRoutes = require('./routes/pagos');
const reportesRoutes = require('./routes/reportes');

const app = express();
const PORT = process.env.PORT || 3000;

['recibos', 'backups'].forEach(dir => {
  const p = path.join(__dirname, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/proyectos', authenticateToken, proyectosRoutes);
app.use('/api/lotes', authenticateToken, lotesRoutes);
app.use('/api/clientes', authenticateToken, clientesRoutes);
app.use('/api/ventas', authenticateToken, ventasRoutes);
app.use('/api/cuotas', authenticateToken, cuotasRoutes);
app.use('/api/pagos', authenticateToken, pagosRoutes);
app.use('/api/reportes', authenticateToken, reportesRoutes);

app.get('/api/backup/info', authenticateToken, (req, res) => {
  res.json(getDbInfo());
});

app.get('/api/backup/list', authenticateToken, (req, res) => {
  res.json(listarBackups());
});

app.post('/api/backup/now', authenticateToken, (req, res) => {
  const nombre = hacerBackup();
  if (nombre) {
    res.json({ message: `Backup creado: ${nombre}`, archivo: nombre });
  } else {
    res.status(500).json({ error: 'Error al crear backup' });
  }
});

app.get('/api/backup/download/:nombre', authenticateToken, (req, res) => {
  const filePath = path.join(__dirname, 'backups', req.params.nombre);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Backup no encontrado' });
  }
  res.download(filePath);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log('============================================');
  console.log('  SISTEMA INMOBILIARIO');
  console.log(`  http://localhost:${PORT}`);
  console.log('============================================');
  console.log(`  Usuario: admin`);
  console.log(`  Clave:   admin123`);
  console.log('============================================');

  const backup = hacerBackup();
  if (backup) {
    console.log(`  Backup automático: ${backup}`);
  }
});
