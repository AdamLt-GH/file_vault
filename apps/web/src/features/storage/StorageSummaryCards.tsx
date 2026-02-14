import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { useStorageSummary } from "./useStorageSummary";

export function StorageSummaryCards() {
  const summary = useStorageSummary();

  if (summary.isPending) {
    return <LoadingState message="Loading storage totals..." small />;
  }

  if (summary.isError) {
    return (
      <ErrorState
        message="Storage totals could not be loaded."
        onRetry={() => void summary.refetch()}
        small
      />
    );
  }

  const details = summary.data.summary;

  return (
    <section className="summary-cards" aria-label="Storage summary">
      <article className="summary-card summary-card-primary">
        <span>Storage used</span>
        <strong>{formatBytes(details.usedBytes)}</strong>
        <small>Across your whole vault</small>
      </article>
      <article className="summary-card">
        <span>Files</span>
        <strong>{details.fileCount}</strong>
        <small>Saved files</small>
      </article>
      <article className="summary-card">
        <span>Folders</span>
        <strong>{details.folderCount}</strong>
        <small>Organised folders</small>
      </article>
      <article className="summary-card">
        <span>Latest upload</span>
        <strong className="summary-date">
          {details.latestUploadAt ? formatDate(details.latestUploadAt) : "None yet"}
        </strong>
        <small>Most recent file</small>
      </article>
    </section>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}
