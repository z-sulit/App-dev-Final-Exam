const crypto = require('crypto');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../db');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ['reader', 'author', 'admin'];

const sha256 = (str) => crypto.createHash('sha256').update(str).digest('hex');

const signAccessToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

const register = async (req, res) => {
  const { email, username, password, role } = req.body || {};

  if (
    typeof email !== 'string' ||
    !EMAIL_RE.test(email.trim()) ||
    typeof username !== 'string' ||
    username.trim().length === 0 ||
    typeof password !== 'string' ||
    password.length < 6 ||
    !VALID_ROLES.includes(role)
  ) {
    return res.status(400).json({ error: 'Invalid registration input' });
  }

  const cleanEmail = email.trim();
  const cleanUsername = username.trim();

  const [roles] = await pool.query('SELECT id FROM roles WHERE role = ? LIMIT 1', [role]);
  if (roles.length === 0) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const passwordHash = await bcryptjs.hash(password, 10);

  try {
    const [result] = await pool.query(
      'INSERT INTO users (email, username, password_hash, role_id) VALUES (?, ?, ?, ?)',
      [cleanEmail, cleanUsername, passwordHash, roles[0].id]
    );
    return res.status(201).json({
      message: 'User registered',
      user: { id: result.insertId, email: cleanEmail, username: cleanUsername, role },
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email or username already exists' });
    }
    throw err;
  }
};

const login = async (req, res) => {
  const { username, password } = req.body || {};

  if (
    typeof username !== 'string' ||
    username.trim().length === 0 ||
    typeof password !== 'string' ||
    password.length === 0
  ) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const identifier = username.trim();
  const [rows] = await pool.query(
    'SELECT u.id, u.email, u.username, u.password_hash, u.is_active, r.role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = ? OR u.email = ? LIMIT 1',
    [identifier, identifier]
  );

  const user = rows[0];
  if (!user || user.is_active !== 1 || !(await bcryptjs.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role, type: 'refresh', jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
    [user.id, sha256(refreshToken)]
  );

  return res.status(200).json({
    accessToken,
    refreshToken,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  });
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body || {};

  if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  if (!decoded || decoded.type !== 'refresh') {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const [rows] = await pool.query(
    'SELECT u.id, u.username, u.is_active, r.role FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id JOIN roles r ON u.role_id = r.id WHERE rt.token_hash = ? AND rt.revoked_at IS NULL AND rt.expires_at > NOW() LIMIT 1',
    [sha256(refreshToken)]
  );

  const row = rows[0];
  if (!row || row.is_active !== 1) {
    return res.status(401).json({ error: 'Refresh token revoked or expired' });
  }

  return res.status(200).json({ accessToken: signAccessToken(row) });
};

const logout = async (req, res) => {
  const { refreshToken } = req.body || {};

  if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }

  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL',
    [sha256(refreshToken)]
  );

  return res.status(200).json({ message: 'Logged out' });
};

module.exports = { register, login, refresh, logout };
