import type { FileSort, SortDirection } from "./api";

interface FileListControlsProps {
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: FileSort, sortDirection: SortDirection) => void;
  page: number;
  sortBy: FileSort;
  sortDirection: SortDirection;
  total: number;
  totalPages: number;
}

export function FileListControls({
  onPageChange,
  onSortChange,
  page,
  sortBy,
  sortDirection,
  total,
  totalPages,
}: FileListControlsProps) {
  const sortValue = `${sortBy}:${sortDirection}`;

  return (
    <div className="file-list-controls">
      <label>
        Sort files
        <select
          onChange={(event) => {
            const [nextSort, nextDirection] = event.target.value.split(":") as [
              FileSort,
              SortDirection,
            ];
            onSortChange(nextSort, nextDirection);
          }}
          value={sortValue}
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="name:asc">Name A to Z</option>
          <option value="name:desc">Name Z to A</option>
          <option value="size:desc">Largest first</option>
          <option value="size:asc">Smallest first</option>
        </select>
      </label>

      <div className="file-page-controls">
        <span>
          {total} file{total === 1 ? "" : "s"}, page {page} of {totalPages}
        </span>
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          Previous
        </button>
        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
