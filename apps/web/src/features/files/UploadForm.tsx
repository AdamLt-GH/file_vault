import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";

import { ApiError } from "../../api/http";
import { uploadFiles } from "./api";
import { getFilesQueryKey } from "./useFiles";

interface UploadFormProps {
  folderId?: string | undefined;
}

export function UploadForm({ folderId }: UploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => uploadFiles(files, folderId),
    onSuccess: async () => {
      setSelectedFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      await queryClient.invalidateQueries({
        queryKey: getFilesQueryKey(folderId),
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (selectedFiles.length > 0) uploadMutation.mutate(selectedFiles);
  }

  const errorMessage =
    uploadMutation.error instanceof ApiError
      ? uploadMutation.error.message
      : uploadMutation.isError
        ? "The file could not be uploaded"
        : null;

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="file-picker">
        <span>
          {selectedFiles.length === 0
            ? "Choose files"
            : selectedFiles.length === 1
              ? selectedFiles[0]?.name
              : `${selectedFiles.length} files selected`}
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={(event) =>
            setSelectedFiles(Array.from(event.target.files ?? []))
          }
        />
      </label>
      <button
        type="submit"
        disabled={selectedFiles.length === 0 || uploadMutation.isPending}
      >
        {uploadMutation.isPending ? "Uploading..." : "Upload"}
      </button>
      {errorMessage ? (
        <span className="upload-error" role="alert">
          {errorMessage}
        </span>
      ) : null}
    </form>
  );
}
