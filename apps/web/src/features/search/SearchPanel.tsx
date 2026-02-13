import { type FormEvent, useState } from "react";

import { LoadingState } from "../../components/LoadingState";
import { FileList } from "../files/FileList";
import { useSearchFiles } from "./useSearchFiles";

export function SearchPanel() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const results = useSearchFiles(query, page);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = input.trim();
    setPage(1);
    setQuery(nextQuery);
  }

  function clearSearch() {
    setInput("");
    setPage(1);
    setQuery("");
  }

  return (
    <section className="search-panel" aria-label="Search files">
      <form className="search-form" onSubmit={handleSubmit}>
        <label htmlFor="file-search">Search every folder</label>
        <div>
          <input
            id="file-search"
            onChange={(event) => setInput(event.target.value)}
            placeholder="Search by filename"
            type="search"
            value={input}
          />
          <button type="submit">Search</button>
          {query ? (
            <button className="search-clear" onClick={clearSearch} type="button">
              Clear
            </button>
          ) : null}
        </div>
      </form>

      {query ? (
        <div className="search-results">
          <div className="search-heading">
            <div>
              <h2>Search results</h2>
              <p>
                {results.data
                  ? `${results.data.total} result${results.data.total === 1 ? "" : "s"} for \"${query}\"`
                  : `Looking for \"${query}\"`}
              </p>
            </div>
          </div>

          {results.isPending ? (
            <LoadingState message="Searching files..." small />
          ) : results.isError ? (
            <div className="file-state error">Search results could not be loaded.</div>
          ) : (
            <>
              <FileList
                emptyMessage="Try a different filename."
                files={results.data.files}
                showActions={false}
              />
              {results.data.totalPages > 1 ? (
                <nav className="search-pagination" aria-label="Search result pages">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((current) => current - 1)}
                    type="button"
                  >
                    Previous
                  </button>
                  <span>
                    Page {results.data.page} of {results.data.totalPages}
                  </span>
                  <button
                    disabled={page === results.data.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    type="button"
                  >
                    Next
                  </button>
                </nav>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
