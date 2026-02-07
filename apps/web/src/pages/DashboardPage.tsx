import { Sidebar } from "../components/Sidebar";
import { LogoutButton } from "../features/auth/LogoutButton";
import { useSession } from "../features/auth/useSession";
import { FileList } from "../features/files/FileList";
import { UploadForm } from "../features/files/UploadForm";
import { useFiles } from "../features/files/useFiles";
import { FolderList } from "../features/folders/FolderList";
import { Breadcrumbs } from "../features/folders/Breadcrumbs";
import { CreateFolderForm } from "../features/folders/CreateFolderForm";
import { useBreadcrumbs, useFolders } from "../features/folders/useFolders";
import { SearchPanel } from "../features/search/SearchPanel";
import { useParams } from "react-router-dom";

export function DashboardPage() {
  const session = useSession();
  const { folderId } = useParams();
  const files = useFiles(folderId);
  const folders = useFolders(folderId);
  const breadcrumbs = useBreadcrumbs(folderId);

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
          <SearchPanel />
          <Breadcrumbs items={breadcrumbs.data?.breadcrumbs ?? []} />
          <div className="file-toolbar">
            <div>
              <h2>Your files</h2>
              <p>{folderId ? "Files in this folder." : "Files at the top level of your vault."}</p>
            </div>
            <div className="toolbar-actions">
              <CreateFolderForm parentFolderId={folderId} />
              <UploadForm folderId={folderId} />
            </div>
          </div>

          {files.isPending || folders.isPending ? (
            <div className="file-state">Loading files...</div>
          ) : files.isError || folders.isError ? (
            <div className="file-state error">Files could not be loaded.</div>
          ) : (
            <>
              <FolderList
                folders={folders.data.folders}
                parentFolderId={folderId}
              />
              <FileList files={files.data.files} folderId={folderId} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
