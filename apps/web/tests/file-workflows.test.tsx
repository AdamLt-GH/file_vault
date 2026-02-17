import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FileActions } from "../src/features/files/FileActions";
import { FileList } from "../src/features/files/FileList";
import { FileListControls } from "../src/features/files/FileListControls";
import type { StoredFile } from "../src/features/files/api";
import { SearchPanel } from "../src/features/search/SearchPanel";
import { StorageSummaryCards } from "../src/features/storage/StorageSummaryCards";

const file: StoredFile = {
  checksum: "a".repeat(64),
  createdAt: "2026-02-17T00:00:00.000Z",
  extension: "txt",
  folderId: null,
  id: "37bff070-71d7-4dc4-b074-bb14f7dcb1e7",
  mimeType: "text/plain",
  originalName: "private notes.txt",
  sizeBytes: 2048,
  updatedAt: "2026-02-17T00:00:00.000Z",
};

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
}

function renderWithQueries(children: React.ReactNode) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      {children}
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("file management workflows", () => {
  it("shows file details and a working download link", () => {
    render(<FileList files={[file]} showActions={false} />);

    expect(screen.getByText("private notes.txt")).toBeInTheDocument();
    expect(screen.getByText("2.00 KB")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download" })).toHaveAttribute(
      "href",
      `/api/v1/files/${file.id}/download`,
    );
  });

  it("changes the file order and page", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const onSortChange = vi.fn();

    render(
      <FileListControls
        onPageChange={onPageChange}
        onSortChange={onSortChange}
        page={2}
        sortBy="createdAt"
        sortDirection="desc"
        total={45}
        totalPages={3}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Sort files"), "name:asc");
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(onSortChange).toHaveBeenCalledWith("name", "asc");
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("searches the whole vault by filename", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          files: [file],
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithQueries(<SearchPanel />);
    await user.type(screen.getByLabelText("Search every folder"), "notes");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("private notes.txt")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/search?page=1&pageSize=20&q=notes",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("shows storage totals from the summary endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            summary: {
              fileCount: 12,
              folderCount: 4,
              latestUploadAt: "2026-02-17T00:00:00.000Z",
              usedBytes: 1048576,
            },
          }),
          { status: 200 },
        ),
      ),
    );

    renderWithQueries(<StorageSummaryCards />);

    expect(await screen.findByText("1.00 MB")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("deletes a file after confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const fetchMock = vi.fn().mockImplementation((input, options) => {
      if (String(input).endsWith("/folders/tree")) {
        return Promise.resolve(
          new Response(JSON.stringify({ folders: [] }), { status: 200 }),
        );
      }

      if (options?.method === "DELETE") {
        return Promise.resolve(new Response(null, { status: 204 }));
      }

      throw new Error(`Unexpected request to ${String(input)}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithQueries(<FileActions file={file} />);
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/v1/files/${file.id}`,
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
  });
});
