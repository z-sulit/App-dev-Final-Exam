const pool = require('../../db');

const POST_SELECT =
  'SELECT p.id, p.author_id, u.username AS author_username, p.title, p.content, p.created_at, p.updated_at FROM posts p JOIN users u ON p.author_id = u.id';

const parseId = (raw) => {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) {
    return null;
  }
  const n = Number(raw);
  return Number.isSafeInteger(n) ? n : null;
};

const getAllPosts = async (req, res) => {
  const [rows] = await pool.query(`${POST_SELECT} ORDER BY p.created_at DESC`);
  return res.status(200).json(rows);
};

const getPostById = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const [rows] = await pool.query(`${POST_SELECT} WHERE p.id = ? LIMIT 1`, [id]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Post not found' });
  }
  return res.status(200).json(rows[0]);
};

const createPost = async (req, res) => {
  const { title, content } = req.body || {};

  if (
    typeof title !== 'string' ||
    title.trim().length === 0 ||
    title.trim().length > 255 ||
    typeof content !== 'string' ||
    content.trim().length === 0
  ) {
    return res.status(400).json({ error: 'Valid title (<= 255 chars) and content are required' });
  }

  const [result] = await pool.query(
    'INSERT INTO posts (author_id, title, content) VALUES (?, ?, ?)',
    [req.user.id, title.trim(), content.trim()]
  );

  const [rows] = await pool.query(`${POST_SELECT} WHERE p.id = ? LIMIT 1`, [result.insertId]);
  return res.status(201).json(rows[0]);
};

const updatePost = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const { title, content } = req.body || {};
  const hasTitle = title !== undefined;
  const hasContent = content !== undefined;

  if (!hasTitle && !hasContent) {
    return res.status(400).json({ error: 'At least one of title or content is required' });
  }
  if (hasTitle && (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 255)) {
    return res.status(400).json({ error: 'Title must be a non-empty string up to 255 characters' });
  }
  if (hasContent && (typeof content !== 'string' || content.trim().length === 0)) {
    return res.status(400).json({ error: 'Content must be a non-empty string' });
  }

  const [existing] = await pool.query('SELECT id, author_id, title, content FROM posts WHERE id = ? LIMIT 1', [id]);
  const post = existing[0];
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (post.author_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const nextTitle = hasTitle ? title.trim() : post.title;
  const nextContent = hasContent ? content.trim() : post.content;

  await pool.query('UPDATE posts SET title = ?, content = ? WHERE id = ?', [nextTitle, nextContent, id]);

  const [rows] = await pool.query(`${POST_SELECT} WHERE p.id = ? LIMIT 1`, [id]);
  return res.status(200).json(rows[0]);
};

const deletePost = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Post not found' });
  }
  return res.status(200).json({ message: 'Post deleted' });
};

const getMyPosts = async (req, res) => {
  const [rows] = await pool.query(`${POST_SELECT} WHERE p.author_id = ? ORDER BY p.created_at DESC`, [
    req.user.id,
  ]);
  return res.status(200).json(rows);
};

module.exports = { getAllPosts, getPostById, createPost, updatePost, deletePost, getMyPosts };
