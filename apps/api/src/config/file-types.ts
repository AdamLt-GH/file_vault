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

const allowedMimeTypes: Readonly<Record<string, readonly string[]>> = {
  avi: ["video/x-msvideo"],
  c: ["text/plain", "text/x-c"],
  cpp: ["text/plain", "text/x-c++"],
  css: ["text/css", "text/plain"],
  csv: ["text/csv", "text/plain", "application/vnd.ms-excel"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  gif: ["image/gif"],
  h: ["text/plain", "text/x-c"],
  hpp: ["text/plain", "text/x-c++"],
  html: ["text/html", "text/plain"],
  java: ["text/plain", "text/x-java-source"],
  jpeg: ["image/jpeg"],
  jpg: ["image/jpeg"],
  js: ["text/javascript", "application/javascript", "text/plain"],
  json: ["application/json", "text/json", "text/plain"],
  jsx: ["text/javascript", "application/javascript", "text/plain"],
  md: ["text/markdown", "text/plain"],
  mkv: ["video/x-matroska"],
  mov: ["video/quicktime"],
  mp4: ["video/mp4"],
  pdf: ["application/pdf"],
  png: ["image/png"],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  py: ["text/x-python", "text/plain"],
  rtf: ["application/rtf", "text/rtf"],
  scss: ["text/x-scss", "text/plain"],
  sh: ["application/x-sh", "text/x-shellscript", "text/plain"],
  sql: ["application/sql", "text/x-sql", "text/plain"],
  svg: ["image/svg+xml"],
  ts: ["text/typescript", "text/plain"],
  tsx: ["text/typescript", "text/plain"],
  txt: ["text/plain"],
  webm: ["video/webm"],
  webp: ["image/webp"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  xml: ["application/xml", "text/xml", "text/plain"],
  yaml: ["application/yaml", "text/yaml", "text/plain"],
  yml: ["application/yaml", "text/yaml", "text/plain"],
  zip: ["application/zip", "application/x-zip-compressed"],
};

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

export function isAllowedMimeType(extension: string, mimeType: string): boolean {
  const normalisedExtension = extension.toLowerCase();
  const normalisedMimeType = mimeType.split(";", 1)[0]?.trim().toLowerCase();

  if (!normalisedMimeType) return false;

  return allowedMimeTypes[normalisedExtension]?.includes(normalisedMimeType) ?? false;
}
