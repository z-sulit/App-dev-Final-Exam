import { useEffect, useRef, useState } from 'react';
import { createPost, loginUser, registerUser, updatePost } from '../api/client';

export default function WorkspacePanel({
  user,
  editingPost,
  onCancelEdit,
  onAuthSuccess,
  onPostSaved,
  onStatus,
}) {
  const [tab, setTab] = useState('login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('author');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const tabsRef = useRef(null);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el || user) return undefined;
    const handleTabChange = (e) => {
      const nextTab = e.detail?.value === 'register' ? 'register' : 'login';
      setTab(nextTab);
      setFeedback(null);
    };
    el.addEventListener('change', handleTabChange);
    return () => el.removeEventListener('change', handleTabChange);
  }, [user]);

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || '');
      setContent(editingPost.content || '');
      setFeedback(null);
    } else {
      setTitle('');
      setContent('');
    }
  }, [editingPost]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const data = await loginUser({ username: loginUsername, password: loginPassword });
      setLoginPassword('');
      onAuthSuccess(data.user);
      onStatus(`Signed in as ${data.user.username} (${data.user.role})`, false);
    } catch (err) {
      setFeedback({ text: err.message, isError: true });
      onStatus(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await registerUser({
        email: regEmail,
        username: regUsername,
        password: regPassword,
        role: regRole,
      });
      setLoginUsername(regUsername);
      setRegEmail('');
      setRegUsername('');
      setRegPassword('');
      setTab('login');
      const msg = 'Account registered. Sign in below.';
      setFeedback({ text: msg, isError: false });
      onStatus(msg, false);
    } catch (err) {
      setFeedback({ text: err.message, isError: true });
      onStatus(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      if (editingPost) {
        await updatePost(editingPost.id, { title, content });
        onStatus(`Updated dispatch #${editingPost.id}`, false);
        onCancelEdit();
      } else {
        const created = await createPost({ title, content });
        setTitle('');
        setContent('');
        onStatus(`Published dispatch #${created.id}`, false);
      }
      await onPostSaved();
    } catch (err) {
      setFeedback({ text: err.message, isError: true });
      onStatus(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <aside className="hero-interactive-card" id="interactive-workspace">
        <div className="panel-header-tabbed">
          <sakuga-tabs
            ref={tabsRef}
            label="Account Access"
            selected={tab === 'register' ? '1' : '0'}
          >
            <option value="login">Log In</option>
            <option value="register">Register</option>
          </sakuga-tabs>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Auth Server :4000
          </span>
        </div>

        {feedback && (
          <div className={`panel-feedback${feedback.isError ? ' error' : ''}`} style={{ marginBottom: '1rem' }}>
            {feedback.text}
          </div>
        )}

        {tab === 'login' ? (
          <form className="form-stack" onSubmit={handleLogin}>
            <div className="form-field">
              <label className="form-label" htmlFor="login-username">
                Username or Email
              </label>
              <input
                type="text"
                id="login-username"
                className="form-input"
                required
                placeholder="e.g. author1"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <input
                type="password"
                id="login-password"
                className="form-input"
                required
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-bento-primary" disabled={submitting}>
              <span>{submitting ? 'Signing In...' : 'Sign In to Account'}</span>
            </button>
          </form>
        ) : (
          <form className="form-stack" onSubmit={handleRegister}>
            <div className="form-field">
              <label className="form-label" htmlFor="reg-email">
                Email
              </label>
              <input
                type="email"
                id="reg-email"
                className="form-input"
                required
                placeholder="you@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="reg-username">
                Username
              </label>
              <input
                type="text"
                id="reg-username"
                className="form-input"
                required
                placeholder="Choose a handle"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="reg-password">
                Password
              </label>
              <input
                type="password"
                id="reg-password"
                className="form-input"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="reg-role">
                Role Permission
              </label>
              <select
                id="reg-role"
                className="form-input"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
              >
                <option value="reader">Reader (Read-Only)</option>
                <option value="author">Author (Read &amp; Create/Edit Own)</option>
                <option value="admin">Admin (Full System Authority)</option>
              </select>
            </div>
            <button type="submit" className="btn-bento-primary" disabled={submitting}>
              <span>{submitting ? 'Registering...' : 'Register Account'}</span>
            </button>
          </form>
        )}
      </aside>
    );
  }

  if (user.role === 'reader') {
    return (
      <aside className="hero-interactive-card" id="interactive-workspace">
        <div
          className="form-stack"
          style={{ justifyContent: 'center', textAlign: 'center', height: '100%' }}
        >
          <span
            className="role-pill-indicator"
            style={{ width: 'fit-content', margin: '0 auto' }}
          >
            READ-ONLY
          </span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            Reader Account Active
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            You have read-only privileges. To publish new dispatches, switch to an{' '}
            <strong>author</strong> or <strong>admin</strong> account.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hero-interactive-card" id="interactive-workspace">
      <form className="form-stack" onSubmit={handleSavePost}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
          }}
        >
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>
            {editingPost ? `Edit Dispatch #${editingPost.id}` : 'Compose Dispatch'}
          </span>
          {editingPost && (
            <button type="button" className="action-link" onClick={onCancelEdit}>
              Cancel
            </button>
          )}
        </div>

        {feedback && (
          <div className={`panel-feedback${feedback.isError ? ' error' : ''}`}>
            {feedback.text}
          </div>
        )}

        <div className="form-field">
          <label className="form-label" htmlFor="editor-post-title">
            Headline
          </label>
          <input
            type="text"
            id="editor-post-title"
            className="form-input"
            required
            maxLength={255}
            placeholder="Dispatch headline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="editor-post-content">
            Dispatch Body
          </label>
          <textarea
            id="editor-post-content"
            className="form-input"
            rows={4}
            required
            placeholder="Write your dispatch..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-bento-primary" disabled={submitting}>
          <span>
            {submitting
              ? 'Saving...'
              : editingPost
                ? `Update Dispatch #${editingPost.id}`
                : 'Publish to Blog API (:5000)'}
          </span>
        </button>
      </form>
    </aside>
  );
}
