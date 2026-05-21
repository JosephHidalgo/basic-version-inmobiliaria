const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'database.db');

let db;

function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    seedData();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nombre_completo TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS proyectos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT DEFAULT '',
      ubicacion TEXT DEFAULT '',
      estado TEXT DEFAULT 'activo',
      fecha_creacion TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS lotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proyecto_id INTEGER NOT NULL,
      codigo TEXT NOT NULL,
      nombre TEXT DEFAULT '',
      area_m2 REAL DEFAULT 0,
      precio_total REAL DEFAULT 0,
      estado TEXT DEFAULT 'disponible',
      descripcion TEXT DEFAULT '',
      FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      dni TEXT UNIQUE,
      telefono TEXT DEFAULT '',
      email TEXT DEFAULT '',
      direccion TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lote_id INTEGER NOT NULL,
      cliente_id INTEGER NOT NULL,
      precio_acordado REAL DEFAULT 0,
      cuota_inicial REAL DEFAULT 0,
      tipo_pago TEXT DEFAULT 'contado',
      frecuencia_cuota TEXT DEFAULT '',
      num_cuotas INTEGER DEFAULT 0,
      monto_cuota REAL DEFAULT 0,
      fecha_venta TEXT DEFAULT (date('now')),
      estado TEXT DEFAULT 'activo',
      observaciones TEXT DEFAULT '',
      FOREIGN KEY (lote_id) REFERENCES lotes(id),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );

    CREATE TABLE IF NOT EXISTS cuotas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL,
      numero_cuota INTEGER NOT NULL,
      fecha_vencimiento TEXT NOT NULL,
      monto REAL DEFAULT 0,
      monto_pagado REAL DEFAULT 0,
      mora REAL DEFAULT 0,
      estado TEXT DEFAULT 'pendiente',
      FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cuota_id INTEGER NOT NULL,
      monto_pagado REAL DEFAULT 0,
      mora_cobrada REAL DEFAULT 0,
      fecha_pago TEXT DEFAULT (date('now')),
      metodo_pago TEXT DEFAULT 'efectivo',
      numero_recibo TEXT,
      observaciones TEXT DEFAULT '',
      FOREIGN KEY (cuota_id) REFERENCES cuotas(id)
    );
  `);
}

function seedData() {
  const count = db.prepare('SELECT COUNT(*) as count FROM usuarios').get();
  if (count.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(
      'INSERT INTO usuarios (username, password, nombre_completo) VALUES (?, ?, ?)'
    ).run('admin', hashedPassword, 'Administrador');
    console.log('Usuario admin creado por defecto (admin / admin123)');
  }
}

module.exports = { getDatabase };
