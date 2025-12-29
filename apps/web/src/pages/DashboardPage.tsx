import { Sidebar } from "../components/Sidebar";
import { useSession } from "../features/auth/useSession";

export function DashboardPage() {
  const session = useSession();

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Private NAS storage</p>
            <h1>File Vault</h1>
          </div>
          <p className="account-email">{session.data?.user?.email}</p>
        </header>

        <section className="dashboard-content">
          <h2>Your files</h2>
          <p>The file browser will appear here.</p>
        </section>
      </main>
    </div>
  );
}
