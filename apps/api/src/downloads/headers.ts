interface DownloadMetadata {
  mimeType: string;
  originalName: string;
  sizeBytes: bigint;
}

export function createDownloadHeaders(file: DownloadMetadata) {
  const fallbackFilename = file.originalName
    .replace(/[^\x20-\x7e]/g, "_")
    .replace(/["\\]/g, "_")
    .replace(/[\r\n]/g, "_")
    .slice(0, 180) || "download";
  const encodedFilename = encodeURIComponent(file.originalName).replace(
    /['()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  return {
    "Content-Disposition":
      `attachment; filename="${fallbackFilename}"; filename*=UTF-8''${encodedFilename}`,
    "Content-Length": file.sizeBytes.toString(),
    "Content-Type": file.mimeType,
    "X-Content-Type-Options": "nosniff",
  };
}
