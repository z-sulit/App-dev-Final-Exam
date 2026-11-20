import { useEffect, useRef, useState } from 'react';
import { createPost, loginUser, registerUser, updatePost } from '../api/client';
import SakugaInput from './SakugaInput';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function triggerTextareaFocusFx(el) {
  const fx = window.SakugaFX;
  if (!fx || !el) return;
  const c = fx.at(el, 1, 0);
  fx.ticks(c.x - 6, c.y - 4, { dir: -1.05, n: 3, r: 5, len: 17, fan: 0.36, life: 0.5 });
}

function triggerTextareaInputFx(el) {
  const fx = window.SakugaFX;
  if (!fx || !el) return;
  const c = fx.at(el, 0, 0);
  const pos = el.selectionStart ?? el.value.length;
  const lines = el.value.slice(0, pos).split('\n');
  const currentLine = lines[lines.length - 1] || '';
  const x = c.x + 18 + Math.min(Math.max(c.w - 38, 12), currentLine.length * 8.5);
  const y = c.y + 18 + Math.min(Math.max(c.h - 28, 12), (lines.length - 1) * 22);
  fx.puff(x, y + 6, { size: fx.rnd(4, 6), n: 2, vy: -22, vx: fx.rnd(-10, 10), life: 0.4 });
  if (Math.random() < 0.35) {
    fx.shards(x, y + 2, { n: 2, speed: 110, size: 3, life: 0.5 });
  }
}

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
    const cleanUsername = loginUsername.trim();
    if (!cleanUsername || !loginPassword) {
      const msg = 'Username and password are required';
      setFeedback({ text: msg, isError: true });
      onStatus(msg, true);
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const data = await loginUser({ username: cleanUsername, password: loginPassword });
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
    const cleanEmail = regEmail.trim();
    const cleanUsername = regUsername.trim();
    if (!EMAIL_RE.test(cleanEmail)) {
      const msg = 'Valid email is required';
      setFeedback({ text: msg, isError: true });
      onStatus(msg, true);
      return;
    }
    if (!cleanUsername) {
      const msg = 'Username is required';
      setFeedback({ text: msg, isError: true });
      onStatus(msg, true);
      return;
    }
    if (regPassword.length < 6) {
      const msg = 'Password must be at least 6 characters';
      setFeedback({ text: msg, isError: true });
      onStatus(msg, true);
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await registerUser({
        email: cleanEmail,
        username: cleanUsername,
        password: regPassword,
        role: regRole,
      });
      setLoginUsername(cleanUsername);
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
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    if (!cleanTitle || cleanTitle.length > 255) {
      const msg = 'Headline is required (max 255 characters)';
      setFeedback({ text: msg, isError: true });
      onStatus(msg, true);
      return;
    }
    if (!cleanContent) {
      const msg = 'Dispatch body is required';
      setFeedback({ text: msg, isError: true });
      onStatus(msg, true);
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      if (editingPost) {
        await updatePost(editingPost.id, { title: cleanTitle, content: cleanContent });
        onStatus(`Updated dispatch #${editingPost.id}`, false);
        onCancelEdit();
      } else {
        const created = await createPost({ title: cleanTitle, content: cleanContent });
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
              <SakugaInput
                id="login-username"
                name="username"
                type="text"
                label="Username or Email"
                autocomplete="username"
                placeholder="e.g. author1"
                value={loginUsername}
                onChange={setLoginUsername}
                disabled={submitting}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <SakugaInput
                id="login-password"
                name="password"
                type="password"
                label="Password"
                autocomplete="current-password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={setLoginPassword}
                disabled={submitting}
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
              <SakugaInput
                id="reg-email"
                name="email"
                type="email"
                label="Email"
                autocomplete="email"
                placeholder="you@example.com"
                value={regEmail}
                onChange={setRegEmail}
                disabled={submitting}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="reg-username">
                Username
              </label>
              <SakugaInput
                id="reg-username"
                name="username"
                type="text"
                label="Username"
                autocomplete="username"
                placeholder="Choose a handle"
                value={regUsername}
                onChange={setRegUsername}
                disabled={submitting}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="reg-password">
                Password
              </label>
              <SakugaInput
                id="reg-password"
                name="password"
                type="password"
                label="Password"
                autocomplete="new-password"
                placeholder="Minimum 6 characters"
                value={regPassword}
                onChange={setRegPassword}
                disabled={submitting}
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
          <SakugaInput
            id="editor-post-title"
            name="title"
            type="text"
            label="Headline"
            placeholder="Dispatch headline"
            value={title}
            onChange={setTitle}
            disabled={submitting}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="editor-post-content">
            Dispatch Body
          </label>
          <textarea
            id="editor-post-content"
            className="form-input sakuga-textarea"
            rows={4}
            required
            placeholder="Write your dispatch..."
            value={content}
            disabled={submitting}
            onFocus={(e) => triggerTextareaFocusFx(e.currentTarget)}
            onChange={(e) => {
              setContent(e.target.value);
              triggerTextareaInputFx(e.currentTarget);
            }}
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
