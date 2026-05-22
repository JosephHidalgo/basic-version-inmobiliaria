const { getDatabase } = require('../database');

function getAll(req, res) {
  const db = getDatabase();
  const proyectos = db.prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM lotes WHERE proyecto_id = p.id) as total_lotes,
    (SELECT COUNT(*) FROM lotes WHERE proyecto_id = p.id AND estado = 'disponible') as lotes_disponibles
    FROM proyectos p ORDER BY p.fecha_creacion DESC
  `).all();
  res.json(proyectos);
}

function getById(req, res) {
  const db = getDatabase();
  const proyecto = db.prepare('SELECT * FROM proyectos WHERE id = ?').get(req.params.id);
  if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado.' });
  res.json(proyecto);
}

function create(req, res) {
  const { nombre, descripcion, ubicacion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre del proyecto es requerido.' });

  const db = getDatabase();
  const result = db.prepare(
    'INSERT INTO proyectos (nombre, descripcion, ubicacion) VALUES (?, ?, ?)'
  ).run(nombre, descripcion || '', ubicacion || '');

  const proyecto = db.prepare('SELECT * FROM proyectos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(proyecto);
}

function update(req, res) {
  const { nombre, descripcion, ubicacion, estado } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre del proyecto es requerido.' });

  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM proyectos WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Proyecto no encontrado.' });

  db.prepare(
    'UPDATE proyectos SET nombre = ?, descripcion = ?, ubicacion = ?, estado = ? WHERE id = ?'
  ).run(nombre, descripcion || '', ubicacion || '', estado || 'activo', req.params.id);

  const proyecto = db.prepare('SELECT * FROM proyectos WHERE id = ?').get(req.params.id);
  res.json(proyecto);
}

function remove(req, res) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM proyectos WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Proyecto no encontrado.' });

  const removeTransaction = db.transaction((proyectoId) => {
    db.prepare(`
      DELETE FROM pagos WHERE cuota_id IN (
        SELECT c.id FROM cuotas c
        JOIN ventas v ON c.venta_id = v.id
        JOIN lotes l ON v.lote_id = l.id
        WHERE l.proyecto_id = ?
      )
    `).run(proyectoId);

    db.prepare(`
      DELETE FROM cuotas WHERE venta_id IN (
        SELECT v.id FROM ventas v
        JOIN lotes l ON v.lote_id = l.id
        WHERE l.proyecto_id = ?
      )
    `).run(proyectoId);

    db.prepare(`
      DELETE FROM ventas WHERE lote_id IN (
        SELECT id FROM lotes WHERE proyecto_id = ?
      )
    `).run(proyectoId);

    db.prepare('DELETE FROM proyectos WHERE id = ?').run(proyectoId);
  });

  removeTransaction(req.params.id);
  res.json({ message: 'Proyecto eliminado correctamente.' });
}

module.exports = { getAll, getById, create, update, remove };
