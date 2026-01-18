import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";

import { ApiError } from "../../api/http";
import { uploadFile } from "./api";
import { getFilesQueryKey } from "./useFiles";

export function UploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: async () => {
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: getFilesQueryKey() });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (selectedFile) uploadMutation.mutate(selectedFile);
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
        <span>{selectedFile ? selectedFile.name : "Choose a file"}</span>
        <input
          ref={inputRef}
          type="file"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <button
        type="submit"
        disabled={!selectedFile || uploadMutation.isPending}
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
