const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getMyPosts,
} = require('../controllers/postController');

const router = express.Router();

router.get('/api/posts', getAllPosts);
router.get('/api/posts/:id', getPostById);
router.post('/api/posts', authenticate, authorize('author', 'admin'), createPost);
router.put('/api/posts/:id', authenticate, updatePost);
router.delete('/api/posts/:id', authenticate, authorize('admin'), deletePost);
router.get('/api/me/posts', authenticate, getMyPosts);

module.exports = router;
