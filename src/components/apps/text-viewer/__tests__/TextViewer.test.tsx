import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import TextViewer from "../TextViewer";
import filesystemReducer, {
  createFile,
  updateFileContent,
  resetFilesystem,
} from "@/store/filesystemSlice";
import { resolvePathToId } from "@/lib/filesystem/operations";
import { FSFile } from "@/lib/filesystem/types";

function makeStore() {
  return configureStore({ reducer: { filesystem: filesystemReducer } });
}

type Store = ReturnType<typeof makeStore>;

function renderViewer(store: Store, fileId?: string) {
  return render(
    <Provider store={store}>
      <TextViewer fileId={fileId} />
    </Provider>
  );
}

let store: Store;

beforeEach(() => {
  store = makeStore();
  store.dispatch(resetFilesystem());
});

afterEach(cleanup);

function fs() {
  return store.getState().filesystem;
}

function homeId() {
  return resolvePathToId(fs(), "/home/user")!;
}

// ---------------------------------------------------------------------------
// Render states
// ---------------------------------------------------------------------------
describe("TextViewer — render states", () => {
  it("shows 'No file selected' when fileId is undefined", () => {
    renderViewer(store);
    expect(screen.getByText("No file selected")).toBeTruthy();
  });

  it("shows 'File not found' for an invalid fileId", () => {
    renderViewer(store, "nonexistent-id");
    expect(screen.getByText("File not found")).toBeTruthy();
  });

  it("renders a plain text file as an editable textarea", () => {
    store.dispatch(createFile({ parentId: homeId(), name: "notes.txt", content: "hello world" }));
    const fileId = resolvePathToId(fs(), "/home/user/notes.txt")!;

    renderViewer(store, fileId);

    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
    expect(textarea.value).toBe("hello world");
  });

  it("renders a markdown file with Preview/Raw toolbar and no textarea by default", () => {
    store.dispatch(createFile({ parentId: homeId(), name: "readme.md", content: "# Hello" }));
    const fileId = resolvePathToId(fs(), "/home/user/readme.md")!;

    renderViewer(store, fileId);

    expect(screen.getByRole("button", { name: "Preview" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Raw" })).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Mode toggle
// ---------------------------------------------------------------------------
describe("TextViewer — mode toggle", () => {
  function setupMd() {
    store.dispatch(createFile({ parentId: homeId(), name: "doc.md", content: "# Doc" }));
    const fileId = resolvePathToId(fs(), "/home/user/doc.md")!;
    renderViewer(store, fileId);
    return fileId;
  }

  it("shows textarea after clicking Raw", () => {
    setupMd();
    fireEvent.click(screen.getByRole("button", { name: "Raw" }));
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("hides textarea and restores preview after clicking Preview", () => {
    setupMd();
    fireEvent.click(screen.getByRole("button", { name: "Raw" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("button", { name: "Raw" })).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Auto-save debounce
// ---------------------------------------------------------------------------
describe("TextViewer — auto-save debounce", () => {
  it("does not dispatch before 500ms", () => {
    vi.useFakeTimers();
    store.dispatch(createFile({ parentId: homeId(), name: "doc.md", content: "original" }));
    const fileId = resolvePathToId(fs(), "/home/user/doc.md")!;

    renderViewer(store, fileId);
    fireEvent.click(screen.getByRole("button", { name: "Raw" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "updated" } });

    act(() => vi.advanceTimersByTime(499));

    expect((store.getState().filesystem.nodes[fileId] as FSFile).content).toBe("original");
    vi.useRealTimers();
  });

  it("dispatches updateFileContent after 500ms", () => {
    vi.useFakeTimers();
    store.dispatch(createFile({ parentId: homeId(), name: "doc.md", content: "original" }));
    const fileId = resolvePathToId(fs(), "/home/user/doc.md")!;

    renderViewer(store, fileId);
    fireEvent.click(screen.getByRole("button", { name: "Raw" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "updated" } });

    act(() => vi.advanceTimersByTime(500));

    expect((store.getState().filesystem.nodes[fileId] as FSFile).content).toBe("updated");
    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// External sync
// ---------------------------------------------------------------------------
describe("TextViewer — external sync", () => {
  it("syncs draft when file content is updated externally", () => {
    store.dispatch(createFile({ parentId: homeId(), name: "notes.txt", content: "original" }));
    const fileId = resolvePathToId(fs(), "/home/user/notes.txt")!;

    renderViewer(store, fileId);

    act(() => {
      store.dispatch(updateFileContent({ nodeId: fileId, content: "from terminal" }));
    });

    expect(screen.getByRole<HTMLTextAreaElement>("textbox").value).toBe("from terminal");
  });
});

// ---------------------------------------------------------------------------
// Double-click enters raw mode
// ---------------------------------------------------------------------------
describe("TextViewer — double-click enters raw mode", () => {
  it("switches to raw mode on double-click in preview area", () => {
    vi.useFakeTimers();
    store.dispatch(createFile({ parentId: homeId(), name: "doc.md", content: "# Hello" }));
    const fileId = resolvePathToId(fs(), "/home/user/doc.md")!;

    renderViewer(store, fileId);

    const heading = screen.getByRole("heading", { name: "Hello" });
    const coords = { clientX: 50, clientY: 50 };

    fireEvent.mouseDown(heading, coords);
    act(() => vi.advanceTimersByTime(200));
    fireEvent.mouseDown(heading, coords);

    expect(screen.getByRole("textbox")).toBeTruthy();
    vi.useRealTimers();
  });
});
