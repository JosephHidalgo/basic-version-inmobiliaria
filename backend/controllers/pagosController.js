const { getDatabase } = require('../database');
const { generarRecibo } = require('../utils/pdf');

function generateReciboNumber(db) {
  const last = db.prepare(
    "SELECT numero_recibo FROM pagos WHERE numero_recibo LIKE 'REC-%' ORDER BY id DESC LIMIT 1"
  ).get();

  if (!last) return 'REC-0001';

  const num = parseInt(last.numero_recibo.split('-')[1], 10);
  const next = num + 1;
  return `REC-${String(next).padStart(4, '0')}`;
}

function create(req, res) {
  const { cuota_id, monto_pagado, mora_cobrada, metodo_pago, observaciones } = req.body;

  if (!cuota_id || !monto_pagado || monto_pagado <= 0) {
    return res.status(400).json({ error: 'Cuota y monto a pagar son requeridos.' });
  }

  const db = getDatabase();

  const cuota = db.prepare(`
    SELECT cu.*, v.precio_acordado, v.cuota_inicial, v.num_cuotas, v.tipo_pago,
           c.nombre as cliente_nombre, c.dni as cliente_dni, c.telefono as cliente_telefono,
           l.codigo as lote_codigo, l.nombre as lote_nombre, l.area_m2,
           p.nombre as proyecto_nombre, p.ubicacion as proyecto_ubicacion
    FROM cuotas cu
    JOIN ventas v ON v.id = cu.venta_id
    JOIN clientes c ON c.id = v.cliente_id
    JOIN lotes l ON l.id = v.lote_id
    JOIN proyectos p ON p.id = l.proyecto_id
    WHERE cu.id = ?
  `).get(cuota_id);

  if (!cuota) return res.status(404).json({ error: 'Cuota no encontrada.' });

  const numero_recibo = generateReciboNumber(db);
  const moraFinal = mora_cobrada !== undefined ? parseFloat(mora_cobrada) : (cuota.mora || 0);
  const monto = parseFloat(monto_pagado);
  const principalPagado = monto;

  const result = db.prepare(`
    INSERT INTO pagos (cuota_id, monto_pagado, mora_cobrada, fecha_pago, metodo_pago, numero_recibo, observaciones)
    VALUES (?, ?, ?, date('now'), ?, ?, ?)
  `).run(cuota_id, monto, moraFinal, metodo_pago || 'efectivo', numero_recibo, observaciones || '');

  const nuevoPagado = parseFloat(((cuota.monto_pagado || 0) + principalPagado).toFixed(2));
  const totalCuota = parseFloat((cuota.monto || 0).toFixed(2));

  let nuevoEstado;
  if (nuevoPagado >= totalCuota) {
    nuevoEstado = 'pagado';
  } else if (nuevoPagado > 0) {
    nuevoEstado = 'parcial';
  } else {
    nuevoEstado = 'pendiente';
  }

  db.prepare('UPDATE cuotas SET monto_pagado = ?, estado = ? WHERE id = ?')
    .run(nuevoPagado, nuevoEstado, cuota_id);

  const pago = db.prepare('SELECT * FROM pagos WHERE id = ?').get(result.lastInsertRowid);

  const totalPagadoVenta = db.prepare(
    'SELECT COALESCE(SUM(monto_pagado), 0) as total FROM cuotas WHERE venta_id = ?'
  ).get(cuota.venta_id).total;

  const venta = { num_cuotas: cuota.num_cuotas, tipo_pago: cuota.tipo_pago, precio_acordado: cuota.precio_acordado, cuota_inicial: cuota.cuota_inicial };
  const lote = { codigo: cuota.lote_codigo, nombre: cuota.lote_nombre, area_m2: cuota.area_m2 };
  const proyecto = { nombre: cuota.proyecto_nombre, ubicacion: cuota.proyecto_ubicacion };
  const cliente = { nombre: cuota.cliente_nombre, dni: cuota.cliente_dni, telefono: cuota.cliente_telefono };
  const cuotaData = { numero_cuota: cuota.numero_cuota, monto: cuota.monto, monto_pagado: nuevoPagado, mora: cuota.mora };

  let reciboArchivo = null;
  try {
    reciboArchivo = generarRecibo(pago, cuotaData, venta, lote, proyecto, cliente, totalPagadoVenta);
  } catch (err) {
    console.error('Error generando PDF:', err.message);
  }

  res.status(201).json({
    ...pago,
    recibo_generado: !!reciboArchivo,
    recibo_archivo: reciboArchivo,
    cuota_estado_actualizado: nuevoEstado,
    cuota_total_pagado: nuevoPagado
  });
}

function getByCuota(req, res) {
  const db = getDatabase();
  const pagos = db.prepare(
    'SELECT * FROM pagos WHERE cuota_id = ? ORDER BY fecha_pago DESC'
  ).all(req.params.cuotaId);
  res.json(pagos);
}

function getRecibo(req, res) {
  const db = getDatabase();
  const pago = db.prepare('SELECT * FROM pagos WHERE id = ?').get(req.params.id);
  if (!pago) return res.status(404).json({ error: 'Pago no encontrado.' });

  const filePath = require('path').join(__dirname, '..', 'recibos', `${pago.numero_recibo}.pdf`);

  if (!require('fs').existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo de recibo no encontrado.' });
  }

  res.download(filePath, `${pago.numero_recibo}.pdf`);
}

function getAll(req, res) {
  const db = getDatabase();
  const { venta_id, limit } = req.query;

  let query = `
    SELECT p.*, cu.numero_cuota, cu.venta_id,
           c.nombre as cliente_nombre, c.dni as cliente_dni,
           l.codigo as lote_codigo,
           pro.nombre as proyecto_nombre
    FROM pagos p
    JOIN cuotas cu ON cu.id = p.cuota_id
    JOIN ventas v ON v.id = cu.venta_id
    JOIN clientes c ON c.id = v.cliente_id
    JOIN lotes l ON l.id = v.lote_id
    JOIN proyectos pro ON pro.id = l.proyecto_id
  `;

  const params = [];
  if (venta_id) {
    query += ' WHERE cu.venta_id = ?';
    params.push(venta_id);
  }

  query += ' ORDER BY p.fecha_pago DESC, p.id DESC';

  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit));
  }

  const pagos = db.prepare(query).all(...params);
  res.json(pagos);
}

module.exports = { create, getByCuota, getRecibo, getAll };
