import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Sidebar } from "../components/Sidebar";
import { LogoutButton } from "../features/auth/LogoutButton";
import { useSession } from "../features/auth/useSession";
import { FileList } from "../features/files/FileList";
import { FileListControls } from "../features/files/FileListControls";
import type { FileSort, SortDirection } from "../features/files/api";
import { UploadForm } from "../features/files/UploadForm";
import { useFiles } from "../features/files/useFiles";
import { FolderList } from "../features/folders/FolderList";
import { Breadcrumbs } from "../features/folders/Breadcrumbs";
import { CreateFolderForm } from "../features/folders/CreateFolderForm";
import { useBreadcrumbs, useFolders } from "../features/folders/useFolders";
import { SearchPanel } from "../features/search/SearchPanel";
import { StorageSummaryCards } from "../features/storage/StorageSummaryCards";

export function DashboardPage() {
  const session = useSession();
  const { folderId } = useParams();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<FileSort>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const files = useFiles(folderId, { page, sortBy, sortDirection });
  const folders = useFolders(folderId);
  const breadcrumbs = useBreadcrumbs(folderId);

  useEffect(() => setPage(1), [folderId]);

  function changeSort(nextSort: FileSort, nextDirection: SortDirection) {
    setPage(1);
    setSortBy(nextSort);
    setSortDirection(nextDirection);
  }

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

        <StorageSummaryCards />

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
              <FileListControls
                onPageChange={setPage}
                onSortChange={changeSort}
                page={files.data.page}
                sortBy={sortBy}
                sortDirection={sortDirection}
                total={files.data.total}
                totalPages={files.data.totalPages}
              />
              <FileList files={files.data.files} folderId={folderId} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
