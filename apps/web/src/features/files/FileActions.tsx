import { useMutation, useQueryClient } from "@tanstack/react-query";

import { storageSummaryQueryKey } from "../storage/useStorageSummary";
import { deleteFile, updateFile, type StoredFile } from "./api";
import { MoveFileControl } from "./MoveFileControl";
import { getFilesQueryKey } from "./useFiles";

interface FileActionsProps {
  file: StoredFile;
  folderId?: string | undefined;
}

export function FileActions({ file, folderId }: FileActionsProps) {
  const queryClient = useQueryClient();

  const renameMutation = useMutation({
    mutationFn: (name: string) => updateFile(file.id, { name }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: getFilesQueryKey(folderId) }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFile(file.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getFilesQueryKey(folderId) }),
        queryClient.invalidateQueries({ queryKey: storageSummaryQueryKey }),
      ]);
    },
  });

  function rename(): void {
    const name = window.prompt("New filename", file.originalName)?.trim();
    if (name && name !== file.originalName) renameMutation.mutate(name);
  }

  function remove(): void {
    if (window.confirm(`Delete ${file.originalName}?`)) deleteMutation.mutate();
  }

  return (
    <div className="row-actions">
      <MoveFileControl currentFolderId={folderId} file={file} />
      <button type="button" onClick={rename} disabled={renameMutation.isPending}>
        Rename
      </button>
      <button type="button" onClick={remove} disabled={deleteMutation.isPending}>
        Delete
      </button>
      {renameMutation.isError || deleteMutation.isError ? (
        <span className="action-error">Action failed</span>
      ) : null}
    </div>
  );
}
