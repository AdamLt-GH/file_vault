import { useState } from "react";
import { useParams } from "react-router-dom";

import { Sidebar } from "../components/Sidebar";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
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
  const [pagination, setPagination] = useState({ folderId, page: 1 });
  const page = pagination.folderId === folderId ? pagination.page : 1;
  const [sortBy, setSortBy] = useState<FileSort>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const files = useFiles(folderId, { page, sortBy, sortDirection });
  const folders = useFolders(folderId);
  const breadcrumbs = useBreadcrumbs(folderId);

  function changeSort(nextSort: FileSort, nextDirection: SortDirection) {
    setPagination({ folderId, page: 1 });
    setSortBy(nextSort);
    setSortDirection(nextDirection);
  }

  function changePage(nextPage: number) {
    setPagination({ folderId, page: nextPage });
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
            <LoadingState message="Loading files..." />
          ) : files.isError || folders.isError ? (
            <ErrorState
              message="Files could not be loaded."
              onRetry={() => {
                void Promise.all([files.refetch(), folders.refetch()]);
              }}
            />
          ) : (
            <>
              <FolderList
                folders={folders.data.folders}
                parentFolderId={folderId}
              />
              <FileListControls
                onPageChange={changePage}
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
