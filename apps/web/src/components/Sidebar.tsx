export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="vault-mark" aria-hidden="true">
          FV
        </div>
        <div>
          <strong>File Vault</strong>
          <span>Personal storage</span>
        </div>
      </div>

      <nav aria-label="Main navigation">
        <a className="sidebar-link active" href="/dashboard">
          Files
        </a>
        <a className="sidebar-link" href="/dashboard#storage">
          Storage
        </a>
      </nav>
    </aside>
  );
}

