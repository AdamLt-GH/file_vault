import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";

import { ApiError } from "../../api/http";
import { uploadFilesWithProgress } from "./api";
import { getFilesQueryKey } from "./useFiles";

interface UploadFormProps {
  folderId?: string | undefined;
}

export function UploadForm({ folderId }: UploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) =>
      uploadFilesWithProgress(files, folderId, setProgress),
    onMutate: () => setProgress(0),
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

  function handleDrag(event: DragEvent<HTMLFormElement>): void {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(event.type === "dragenter" || event.type === "dragover");
  }

  function handleDrop(event: DragEvent<HTMLFormElement>): void {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    setSelectedFiles(Array.from(event.dataTransfer.files));
  }

  const errorMessage =
    uploadMutation.error instanceof ApiError
      ? uploadMutation.error.message
      : uploadMutation.isError
        ? "The file could not be uploaded"
        : null;

  return (
    <form
      className={`upload-form drop-zone${isDragging ? " dragging" : ""}`}
      onSubmit={handleSubmit}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <label className="file-picker">
        <span>
          {selectedFiles.length === 0
            ? "Choose files or drop them here"
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
      {uploadMutation.isPending ? (
        <div className="upload-progress" aria-label={`Upload ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
          <strong>{progress}%</strong>
        </div>
      ) : null}
    </form>
  );
}
