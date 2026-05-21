require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { authenticateToken } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const proyectosRoutes = require('./routes/proyectos');
const lotesRoutes = require('./routes/lotes');
const clientesRoutes = require('./routes/clientes');
const ventasRoutes = require('./routes/ventas');
const cuotasRoutes = require('./routes/cuotas');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/proyectos', authenticateToken, proyectosRoutes);
app.use('/api/lotes', authenticateToken, lotesRoutes);
app.use('/api/clientes', authenticateToken, clientesRoutes);
app.use('/api/ventas', authenticateToken, ventasRoutes);
app.use('/api/cuotas', authenticateToken, cuotasRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
