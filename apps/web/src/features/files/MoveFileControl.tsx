import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listFolderTree } from "../folders/api";
import { updateFile, type StoredFile } from "./api";
import { getFilesQueryKey } from "./useFiles";

interface MoveFileControlProps {
  currentFolderId?: string | undefined;
  file: StoredFile;
}

export function MoveFileControl({ currentFolderId, file }: MoveFileControlProps) {
  const queryClient = useQueryClient();
  const folders = useQuery({
    queryFn: listFolderTree,
    queryKey: ["folder-tree"],
  });
  const moveMutation = useMutation({
    mutationFn: (folderId: string | null) => updateFile(file.id, { folderId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getFilesQueryKey(currentFolderId),
      });
    },
  });

  return (
    <select
      aria-label={`Move ${file.originalName}`}
      value={file.folderId ?? "root"}
      disabled={folders.isPending || moveMutation.isPending}
      onChange={(event) =>
        moveMutation.mutate(event.target.value === "root" ? null : event.target.value)
      }
    >
      <option value="root">Move to My files</option>
      {folders.data?.folders.map((folder) => (
        <option key={folder.id} value={folder.id}>
          Move to {folder.name}
        </option>
      ))}
    </select>
  );
}
