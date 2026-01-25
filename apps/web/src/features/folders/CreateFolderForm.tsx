import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";

import { ApiError } from "../../api/http";
import { createFolder } from "./api";
import { getFoldersQueryKey } from "./useFolders";

interface CreateFolderFormProps {
  parentFolderId?: string | undefined;
}

export function CreateFolderForm({ parentFolderId }: CreateFolderFormProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");

  const createMutation = useMutation({
    mutationFn: createFolder,
    onSuccess: async () => {
      setName("");
      setIsOpen(false);
      await queryClient.invalidateQueries({
        queryKey: getFoldersQueryKey(parentFolderId),
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    createMutation.mutate({
      name,
      ...(parentFolderId ? { parentFolderId } : {}),
    });
  }

  if (!isOpen) {
    return (
      <button className="secondary-action" type="button" onClick={() => setIsOpen(true)}>
        New folder
      </button>
    );
  }

  const errorMessage =
    createMutation.error instanceof ApiError
      ? createMutation.error.message
      : createMutation.isError
        ? "The folder could not be created"
        : null;

  return (
    <form className="create-folder-form" onSubmit={handleSubmit}>
      <label htmlFor="folder-name">Folder name</label>
      <input
        id="folder-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoFocus
        maxLength={255}
        required
      />
      <button type="submit" disabled={createMutation.isPending}>
        Create
      </button>
      <button type="button" onClick={() => setIsOpen(false)}>
        Cancel
      </button>
      {errorMessage ? <span role="alert">{errorMessage}</span> : null}
    </form>
  );
}
