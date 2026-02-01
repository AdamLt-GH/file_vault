import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteFolder, renameFolder, type Folder } from "./api";
import { getFoldersQueryKey } from "./useFolders";

interface FolderActionsProps {
  folder: Folder;
  parentFolderId?: string | undefined;
}

export function FolderActions({ folder, parentFolderId }: FolderActionsProps) {
  const queryClient = useQueryClient();

  async function refreshFolders(): Promise<void> {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getFoldersQueryKey(parentFolderId),
      }),
      queryClient.invalidateQueries({ queryKey: ["folder-tree"] }),
    ]);
  }

  const renameMutation = useMutation({
    mutationFn: (name: string) => renameFolder(folder.id, name),
    onSuccess: refreshFolders,
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteFolder(folder.id),
    onSuccess: refreshFolders,
  });

  function rename(): void {
    const name = window.prompt("New folder name", folder.name)?.trim();
    if (name && name !== folder.name) renameMutation.mutate(name);
  }

  function remove(): void {
    if (window.confirm(`Delete the ${folder.name} folder?`)) {
      deleteMutation.mutate();
    }
  }

  return (
    <div className="folder-actions">
      <button type="button" onClick={rename}>
        Rename
      </button>
      <button type="button" onClick={remove}>
        Delete
      </button>
      {renameMutation.isError || deleteMutation.isError ? (
        <span role="alert">Action failed</span>
      ) : null}
    </div>
  );
}

