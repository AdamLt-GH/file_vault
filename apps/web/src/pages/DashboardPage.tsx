import { Sidebar } from "../components/Sidebar";
import { LogoutButton } from "../features/auth/LogoutButton";
import { useSession } from "../features/auth/useSession";
import { FileList } from "../features/files/FileList";
import { UploadForm } from "../features/files/UploadForm";
import { useFiles } from "../features/files/useFiles";

export function DashboardPage() {
  const session = useSession();
  const files = useFiles();

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Private NAS storage</p>
            <h1>File Vault</h1>
          </div>
          <div className="account-actions">
            <p className="account-email">{session.data?.user?.email}</p>
            <LogoutButton />
          </div>
        </header>

        <section className="dashboard-content">
          <div className="file-toolbar">
            <div>
              <h2>Your files</h2>
              <p>Files stored at the top level of your vault.</p>
            </div>
            <UploadForm />
          </div>

          {files.isPending ? (
            <div className="file-state">Loading files...</div>
          ) : files.isError ? (
            <div className="file-state error">Files could not be loaded.</div>
          ) : (
            <FileList files={files.data.files} />
          )}
        </section>
      </main>
    </div>
  );
}
