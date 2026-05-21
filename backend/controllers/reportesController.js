const { getDatabase } = require('../database');

function getDashboard(req, res) {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekEnd = weekFromNow.toISOString().split('T')[0];

  const proyectos = db.prepare(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as activos
    FROM proyectos
  `).get();

  const lotes = db.prepare(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) as disponibles,
           SUM(CASE WHEN estado = 'vendido' THEN 1 ELSE 0 END) as vendidos,
           SUM(CASE WHEN estado = 'reservado' THEN 1 ELSE 0 END) as reservados
    FROM lotes
  `).get();

  const clientes = db.prepare('SELECT COUNT(*) as total FROM clientes').get();

  const cobrosHoy = db.prepare(`
    SELECT COALESCE(SUM(monto_pagado), 0) as total, COUNT(*) as cantidad
    FROM pagos WHERE fecha_pago = ?
  `).get(today);

  const cuotasVencidas = db.prepare(`
    SELECT COUNT(*) as total
    FROM cuotas WHERE estado IN ('vencido', 'pendiente') AND fecha_vencimiento < ?
  `).get(today);

  db.prepare(`
    UPDATE cuotas SET estado = 'vencido'
    WHERE estado = 'pendiente' AND fecha_vencimiento < ?
  `).run(today);

  const ultimosPagos = db.prepare(`
    SELECT p.*, cu.numero_cuota, cu.venta_id,
           c.nombre as cliente_nombre, l.codigo as lote_codigo
    FROM pagos p
    JOIN cuotas cu ON cu.id = p.cuota_id
    JOIN ventas v ON v.id = cu.venta_id
    JOIN clientes c ON c.id = v.cliente_id
    JOIN lotes l ON l.id = v.lote_id
    ORDER BY p.id DESC LIMIT 5
  `).all();

  const cuotasVencenSemana = db.prepare(`
    SELECT cu.*, c.nombre as cliente_nombre, l.codigo as lote_codigo,
           p.nombre as proyecto_nombre
    FROM cuotas cu
    JOIN ventas v ON v.id = cu.venta_id
    JOIN clientes c ON c.id = v.cliente_id
    JOIN lotes l ON l.id = v.lote_id
    JOIN proyectos p ON p.id = l.proyecto_id
    WHERE cu.estado = 'pendiente'
      AND cu.fecha_vencimiento BETWEEN ? AND ?
    ORDER BY cu.fecha_vencimiento ASC
  `).all(today, weekEnd);

  res.json({
    proyectos: { total: proyectos.total, activos: proyectos.activos },
    lotes: { total: lotes.total, disponibles: lotes.disponibles, vendidos: lotes.vendidos, reservados: lotes.reservados },
    clientes: clientes.total,
    cobros_hoy: { total: cobrosHoy.total, cantidad: cobrosHoy.cantidad },
    cuotas_vencidas: cuotasVencidas.total,
    ultimos_pagos: ultimosPagos,
    cuotas_vencen_semana: cuotasVencenSemana,
  });
}

function reporteCobros(req, res) {
  const db = getDatabase();
  const { desde, hasta } = req.query;

  if (!desde || !hasta) {
    return res.status(400).json({ error: 'Fechas desde y hasta son requeridas.' });
  }

  const pagos = db.prepare(`
    SELECT p.*, cu.numero_cuota, cu.venta_id,
           c.nombre as cliente_nombre, c.dni as cliente_dni,
           l.codigo as lote_codigo, pro.nombre as proyecto_nombre
    FROM pagos p
    JOIN cuotas cu ON cu.id = p.cuota_id
    JOIN ventas v ON v.id = cu.venta_id
    JOIN clientes c ON c.id = v.cliente_id
    JOIN lotes l ON l.id = v.lote_id
    JOIN proyectos pro ON pro.id = l.proyecto_id
    WHERE p.fecha_pago BETWEEN ? AND ?
    ORDER BY p.fecha_pago DESC
  `).all(desde, hasta);

  const total = pagos.reduce((sum, p) => sum + (p.monto_pagado || 0), 0);
  const totalMora = pagos.reduce((sum, p) => sum + (p.mora_cobrada || 0), 0);

  res.json({ pagos, total, totalMora, desde, hasta });
}

function reporteLotes(req, res) {
  const db = getDatabase();
  const lotes = db.prepare(`
    SELECT l.*, p.nombre as proyecto_nombre, p.ubicacion as proyecto_ubicacion
    FROM lotes l
    JOIN proyectos p ON p.id = l.proyecto_id
    WHERE l.estado = 'disponible'
    ORDER BY p.nombre, l.codigo
  `).all();

  res.json(lotes);
}

function reporteCliente(req, res) {
  const db = getDatabase();
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });

  const ventas = db.prepare(`
    SELECT v.*, l.codigo as lote_codigo, l.nombre as lote_nombre,
           p.nombre as proyecto_nombre
    FROM ventas v
    JOIN lotes l ON l.id = v.lote_id
    JOIN proyectos p ON p.id = l.proyecto_id
    WHERE v.cliente_id = ?
    ORDER BY v.fecha_venta DESC
  `).all(req.params.id);

  for (const venta of ventas) {
    venta.cuotas = db.prepare(`
      SELECT * FROM cuotas WHERE venta_id = ? ORDER BY numero_cuota ASC
    `).all(venta.id);

    venta.total_pagado = venta.cuotas.reduce((s, c) => s + (c.monto_pagado || 0), 0);
    venta.saldo_pendiente = Math.max(0, (venta.precio_acordado || 0) - (venta.cuota_inicial || 0) - venta.total_pagado);
    venta.cuotas_pendientes = venta.cuotas.filter(c => c.estado !== 'pagado').length;
    venta.cuotas_vencidas = venta.cuotas.filter(c => c.estado === 'vencido').length;
  }

  res.json({ cliente, ventas });
}

function reporteMorosos(req, res) {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    UPDATE cuotas SET estado = 'vencido'
    WHERE estado = 'pendiente' AND fecha_vencimiento < ?
  `).run(today);

  const morosos = db.prepare(`
    SELECT DISTINCT c.id, c.nombre, c.dni, c.telefono,
           (SELECT COUNT(*) FROM cuotas cu
            JOIN ventas v ON v.id = cu.venta_id
            WHERE v.cliente_id = c.id AND cu.estado = 'vencido') as cuotas_vencidas,
           (SELECT COALESCE(SUM(cu.monto + cu.mora - cu.monto_pagado), 0)
            FROM cuotas cu JOIN ventas v ON v.id = cu.venta_id
            WHERE v.cliente_id = c.id AND cu.estado IN ('vencido', 'pendiente')) as deuda_total
    FROM clientes c
    WHERE EXISTS (
      SELECT 1 FROM ventas v
      JOIN cuotas cu ON cu.venta_id = v.id
      WHERE v.cliente_id = c.id AND cu.estado = 'vencido'
    )
    ORDER BY deuda_total DESC
  `).all();

  res.json(morosos);
}

module.exports = { getDashboard, reporteCobros, reporteLotes, reporteCliente, reporteMorosos };
