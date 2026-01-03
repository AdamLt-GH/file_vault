export const supportedExtensions = {
  archive: ["zip"],
  code: [
    "c",
    "h",
    "cpp",
    "hpp",
    "java",
    "py",
    "js",
    "jsx",
    "ts",
    "tsx",
    "html",
    "css",
    "scss",
    "json",
    "xml",
    "yaml",
    "yml",
    "md",
    "sql",
    "sh",
  ],
  document: [
    "pdf",
    "doc",
    "docx",
    "txt",
    "rtf",
    "csv",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
  ],
  image: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
  video: ["mp4", "mov", "avi", "mkv", "webm"],
} as const;

export type FileCategory = keyof typeof supportedExtensions;

const categoryByExtension = new Map<string, FileCategory>(
  Object.entries(supportedExtensions).flatMap(([category, extensions]) =>
    extensions.map((extension) => [extension, category as FileCategory]),
  ),
);

export function getFileExtension(filename: string): string | null {
  const finalDot = filename.lastIndexOf(".");

  if (finalDot <= 0 || finalDot === filename.length - 1) {
    return null;
  }

  return filename.slice(finalDot + 1).toLowerCase();
}

export function getFileCategory(extension: string): FileCategory | null {
  return categoryByExtension.get(extension.toLowerCase()) ?? null;
}

export function isSupportedExtension(extension: string): boolean {
  return categoryByExtension.has(extension.toLowerCase());
}
