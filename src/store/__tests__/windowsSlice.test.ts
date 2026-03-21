import { describe, it, expect, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import windowsReducer, {
  openWindow,
  closeWindow,
  focusWindow,
  minimizeWindow,
  maximizeWindow,
  updateWindowPosition,
  updateWindowSize,
} from "@/store/windowsSlice";

function makeStore() {
  return configureStore({ reducer: { windows: windowsReducer } });
}

type Store = ReturnType<typeof makeStore>;

let store: Store;

beforeEach(() => {
  store = makeStore();
});

function ws(s: Store) {
  return s.getState().windows;
}

// ---------------------------------------------------------------------------
// openWindow
// ---------------------------------------------------------------------------
describe("openWindow", () => {
  it("adds a window to the array", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    expect(ws(store).windows).toHaveLength(1);
  });

  it("window has the correct appType", () => {
    store.dispatch(openWindow({ appType: "file-manager" }));
    expect(ws(store).windows[0].appType).toBe("file-manager");
  });

  it("window uses the default title when none is provided", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    expect(ws(store).windows[0].title).toBe("Terminal");
  });

  it("window uses the default title for file-manager", () => {
    store.dispatch(openWindow({ appType: "file-manager" }));
    expect(ws(store).windows[0].title).toBe("File Manager");
  });

  it("window uses the default title for text-viewer", () => {
    store.dispatch(openWindow({ appType: "text-viewer" }));
    expect(ws(store).windows[0].title).toBe("Text Viewer");
  });

  it("window uses a custom title when provided", () => {
    store.dispatch(openWindow({ appType: "terminal", title: "My Shell" }));
    expect(ws(store).windows[0].title).toBe("My Shell");
  });

  it("window has the correct default size for terminal", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    expect(ws(store).windows[0].size).toEqual({ width: 700, height: 450 });
  });

  it("window has the correct default size for file-manager", () => {
    store.dispatch(openWindow({ appType: "file-manager" }));
    expect(ws(store).windows[0].size).toEqual({ width: 650, height: 450 });
  });

  it("window has the correct default size for text-viewer", () => {
    store.dispatch(openWindow({ appType: "text-viewer" }));
    expect(ws(store).windows[0].size).toEqual({ width: 600, height: 500 });
  });

  it("window state is normal", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    expect(ws(store).windows[0].state).toBe("normal");
  });

  it("window has a non-empty string id", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    expect(typeof ws(store).windows[0].id).toBe("string");
    expect(ws(store).windows[0].id.length).toBeGreaterThan(0);
  });

  it("window has appProps when provided", () => {
    store.dispatch(openWindow({ appType: "text-viewer", appProps: { fileId: "abc" } }));
    expect(ws(store).windows[0].appProps).toEqual({ fileId: "abc" });
  });

  it("each new window has a higher zIndex than the previous", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    store.dispatch(openWindow({ appType: "terminal" }));
    const [w1, w2] = ws(store).windows;
    expect(w2.zIndex).toBeGreaterThan(w1.zIndex);
  });

  it("maxZIndex increments with each opened window", () => {
    const before = ws(store).maxZIndex;
    store.dispatch(openWindow({ appType: "terminal" }));
    store.dispatch(openWindow({ appType: "terminal" }));
    expect(ws(store).maxZIndex).toBe(before + 2);
  });

  it("8 consecutive windows cover all 8 distinct position offsets", () => {
    for (let i = 0; i < 8; i++) {
      store.dispatch(openWindow({ appType: "terminal" }));
    }
    const xPositions = ws(store)
      .windows.map((w) => w.position.x)
      .sort((a, b) => a - b);
    const expectedXPositions = [0, 30, 60, 90, 120, 150, 180, 210].map((o) => 100 + o);
    expect(xPositions).toEqual(expectedXPositions);
  });

  it("9th window position wraps back to match the 1st", () => {
    for (let i = 0; i < 9; i++) {
      store.dispatch(openWindow({ appType: "terminal" }));
    }
    const windows = ws(store).windows;
    expect(windows[8].position.x).toBe(windows[0].position.x);
    expect(windows[8].position.y).toBe(windows[0].position.y);
  });
});

// ---------------------------------------------------------------------------
// closeWindow
// ---------------------------------------------------------------------------
describe("closeWindow", () => {
  it("removes the window with the given id", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    const id = ws(store).windows[0].id;
    store.dispatch(closeWindow(id));
    expect(ws(store).windows).toHaveLength(0);
  });

  it("does not affect other windows", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    store.dispatch(openWindow({ appType: "file-manager" }));
    const id = ws(store).windows[0].id;
    store.dispatch(closeWindow(id));
    expect(ws(store).windows).toHaveLength(1);
    expect(ws(store).windows[0].appType).toBe("file-manager");
  });

  it("closing a non-existent id is a no-op", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    store.dispatch(closeWindow("does-not-exist"));
    expect(ws(store).windows).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// focusWindow
// ---------------------------------------------------------------------------
describe("focusWindow", () => {
  it("gives the focused window the highest zIndex", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    store.dispatch(openWindow({ appType: "file-manager" }));
    const [w1, w2] = ws(store).windows;
    store.dispatch(focusWindow(w1.id));
    const focused = ws(store).windows.find((w) => w.id === w1.id)!;
    const other = ws(store).windows.find((w) => w.id === w2.id)!;
    expect(focused.zIndex).toBeGreaterThan(other.zIndex);
  });

  it("increments maxZIndex", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    const before = ws(store).maxZIndex;
    const id = ws(store).windows[0].id;
    store.dispatch(focusWindow(id));
    expect(ws(store).maxZIndex).toBe(before + 1);
  });

  it("changes a minimized window state to normal", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    const id = ws(store).windows[0].id;
    store.dispatch(minimizeWindow(id));
    store.dispatch(focusWindow(id));
    expect(ws(store).windows[0].state).toBe("normal");
  });

  it("leaves a normal window state unchanged", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    const id = ws(store).windows[0].id;
    store.dispatch(focusWindow(id));
    expect(ws(store).windows[0].state).toBe("normal");
  });

  it("leaves a maximized window state unchanged", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    const id = ws(store).windows[0].id;
    store.dispatch(maximizeWindow(id));
    store.dispatch(focusWindow(id));
    expect(ws(store).windows[0].state).toBe("maximized");
  });

  it("non-existent id does not increment maxZIndex", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    const before = ws(store).maxZIndex;
    store.dispatch(focusWindow("ghost"));
    expect(ws(store).maxZIndex).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// minimizeWindow
// ---------------------------------------------------------------------------
describe("minimizeWindow", () => {
  it("sets window state to minimized", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    const id = ws(store).windows[0].id;
    store.dispatch(minimizeWindow(id));
    expect(ws(store).windows[0].state).toBe("minimized");
  });

  it("does not affect other windows", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    store.dispatch(openWindow({ appType: "file-manager" }));
    const id = ws(store).windows[0].id;
    store.dispatch(minimizeWindow(id));
    expect(ws(store).windows[1].state).toBe("normal");
  });

  it("non-existent id is a no-op", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    store.dispatch(minimizeWindow("ghost"));
    expect(ws(store).windows[0].state).toBe("normal");
  });
});

// ---------------------------------------------------------------------------
// maximizeWindow
// ---------------------------------------------------------------------------
describe("maximizeWindow", () => {
  it("normal → maximized", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    const id = ws(store).windows[0].id;
    store.dispatch(maximizeWindow(id));
    expect(ws(store).windows[0].state).toBe("maximized");
  });

  it("maximized → normal (toggle)", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    const id = ws(store).windows[0].id;
    store.dispatch(maximizeWindow(id));
    store.dispatch(maximizeWindow(id));
    expect(ws(store).windows[0].state).toBe("normal");
  });

  it("minimized → maximized (non-maximized state toggles to maximized)", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    const id = ws(store).windows[0].id;
    store.dispatch(minimizeWindow(id));
    store.dispatch(maximizeWindow(id));
    expect(ws(store).windows[0].state).toBe("maximized");
  });

  it("non-existent id is a no-op", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    store.dispatch(maximizeWindow("ghost"));
    expect(ws(store).windows[0].state).toBe("normal");
  });
});

// ---------------------------------------------------------------------------
// updateWindowPosition
// ---------------------------------------------------------------------------
describe("updateWindowPosition", () => {
  it("updates the position of the target window", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    const id = ws(store).windows[0].id;
    store.dispatch(updateWindowPosition({ id, position: { x: 200, y: 300 } }));
    expect(ws(store).windows[0].position).toEqual({ x: 200, y: 300 });
  });

  it("does not affect other windows", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    store.dispatch(openWindow({ appType: "file-manager" }));
    const [w1, w2] = ws(store).windows;
    const originalPos = { ...w2.position };
    store.dispatch(updateWindowPosition({ id: w1.id, position: { x: 999, y: 999 } }));
    expect(ws(store).windows[1].position).toEqual(originalPos);
  });
});

// ---------------------------------------------------------------------------
// updateWindowSize
// ---------------------------------------------------------------------------
describe("updateWindowSize", () => {
  it("updates the size of the target window", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    const id = ws(store).windows[0].id;
    store.dispatch(updateWindowSize({ id, size: { width: 800, height: 600 } }));
    expect(ws(store).windows[0].size).toEqual({ width: 800, height: 600 });
  });

  it("does not affect other windows", () => {
    store.dispatch(openWindow({ appType: "terminal" }));
    store.dispatch(openWindow({ appType: "file-manager" }));
    const [w1, w2] = ws(store).windows;
    const originalSize = { ...w2.size };
    store.dispatch(updateWindowSize({ id: w1.id, size: { width: 1, height: 1 } }));
    expect(ws(store).windows[1].size).toEqual(originalSize);
  });
});
