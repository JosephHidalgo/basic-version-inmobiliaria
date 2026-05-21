const { getDatabase } = require('../database');

function getByVenta(req, res) {
  const db = getDatabase();
  const cuotas = db.prepare(
    'SELECT * FROM cuotas WHERE venta_id = ? ORDER BY numero_cuota ASC'
  ).all(req.params.ventaId);
  res.json(cuotas);
}

function getPendientes(req, res) {
  const db = getDatabase();

  const now = new Date().toISOString().split('T')[0];

  db.prepare(`
    UPDATE cuotas SET estado = 'vencido'
    WHERE estado = 'pendiente' AND fecha_vencimiento < ?
  `).run(now);

  const cuotas = db.prepare(`
    SELECT cu.*, v.precio_acordado, v.tipo_pago,
           c.nombre as cliente_nombre, c.dni as cliente_dni, c.telefono as cliente_telefono,
           l.codigo as lote_codigo, l.nombre as lote_nombre,
           p.nombre as proyecto_nombre
    FROM cuotas cu
    JOIN ventas v ON v.id = cu.venta_id
    JOIN clientes c ON c.id = v.cliente_id
    JOIN lotes l ON l.id = v.lote_id
    JOIN proyectos p ON p.id = l.proyecto_id
    WHERE cu.estado IN ('pendiente', 'vencido', 'parcial')
    ORDER BY cu.fecha_vencimiento ASC
  `).all();

  res.json(cuotas);
}

function updateMora(req, res) {
  const { mora } = req.body;
  if (mora === undefined || mora < 0) {
    return res.status(400).json({ error: 'Monto de mora inválido.' });
  }

  const db = getDatabase();
  const cuota = db.prepare('SELECT * FROM cuotas WHERE id = ?').get(req.params.id);
  if (!cuota) return res.status(404).json({ error: 'Cuota no encontrada.' });

  db.prepare('UPDATE cuotas SET mora = ? WHERE id = ?').run(mora, req.params.id);

  const updated = db.prepare('SELECT * FROM cuotas WHERE id = ?').get(req.params.id);
  res.json(updated);
}

module.exports = { getByVenta, getPendientes, updateMora };
