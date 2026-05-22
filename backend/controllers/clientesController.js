const { getDatabase } = require('../database');

function getAll(req, res) {
  const db = getDatabase();
  const { search } = req.query;
  let clientes;
  if (search) {
    clientes = db.prepare(
      'SELECT * FROM clientes WHERE nombre LIKE ? OR dni LIKE ? ORDER BY nombre ASC'
    ).all(`%${search}%`, `%${search}%`);
  } else {
    clientes = db.prepare('SELECT * FROM clientes ORDER BY nombre ASC').all();
  }
  res.json(clientes);
}

function getById(req, res) {
  const db = getDatabase();
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
  res.json(cliente);
}

function create(req, res) {
  const { nombre, dni, telefono, email, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre del cliente es requerido.' });
  if (!dni) return res.status(400).json({ error: 'El DNI del cliente es requerido.' });

  const db = getDatabase();
  const existingDni = db.prepare('SELECT id FROM clientes WHERE dni = ?').get(dni);
  if (existingDni) return res.status(400).json({ error: 'Ya existe un cliente con ese DNI.' });

  const result = db.prepare(
    'INSERT INTO clientes (nombre, dni, telefono, email, direccion) VALUES (?, ?, ?, ?, ?)'
  ).run(nombre, dni, telefono || '', email || '', direccion || '');

  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(cliente);
}

function update(req, res) {
  const { nombre, dni, telefono, email, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre del cliente es requerido.' });

  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Cliente no encontrado.' });

  if (dni && dni !== existing.dni) {
    const dup = db.prepare('SELECT id FROM clientes WHERE dni = ? AND id != ?').get(dni, req.params.id);
    if (dup) return res.status(400).json({ error: 'Ya existe otro cliente con ese DNI.' });
  }

  db.prepare(
    'UPDATE clientes SET nombre = ?, dni = ?, telefono = ?, email = ?, direccion = ? WHERE id = ?'
  ).run(nombre, dni || '', telefono || '', email || '', direccion || '', req.params.id);

  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  res.json(cliente);
}

function remove(req, res) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Cliente no encontrado.' });

  const removeTransaction = db.transaction((clienteId) => {
    db.prepare(`
      DELETE FROM pagos WHERE cuota_id IN (
        SELECT c.id FROM cuotas c
        JOIN ventas v ON c.venta_id = v.id
        WHERE v.cliente_id = ?
      )
    `).run(clienteId);

    db.prepare(`
      DELETE FROM ventas WHERE cliente_id = ?
    `).run(clienteId);

    db.prepare('DELETE FROM clientes WHERE id = ?').run(clienteId);
  });

  removeTransaction(req.params.id);
  res.json({ message: 'Cliente eliminado correctamente.' });
}

module.exports = { getAll, getById, create, update, remove };
