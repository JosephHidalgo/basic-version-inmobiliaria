const { getDatabase } = require('../database');

function getByProyecto(req, res) {
  const db = getDatabase();
  const lotes = db.prepare(
    'SELECT * FROM lotes WHERE proyecto_id = ? ORDER BY codigo ASC'
  ).all(req.params.proyectoId);
  res.json(lotes);
}

function getById(req, res) {
  const db = getDatabase();
  const lote = db.prepare('SELECT * FROM lotes WHERE id = ?').get(req.params.id);
  if (!lote) return res.status(404).json({ error: 'Lote no encontrado.' });
  res.json(lote);
}

function create(req, res) {
  const { proyecto_id, codigo, nombre, area_m2, precio_total, estado, descripcion } = req.body;
  if (!proyecto_id || !codigo) {
    return res.status(400).json({ error: 'Proyecto y código son requeridos.' });
  }

  const db = getDatabase();
  const proyecto = db.prepare('SELECT * FROM proyectos WHERE id = ?').get(proyecto_id);
  if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado.' });

  const result = db.prepare(
    'INSERT INTO lotes (proyecto_id, codigo, nombre, area_m2, precio_total, estado, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(proyecto_id, codigo, nombre || '', area_m2 || 0, precio_total || 0, estado || 'disponible', descripcion || '');

  const lote = db.prepare('SELECT * FROM lotes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(lote);
}

function update(req, res) {
  const { codigo, nombre, area_m2, precio_total, estado, descripcion } = req.body;
  if (!codigo) return res.status(400).json({ error: 'El código del lote es requerido.' });

  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM lotes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Lote no encontrado.' });

  db.prepare(
    'UPDATE lotes SET codigo = ?, nombre = ?, area_m2 = ?, precio_total = ?, estado = ?, descripcion = ? WHERE id = ?'
  ).run(codigo, nombre || '', area_m2 || 0, precio_total || 0, estado || 'disponible', descripcion || '', req.params.id);

  const lote = db.prepare('SELECT * FROM lotes WHERE id = ?').get(req.params.id);
  res.json(lote);
}

function remove(req, res) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM lotes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Lote no encontrado.' });

  db.prepare('DELETE FROM lotes WHERE id = ?').run(req.params.id);
  res.json({ message: 'Lote eliminado correctamente.' });
}

module.exports = { getByProyecto, getById, create, update, remove };
