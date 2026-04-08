import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, act, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import filesystemReducer from "@/store/filesystemSlice";
import windowsReducer from "@/store/windowsSlice";
import sessionReducer from "@/store/sessionSlice";
import desktopReducer from "@/store/desktopSlice";
import clipboardReducer from "@/store/clipboardSlice";
import PythonEditor from "../PythonEditor";

const mockRunPython = vi.fn().mockResolvedValue({ output: "Hello", error: null });
const mockIsPyodideLoaded = vi.fn().mockReturnValue(false);

vi.mock("@/lib/python/pyodide", () => ({
  runPython: (...args: unknown[]) => mockRunPython(...args),
  isPyodideLoaded: () => mockIsPyodideLoaded(),
}));

const FILE_ID = "test-file-id";
const FILE_CONTENT = 'print("Hello")';

function makeStore(withFile = false) {
  const filesystemPreloadedState = withFile
    ? {
        nodes: {
          root: {
            type: "directory" as const,
            id: "root",
            name: "/",
            parentId: null,
            createdAt: 0,
            modifiedAt: 0,
            childIds: [FILE_ID],
          },
          [FILE_ID]: {
            type: "file" as const,
            id: FILE_ID,
            name: "hello.py",
            parentId: "root",
            createdAt: 0,
            modifiedAt: 0,
            content: FILE_CONTENT,
            extension: "py",
            size: FILE_CONTENT.length,
          },
        },
        rootId: "root",
      }
    : {
        nodes: {
          root: {
            type: "directory" as const,
            id: "root",
            name: "/",
            parentId: null,
            createdAt: 0,
            modifiedAt: 0,
            childIds: [],
          },
        },
        rootId: "root",
      };

  return configureStore({
    reducer: {
      filesystem: filesystemReducer,
      windows: windowsReducer,
      session: sessionReducer,
      desktop: desktopReducer,
      clipboard: clipboardReducer,
    },
    preloadedState: {
      filesystem: filesystemPreloadedState,
    } as Parameters<typeof configureStore>[0]["preloadedState"],
  });
}

function renderEditor(fileId?: string, withFile = false) {
  const testStore = makeStore(withFile);
  return render(
    <Provider store={testStore}>
      <PythonEditor fileId={fileId} />
    </Provider>
  );
}

afterEach(cleanup);

describe("PythonEditor", () => {
  it("shows 'No file selected' when fileId is omitted", () => {
    renderEditor(undefined, false);
    expect(screen.getByText("No file selected")).toBeDefined();
  });

  it("shows 'File not found' when fileId does not exist in the filesystem", () => {
    renderEditor("nonexistent-id", false);
    expect(screen.getByText("File not found")).toBeDefined();
  });

  it("renders the editor textarea with file content when given a valid fileId", () => {
    renderEditor(FILE_ID, true);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea).toBeDefined();
    expect(textarea.value).toBe(FILE_CONTENT);
  });

  it("shows the Run button", () => {
    renderEditor(FILE_ID, true);
    const button = screen.getByRole("button");
    expect(button.textContent).toMatch(/run/i);
  });

  it("shows placeholder text in output panel before any run", () => {
    renderEditor(FILE_ID, true);
    expect(screen.getByText(/run your script/i)).toBeDefined();
  });

  it("shows the filename in the toolbar", () => {
    renderEditor(FILE_ID, true);
    expect(screen.getByText("hello.py")).toBeDefined();
  });
});

describe("PythonEditor — Run button interactions", () => {
  afterEach(cleanup);

  it("shows output after clicking Run", async () => {
    mockRunPython.mockResolvedValue({ output: "Hello World\n", error: null });
    renderEditor(FILE_ID, true);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    await waitFor(() => {
      expect(screen.getByText(/Hello World/)).toBeDefined();
    });
  });

  it("shows error after clicking Run when Python throws", async () => {
    mockRunPython.mockResolvedValue({ output: "", error: "NameError: name 'foo' is not defined" });
    renderEditor(FILE_ID, true);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    await waitFor(() => {
      expect(screen.getByText("NameError: name 'foo' is not defined")).toBeDefined();
    });
  });

  it("shows '(no output)' when script runs successfully with no stdout", async () => {
    mockRunPython.mockResolvedValue({ output: "", error: null });
    renderEditor(FILE_ID, true);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    await waitFor(() => {
      expect(screen.getByText("(no output)")).toBeDefined();
    });
  });

  it("shows error and re-enables Run button when runPython rejects (e.g. CDN failure)", async () => {
    mockRunPython.mockRejectedValue(new Error("Failed to load pyodide.js"));
    renderEditor(FILE_ID, true);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    await waitFor(() => {
      expect(screen.getByText("Failed to load pyodide.js")).toBeDefined();
    });
    // Run button must be re-enabled
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows 'Loading Python runtime...' while running if Pyodide is not yet loaded", async () => {
    mockIsPyodideLoaded.mockReturnValue(false);
    let resolveRun!: (v: { output: string; error: null }) => void;
    mockRunPython.mockReturnValue(
      new Promise((res) => {
        resolveRun = res;
      })
    );
    renderEditor(FILE_ID, true);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("Loading Python runtime...")).toBeDefined();
    });

    await act(async () => {
      resolveRun({ output: "done", error: null });
    });
  });
});

describe("PythonEditor — autosave debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("does not save immediately on keystroke", () => {
    const store = makeStore(true);
    render(
      <Provider store={store}>
        <PythonEditor fileId={FILE_ID} />
      </Provider>
    );

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "x = 1" } });

    // Before timer fires, Redux content is still the original
    expect(
      (store.getState() as { filesystem: { nodes: Record<string, { content?: string }> } })
        .filesystem.nodes[FILE_ID].content
    ).toBe(FILE_CONTENT);
  });

  it("saves to Redux after 500ms debounce", () => {
    const store = makeStore(true);
    render(
      <Provider store={store}>
        <PythonEditor fileId={FILE_ID} />
      </Provider>
    );

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "x = 42" } });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(
      (store.getState() as { filesystem: { nodes: Record<string, { content?: string }> } })
        .filesystem.nodes[FILE_ID].content
    ).toBe("x = 42");
  });
});

describe("PythonEditor — Ctrl+Enter shortcut", () => {
  afterEach(cleanup);

  it("triggers run on Ctrl+Enter", async () => {
    mockRunPython.mockResolvedValue({ output: "ok", error: null });
    renderEditor(FILE_ID, true);
    const textarea = screen.getByRole("textbox");

    await act(async () => {
      fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true });
    });

    await waitFor(() => {
      expect(mockRunPython).toHaveBeenCalled();
    });
  });

  it("triggers run on Meta+Enter (Mac Cmd+Enter)", async () => {
    mockRunPython.mockResolvedValue({ output: "ok", error: null });
    renderEditor(FILE_ID, true);
    const textarea = screen.getByRole("textbox");

    await act(async () => {
      fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });
    });

    await waitFor(() => {
      expect(mockRunPython).toHaveBeenCalled();
    });
  });
});

describe("PythonEditor — Tab key handling", () => {
  afterEach(cleanup);

  it("inserts 4 spaces on Tab keydown", () => {
    renderEditor(FILE_ID, true);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;

    // Set cursor at start
    textarea.setSelectionRange(0, 0);
    fireEvent.keyDown(textarea, { key: "Tab" });

    // Draft should now start with 4 spaces prepended at cursor position 0
    expect(textarea.value.startsWith("    ")).toBe(true);
  });

  it("does not move focus on Tab keydown", () => {
    renderEditor(FILE_ID, true);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    textarea.focus();

    fireEvent.keyDown(textarea, { key: "Tab" });

    expect(document.activeElement).toBe(textarea);
  });

  it("removes up to 4 leading spaces on Shift+Tab", () => {
    const store = makeStore(true);
    // Preload file with indented content
    const { rerender } = render(
      <Provider store={store}>
        <PythonEditor fileId={FILE_ID} />
      </Provider>
    );

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    // Set the textarea value to indented content and simulate change
    fireEvent.change(textarea, { target: { value: "    x = 1" } });
    rerender(
      <Provider store={store}>
        <PythonEditor fileId={FILE_ID} />
      </Provider>
    );

    // Place cursor at position 4 (after spaces)
    textarea.setSelectionRange(4, 4);
    fireEvent.keyDown(textarea, { key: "Tab", shiftKey: true });

    expect(textarea.value.startsWith("    ")).toBe(false);
  });
});
