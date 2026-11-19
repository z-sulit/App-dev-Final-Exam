export default function Navbar({
  user,
  view,
  onSelectView,
  onScrollToWorkspace,
  onLogout,
}) {
  return (
    <header className="navbar-wrapper">
      <div className="max-w-canvas navbar">
        <a
          href="#top"
          className="brand-mark"
          onClick={(e) => {
            e.preventDefault();
            onSelectView('all');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <span>BLOGBLOBLOG</span>
        </a>

        <ul className="nav-links-center">
          <li>
            <button
              type="button"
              className={`nav-link-btn${view === 'all' ? ' active' : ''}`}
              onClick={() => onSelectView('all')}
            >
              All Dispatches
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`nav-link-btn${view === 'mine' ? ' active' : ''}`}
              onClick={() => onSelectView('mine')}
            >
              My Dispatches
            </button>
          </li>
          {user?.role !== 'reader' && (
            <li>
              <button
                type="button"
                className="nav-link-btn"
                onClick={onScrollToWorkspace}
              >
                Create Post
              </button>
            </li>
          )}
        </ul>

        <div className="nav-right-slot">
          <div className="user-identity-badge">
            <span>{user ? user.username : 'Guest'}</span>
            <span className="role-pill-indicator">
              {user ? user.role : 'Guest'}
            </span>
          </div>
          <button
            type="button"
            className="btn-arrow-action"
            onClick={user ? onLogout : onScrollToWorkspace}
          >
            <span>{user ? 'Log Out' : 'Log In'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
