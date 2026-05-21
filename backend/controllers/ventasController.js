const { getDatabase } = require('../database');
const { generarCronograma } = require('../utils/cronograma');

function getAll(req, res) {
  const db = getDatabase();
  const ventas = db.prepare(`
    SELECT v.*, c.nombre as cliente_nombre, c.dni as cliente_dni,
           l.codigo as lote_codigo, l.nombre as lote_nombre,
           p.nombre as proyecto_nombre, p.id as proyecto_id
    FROM ventas v
    JOIN clientes c ON c.id = v.cliente_id
    JOIN lotes l ON l.id = v.lote_id
    JOIN proyectos p ON p.id = l.proyecto_id
    ORDER BY v.fecha_venta DESC
  `).all();
  res.json(ventas);
}

function getById(req, res) {
  const db = getDatabase();
  const venta = db.prepare(`
    SELECT v.*, c.nombre as cliente_nombre, c.dni as cliente_dni, c.telefono as cliente_telefono,
           l.codigo as lote_codigo, l.nombre as lote_nombre, l.area_m2, l.precio_total as lote_precio,
           p.nombre as proyecto_nombre, p.ubicacion as proyecto_ubicacion
    FROM ventas v
    JOIN clientes c ON c.id = v.cliente_id
    JOIN lotes l ON l.id = v.lote_id
    JOIN proyectos p ON p.id = l.proyecto_id
    WHERE v.id = ?
  `).get(req.params.id);

  if (!venta) return res.status(404).json({ error: 'Venta no encontrada.' });

  const cuotas = db.prepare(
    'SELECT * FROM cuotas WHERE venta_id = ? ORDER BY numero_cuota ASC'
  ).all(req.params.id);

  res.json({ ...venta, cuotas });
}

function create(req, res) {
  const {
    lote_id, cliente_id, precio_acordado, cuota_inicial,
    tipo_pago, frecuencia_cuota, num_cuotas, fecha_venta, observaciones
  } = req.body;

  if (!lote_id || !cliente_id || !precio_acordado || !tipo_pago) {
    return res.status(400).json({ error: 'Lote, cliente, precio acordado y tipo de pago son requeridos.' });
  }

  const db = getDatabase();

  const lote = db.prepare('SELECT * FROM lotes WHERE id = ?').get(lote_id);
  if (!lote) return res.status(404).json({ error: 'Lote no encontrado.' });
  if (lote.estado === 'vendido') return res.status(400).json({ error: 'El lote ya está vendido.' });

  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(cliente_id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });

  let monto_cuota = 0;
  if (tipo_pago === 'credito') {
    if (!num_cuotas || num_cuotas < 1) {
      return res.status(400).json({ error: 'Número de cuotas requerido para crédito.' });
    }
    const saldo = precio_acordado - (cuota_inicial || 0);
    monto_cuota = parseFloat((saldo / num_cuotas).toFixed(2));
  }

  const result = db.prepare(`
    INSERT INTO ventas (lote_id, cliente_id, precio_acordado, cuota_inicial, tipo_pago, frecuencia_cuota, num_cuotas, monto_cuota, fecha_venta, observaciones)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    lote_id, cliente_id, precio_acordado, cuota_inicial || 0,
    tipo_pago, frecuencia_cuota || '', num_cuotas || 0,
    monto_cuota, fecha_venta || new Date().toISOString().split('T')[0],
    observaciones || ''
  );

  const ventaId = result.lastInsertRowid;
  const venta = db.prepare('SELECT * FROM ventas WHERE id = ?').get(ventaId);

  if (tipo_pago === 'credito' && num_cuotas > 0) {
    const cuotas = generarCronograma({
      id: ventaId,
      precio_acordado,
      cuota_inicial: cuota_inicial || 0,
      num_cuotas,
      frecuencia_cuota,
      fecha_venta: fecha_venta || new Date().toISOString().split('T')[0]
    });

    const insert = db.prepare(`
      INSERT INTO cuotas (venta_id, numero_cuota, fecha_vencimiento, monto, monto_pagado, mora, estado)
      VALUES (@venta_id, @numero_cuota, @fecha_vencimiento, @monto, @monto_pagado, @mora, @estado)
    `);

    const insertMany = db.transaction((cuotas) => {
      for (const cuota of cuotas) {
        insert.run(cuota);
      }
    });

    insertMany(cuotas);
  }

  db.prepare("UPDATE lotes SET estado = 'vendido' WHERE id = ?").run(lote_id);

  const ventaCompleta = db.prepare(`
    SELECT v.*, c.nombre as cliente_nombre, l.codigo as lote_codigo
    FROM ventas v
    JOIN clientes c ON c.id = v.cliente_id
    JOIN lotes l ON l.id = v.lote_id
    WHERE v.id = ?
  `).get(ventaId);

  res.status(201).json(ventaCompleta);
}

module.exports = { getAll, getById, create };
