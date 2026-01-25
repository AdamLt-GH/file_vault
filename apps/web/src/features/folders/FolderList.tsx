import { Link } from "react-router-dom";

import type { Folder } from "./api";

interface FolderListProps {
  folders: Folder[];
}

export function FolderList({ folders }: FolderListProps) {
  if (folders.length === 0) return null;

  return (
    <div className="folder-grid" aria-label="Folders">
      {folders.map((folder) => (
        <Link
          className="folder-card"
          key={folder.id}
          to={`/dashboard/folders/${folder.id}`}
        >
          <span className="folder-icon" aria-hidden="true">
            Folder
          </span>
          <strong>{folder.name}</strong>
        </Link>
      ))}
    </div>
  );
}

