const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database');

function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
  }

  const db = getDatabase();
  const user = db.prepare('SELECT * FROM usuarios WHERE username = ?').get(username);

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, nombre: user.nombre_completo },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      nombre: user.nombre_completo
    }
  });
}

function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Contraseña actual y nueva requeridas.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }

  const db = getDatabase();
  const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(userId);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  const validPassword = bcrypt.compareSync(currentPassword, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Contraseña actual incorrecta.' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE usuarios SET password = ? WHERE id = ?').run(hashedPassword, userId);

  res.json({ message: 'Contraseña actualizada correctamente.' });
}

function getProfile(req, res) {
  const db = getDatabase();
  const user = db.prepare('SELECT id, username, nombre_completo, created_at FROM usuarios WHERE id = ?').get(req.user.id);
  res.json(user);
}

module.exports = { login, changePassword, getProfile };
