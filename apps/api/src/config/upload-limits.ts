import type { Environment } from "./environment.js";

const bytesInMegabyte = 1024 * 1024;

export function getMaxUploadSizeBytes(environment: Environment): number {
  return environment.MAX_UPLOAD_SIZE_MB * bytesInMegabyte;
}

export function formatUploadLimit(environment: Environment): string {
  return `${environment.MAX_UPLOAD_SIZE_MB} MB`;
}
