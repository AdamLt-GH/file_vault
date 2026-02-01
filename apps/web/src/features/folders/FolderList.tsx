import { Link } from "react-router-dom";

import type { Folder } from "./api";
import { FolderActions } from "./FolderActions";

interface FolderListProps {
  folders: Folder[];
  parentFolderId?: string | undefined;
}

export function FolderList({ folders, parentFolderId }: FolderListProps) {
  if (folders.length === 0) return null;

  return (
    <div className="folder-grid" aria-label="Folders">
      {folders.map((folder) => (
        <div className="folder-card" key={folder.id}>
          <Link to={`/dashboard/folders/${folder.id}`}>
            <span className="folder-icon" aria-hidden="true">
              Folder
            </span>
            <strong>{folder.name}</strong>
          </Link>
          <FolderActions folder={folder} parentFolderId={parentFolderId} />
        </div>
      ))}
    </div>
  );
}
