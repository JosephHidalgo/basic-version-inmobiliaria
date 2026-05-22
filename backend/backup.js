const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.db');
const BACKUP_DIR = path.join(__dirname, 'backups');

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function hacerBackup() {
  ensureBackupDir();

  if (!fs.existsSync(DB_PATH)) {
    console.log('No se encontró la base de datos para respaldar.');
    return null;
  }

  const now = new Date();
  const timestamp =
    String(now.getFullYear()) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + '_' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  const backupName = `database_${timestamp}.db`;
  const backupPath = path.join(BACKUP_DIR, backupName);

  try {
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`Backup creado: ${backupName}`);

    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('database_') && f.endsWith('.db'))
      .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);

    while (backups.length > 10) {
      const old = backups.pop();
      fs.unlinkSync(path.join(BACKUP_DIR, old.name));
      console.log(`Backup antiguo eliminado: ${old.name}`);
    }

    return backupName;
  } catch (err) {
    console.error('Error al crear backup:', err.message);
    return null;
  }
}

function listarBackups() {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('database_') && f.endsWith('.db'))
    .map(f => ({
      nombre: f,
      fecha: fs.statSync(path.join(BACKUP_DIR, f)).mtime,
      tamaño: fs.statSync(path.join(BACKUP_DIR, f)).size,
    }))
    .sort((a, b) => b.fecha - a.fecha);

  return files;
}

function getDbInfo() {
  const info = {
    ruta: DB_PATH,
    existe: fs.existsSync(DB_PATH),
    tamaño: null,
    ultima_modificacion: null,
    backups: BACKUP_DIR,
  };

  if (info.existe) {
    const stat = fs.statSync(DB_PATH);
    info.tamaño = stat.size;
    info.ultima_modificacion = stat.mtime;
  }

  return info;
}

module.exports = { hacerBackup, listarBackups, getDbInfo };
