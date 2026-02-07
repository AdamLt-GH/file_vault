import { getDownloadUrl, type StoredFile } from "./api";
import { FileActions } from "./FileActions";

interface FileListProps {
  emptyMessage?: string;
  files: StoredFile[];
  folderId?: string | undefined;
  showActions?: boolean;
}

export function FileList({
  emptyMessage = "Upload a file to get started.",
  files,
  folderId,
  showActions = true,
}: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="empty-files">
        <strong>This folder is empty</strong>
        <span>{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="file-table-wrap">
      <table className="file-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Size</th>
            <th>Uploaded</th>
            <th aria-label="File actions" />
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id}>
              <td>
                <div className="file-name">
                  <span className="file-icon" aria-hidden="true">
                    {file.extension.slice(0, 3).toUpperCase()}
                  </span>
                  <span title={file.originalName}>{file.originalName}</span>
                </div>
              </td>
              <td>{file.mimeType}</td>
              <td>{formatBytes(file.sizeBytes)}</td>
              <td>{formatDate(file.createdAt)}</td>
              <td>
                <div className="row-actions-wrap">
                  <a className="table-action" href={getDownloadUrl(file.id)}>
                    Download
                  </a>
                  {showActions ? (
                    <FileActions file={file} folderId={folderId} />
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
