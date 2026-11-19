import { useEffect, useState } from 'react';
import { fetchPostById } from '../api/client';

function formatTimestamp(iso) {
  if (!iso) return 'N/A';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? String(iso) : date.toLocaleString();
}

export default function PostDetailModal({
  postId,
  user,
  onClose,
  onEdit,
  onDelete,
}) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postId) return undefined;
    let active = true;
    setLoading(true);
    setError(null);
    setPost(null);

    fetchPostById(postId)
      .then((data) => {
        if (active) setPost(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [postId]);

  useEffect(() => {
    if (!postId) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [postId, onClose]);

  if (!postId) return null;

  const canEdit = Boolean(
    post && user && (user.id === post.author_id || user.role === 'admin')
  );
  const canDelete = Boolean(post && user && user.role === 'admin');

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-post-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <span>POST #{postId}</span>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="modal-body">
          {loading && <p style={{ color: 'var(--text-muted)' }}>Loading dispatch...</p>}
          {error && <div className="panel-feedback error">{error}</div>}
          {post && (
            <>
              <span className="author-pill-tag">@{post.author_username}</span>
              <h2 id="modal-post-title" className="modal-title">
                {post.title}
              </h2>
              <div className="modal-meta">
                <span>Created: {formatTimestamp(post.created_at)}</span>
                <span>Updated: {formatTimestamp(post.updated_at)}</span>
              </div>
              <p className="modal-content">{post.content}</p>
            </>
          )}
        </div>

        {post && (canEdit || canDelete) && (
          <div className="modal-footer">
            <div style={{ display: 'flex', gap: '16px' }}>
              {canEdit && (
                <button
                  type="button"
                  className="action-link"
                  onClick={() => {
                    onEdit(post);
                    onClose();
                  }}
                >
                  Edit Post
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  className="action-link action-link-danger"
                  onClick={() => {
                    onDelete(post.id);
                    onClose();
                  }}
                >
                  Delete Post
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
