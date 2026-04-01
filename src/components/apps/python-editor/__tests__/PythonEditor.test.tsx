import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import filesystemReducer from "@/store/filesystemSlice";
import windowsReducer from "@/store/windowsSlice";
import sessionReducer from "@/store/sessionSlice";
import desktopReducer from "@/store/desktopSlice";
import clipboardReducer from "@/store/clipboardSlice";
import PythonEditor from "../PythonEditor";

vi.mock("@/lib/python/pyodide", () => ({
  runPython: vi.fn().mockResolvedValue({ output: "Hello", error: null }),
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
