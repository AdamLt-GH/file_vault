import type { Environment } from "../config/environment.js";
import { LocalFilesystemStorage } from "./local-filesystem.js";
import type { StorageProvider } from "./storage-provider.js";

export function createStorageProvider(
  environment: Environment,
): StorageProvider {
  return new LocalFilesystemStorage(environment.FILEVAULT_STORAGE_PATH);
}
