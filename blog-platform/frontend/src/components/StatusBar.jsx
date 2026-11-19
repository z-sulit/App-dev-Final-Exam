export default function StatusBar({ status, user, refreshing, onRefreshToken }) {
  return (
    <aside className="system-status-bar">
      <div className="max-w-canvas system-status-inner">
        <div className="status-indicator-group">
          <span className={`live-dot${status.isError ? ' error' : ''}`} />
          <span className="status-banner-text">{status.message}</span>
        </div>
        <div className="status-indicator-group">
          <span className="status-badge-token">
            {user ? 'Token: Active' : 'Token: Guest'}
          </span>
          <span className="status-badge-token">
            Role: {user ? user.role : 'None'}
          </span>
          {user && (
            <button
              type="button"
              className="status-refresh-btn"
              onClick={onRefreshToken}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Token'}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
