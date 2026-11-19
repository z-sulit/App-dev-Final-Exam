import { useCallback, useEffect, useState } from 'react';
import {
  deletePost,
  fetchMyPosts,
  fetchPosts,
  getStoredUser,
  logoutUser,
  refreshAccessToken,
} from './api/client';
import Navbar from './components/Navbar';
import PostDetailModal from './components/PostDetailModal';
import StatusBar from './components/StatusBar';
import WorkspacePanel from './components/WorkspacePanel';

const DEFAULT_STATUS = {
  message: 'Connected to Auth (:4000) & Blog API (:5000)',
  isError: false,
};

function makeExcerpt(text, maxLen = 160) {
  if (!text) return '';
  return text.length > maxLen ? `${text.slice(0, maxLen).trimEnd()}...` : text;
}

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [view, setView] = useState('all');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [refreshingToken, setRefreshingToken] = useState(false);

  const updateStatus = useCallback((message, isError = false) => {
    setStatus({ message, isError });
  }, []);

  const loadPosts = useCallback(async (targetView) => {
    setLoading(true);
    setError(null);
    try {
      const data = targetView === 'mine' ? await fetchMyPosts() : await fetchPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setPosts([]);
      setError(err.message);
      updateStatus(err.message, true);
    } finally {
      setLoading(false);
    }
  }, [updateStatus]);

  useEffect(() => {
    if (view === 'mine' && !user) {
      setView('all');
      return;
    }
    loadPosts(view);
  }, [view, user, loadPosts]);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setEditingPost(null);
      setView('all');
      updateStatus('Session expired. Signed out.', true);
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [updateStatus]);

  const scrollToWorkspace = useCallback(() => {
    const el = document.getElementById('interactive-workspace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const firstInput = el.querySelector('input, textarea');
      if (firstInput) firstInput.focus();
    }
  }, []);

  const handleSelectView = useCallback(
    (nextView) => {
      if (nextView === 'mine' && !user) {
        updateStatus('Please sign in to view your dispatches', true);
        scrollToWorkspace();
        return;
      }
      setView(nextView);
    },
    [user, updateStatus, scrollToWorkspace]
  );

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setEditingPost(null);
    setView('all');
    updateStatus('Logged out', false);
  };

  const handleRefreshToken = async () => {
    setRefreshingToken(true);
    try {
      await refreshAccessToken();
      updateStatus('Access token refreshed', false);
    } catch (err) {
      updateStatus(err.message, true);
    } finally {
      setRefreshingToken(false);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    scrollToWorkspace();
  };

  const handleDelete = async (postId) => {
    try {
      await deletePost(postId);
      if (editingPost && editingPost.id === postId) {
        setEditingPost(null);
      }
      updateStatus(`Deleted dispatch #${postId}`, false);
      await loadPosts(view);
    } catch (err) {
      updateStatus(err.message, true);
    }
  };

  return (
    <div id="top">
      <StatusBar
        status={status}
        user={user}
        refreshing={refreshingToken}
        onRefreshToken={handleRefreshToken}
      />

      <Navbar
        user={user}
        view={view}
        onSelectView={handleSelectView}
        onScrollToWorkspace={scrollToWorkspace}
        onLogout={handleLogout}
      />

      <main className="max-w-canvas">
        <section className="section-spacer hero-bento-grid">
          <article className="hero-primary-card">
            <div className="hero-title-block">
              <h1>BLOGBLOBLOG</h1>
              <p>
                Decoupled micro-blog platform with isolated JWT authentication and stateless post
                management.
              </p>
            </div>
            <div className="hero-cta-subgrid">
              <button
                type="button"
                className="bento-cta-card"
                onClick={() => {
                  handleSelectView('all');
                  document.getElementById('feed-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span className="cta-card-label">Browse Public Feed</span>
                <span className="arrow-box-lg">-&gt;</span>
              </button>
              <button
                type="button"
                className="bento-cta-card"
                onClick={scrollToWorkspace}
              >
                <span className="cta-card-label">
                  {user ? 'Open Workspace' : 'Account Access'}
                </span>
                <span className="arrow-box-lg">-&gt;</span>
              </button>
            </div>
          </article>

          <WorkspacePanel
            user={user}
            editingPost={editingPost}
            onCancelEdit={() => setEditingPost(null)}
            onAuthSuccess={(loggedInUser) => setUser(loggedInUser)}
            onPostSaved={() => loadPosts(view)}
            onStatus={updateStatus}
          />
        </section>

        <section className="section-spacer filter-row-container">
          <button
            type="button"
            className={`filter-pill-btn${view === 'all' ? ' active' : ''}`}
            onClick={() => handleSelectView('all')}
          >
            <span className="pill-square-indicator">01</span>
            <span className="filter-pill-title">All Dispatches (Public GET)</span>
          </button>

          <button
            type="button"
            className={`filter-pill-btn${view === 'mine' ? ' active' : ''}`}
            onClick={() => handleSelectView('mine')}
          >
            <span className="pill-square-indicator">02</span>
            <span className="filter-pill-title">My Dispatches (Auth GET)</span>
          </button>
        </section>

        <section className="section-spacer" id="feed-section">
          <div className="feed-header-row">
            <div>
              <h2 className="feed-heading">
                {view === 'mine' ? 'My Dispatches' : 'Our Dispatches'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Statelessly verified by Blog API (:5000)
              </p>
            </div>
            <button
              type="button"
              className="btn-feed-refresh"
              onClick={() => loadPosts(view)}
              disabled={loading}
            >
              <span>{loading ? 'Loading...' : 'Refresh Feed'}</span>
              <span>-&gt;</span>
            </button>
          </div>

          <div className="posts-bento-grid">
            {loading && (
              <div className="empty-state-bento">
                Loading dispatches from Blog API (:5000)...
              </div>
            )}

            {!loading && error && (
              <div className="empty-state-bento error-state-bento">{error}</div>
            )}

            {!loading && !error && posts.length === 0 && (
              <div className="empty-state-bento">
                {view === 'mine'
                  ? 'You have not published any dispatches yet.'
                  : 'No dispatches published yet.'}
              </div>
            )}

            {!loading &&
              !error &&
              posts.map((post) => {
                const canEdit = Boolean(
                  user && (user.id === post.author_id || user.role === 'admin')
                );
                const canDelete = Boolean(user && user.role === 'admin');
                const dateLabel = post.created_at
                  ? new Date(post.created_at).toLocaleDateString()
                  : '';

                return (
                  <article key={post.id} className="post-bento-card">
                    <div className="card-header-band">
                      <span>POST #{post.id}</span>
                      <span>{dateLabel}</span>
                    </div>
                    <div className="card-content-body">
                      <span className="author-pill-tag">@{post.author_username}</span>
                      <h3 className="post-card-title">
                        <button
                          type="button"
                          className="post-title-trigger"
                          onClick={() => setSelectedPostId(post.id)}
                        >
                          {post.title}
                        </button>
                      </h3>
                      <p className="post-card-excerpt">{makeExcerpt(post.content)}</p>
                      <div className="card-footer-actions">
                        <button
                          type="button"
                          className="action-link"
                          onClick={() => setSelectedPostId(post.id)}
                        >
                          Read Dispatch
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            className="action-link"
                            onClick={() => handleEdit(post)}
                          >
                            Edit Post
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            className="action-link action-link-danger"
                            onClick={() => handleDelete(post.id)}
                          >
                            Delete Post
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      </main>

      <footer className="footer-wrapper">
        <div className="max-w-canvas">
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Copyright 2026 BLOGBLOBLOG
          </p>
        </div>
      </footer>

      <PostDetailModal
        postId={selectedPostId}
        user={user}
        onClose={() => setSelectedPostId(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
