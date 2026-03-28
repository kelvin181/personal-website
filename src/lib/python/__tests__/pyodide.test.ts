import { describe, it, expect, beforeEach, vi } from "vitest";

// We need to reset module state between tests since pyodide.ts uses module-level singletons.
// Use dynamic import after mocking window.loadPyodide each time.

function makeMockPyodide() {
  const runPythonAsync = vi.fn();
  const loadPackage = vi.fn().mockResolvedValue(undefined);
  return { runPythonAsync, loadPackage };
}

beforeEach(() => {
  // Clean up any script tags added by loadScript
  document.querySelectorAll('script[src*="pyodide"]').forEach((el) => el.remove());
  // Reset window.loadPyodide
  delete window.loadPyodide;
  // Reset module cache so singleton state is fresh
  vi.resetModules();
});

async function importRunPython() {
  const mod = await import("../pyodide");
  return mod.runPython;
}

describe("runPython — successful execution", () => {
  it("returns captured stdout output", async () => {
    const mock = makeMockPyodide();
    mock.runPythonAsync.mockImplementation(async (code: string) => {
      if (code.includes("sys.stdout.getvalue()")) return "Hello World\n";
      return undefined;
    });
    window.loadPyodide = vi.fn().mockResolvedValue(mock);

    const runPython = await importRunPython();
    const result = await runPython('print("Hello World")');

    expect(result.output).toBe("Hello World\n");
    expect(result.error).toBeNull();
  });

  it("returns empty output for code that prints nothing", async () => {
    const mock = makeMockPyodide();
    mock.runPythonAsync.mockImplementation(async (code: string) => {
      if (code.includes("sys.stdout.getvalue()")) return "";
      return undefined;
    });
    window.loadPyodide = vi.fn().mockResolvedValue(mock);

    const runPython = await importRunPython();
    const result = await runPython("x = 42");

    expect(result.output).toBe("");
    expect(result.error).toBeNull();
  });
});

describe("runPython — stdout capture", () => {
  it("prepends StringIO capture code before user code", async () => {
    const mock = makeMockPyodide();
    mock.runPythonAsync.mockImplementation(async (code: string) => {
      if (code.includes("sys.stdout.getvalue()")) return "";
      return undefined;
    });
    window.loadPyodide = vi.fn().mockResolvedValue(mock);

    const runPython = await importRunPython();
    await runPython("print('test')");

    const firstCall = mock.runPythonAsync.mock.calls[0][0] as string;
    expect(firstCall).toContain("import sys");
    expect(firstCall).toContain("import io");
    expect(firstCall).toContain("sys.stdout = io.StringIO()");
    expect(firstCall).toContain("print('test')");
  });

  it("calls sys.stdout.getvalue() to retrieve output", async () => {
    const mock = makeMockPyodide();
    mock.runPythonAsync.mockImplementation(async (code: string) => {
      if (code.includes("sys.stdout.getvalue()")) return "captured";
      return undefined;
    });
    window.loadPyodide = vi.fn().mockResolvedValue(mock);

    const runPython = await importRunPython();
    await runPython("x = 1");

    const secondCall = mock.runPythonAsync.mock.calls[1][0] as string;
    expect(secondCall).toBe("sys.stdout.getvalue()");
  });
});

describe("runPython — error handling", () => {
  it("returns error message when Python code throws", async () => {
    const mock = makeMockPyodide();
    mock.runPythonAsync.mockRejectedValue(new Error("NameError: name 'foo' is not defined"));
    window.loadPyodide = vi.fn().mockResolvedValue(mock);

    const runPython = await importRunPython();
    const result = await runPython("foo");

    expect(result.output).toBe("");
    expect(result.error).toBe("NameError: name 'foo' is not defined");
  });

  it("handles non-Error thrown values", async () => {
    const mock = makeMockPyodide();
    mock.runPythonAsync.mockRejectedValue("string error");
    window.loadPyodide = vi.fn().mockResolvedValue(mock);

    const runPython = await importRunPython();
    const result = await runPython("bad code");

    expect(result.output).toBe("");
    expect(result.error).toBe("string error");
  });
});

describe("runPython — micropip auto-loading", () => {
  it("loads micropip when code contains 'import micropip'", async () => {
    const mock = makeMockPyodide();
    mock.runPythonAsync.mockImplementation(async (code: string) => {
      if (code.includes("sys.stdout.getvalue()")) return "";
      return undefined;
    });
    window.loadPyodide = vi.fn().mockResolvedValue(mock);

    const runPython = await importRunPython();
    await runPython("import micropip\nawait micropip.install('numpy')");

    expect(mock.loadPackage).toHaveBeenCalledWith("micropip", { checkIntegrity: false });
  });

  it("does not load micropip when code does not import it", async () => {
    const mock = makeMockPyodide();
    mock.runPythonAsync.mockImplementation(async (code: string) => {
      if (code.includes("sys.stdout.getvalue()")) return "";
      return undefined;
    });
    window.loadPyodide = vi.fn().mockResolvedValue(mock);

    const runPython = await importRunPython();
    await runPython("print('hello')");

    expect(mock.loadPackage).not.toHaveBeenCalled();
  });
});

describe("getPyodide — singleton loading", () => {
  it("reuses cached instance on second call", async () => {
    const mock = makeMockPyodide();
    mock.runPythonAsync.mockImplementation(async (code: string) => {
      if (code.includes("sys.stdout.getvalue()")) return "";
      return undefined;
    });
    window.loadPyodide = vi.fn().mockResolvedValue(mock);

    const runPython = await importRunPython();
    await runPython("x = 1");
    await runPython("x = 2");

    expect(window.loadPyodide).toHaveBeenCalledTimes(1);
  });

  it("passes correct options to loadPyodide", async () => {
    const mock = makeMockPyodide();
    mock.runPythonAsync.mockImplementation(async (code: string) => {
      if (code.includes("sys.stdout.getvalue()")) return "";
      return undefined;
    });
    window.loadPyodide = vi.fn().mockResolvedValue(mock);

    const runPython = await importRunPython();
    await runPython("x = 1");

    expect(window.loadPyodide).toHaveBeenCalledWith({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/",
      fullStdLib: false,
    });
  });

  it("loads CDN script when window.loadPyodide is not available", async () => {
    const mock = makeMockPyodide();
    mock.runPythonAsync.mockImplementation(async (code: string) => {
      if (code.includes("sys.stdout.getvalue()")) return "";
      return undefined;
    });

    // Simulate: loadPyodide not on window initially, script load sets it
    const appendChildSpy = vi.spyOn(document.head, "appendChild").mockImplementation((el) => {
      // Simulate script loading: set window.loadPyodide and fire onload
      window.loadPyodide = vi.fn().mockResolvedValue(mock);
      (el as HTMLScriptElement).onload?.(new Event("load"));
      return el;
    });

    const runPython = await importRunPython();
    await runPython("x = 1");

    const scriptEl = appendChildSpy.mock.calls[0][0] as HTMLScriptElement;
    expect(scriptEl.src).toContain("pyodide.js");

    appendChildSpy.mockRestore();
  });

  it("resets load promise on failure so next call retries", async () => {
    const mock = makeMockPyodide();
    mock.runPythonAsync.mockImplementation(async (code: string) => {
      if (code.includes("sys.stdout.getvalue()")) return "ok";
      return undefined;
    });

    // First call: loadPyodide rejects
    window.loadPyodide = vi.fn().mockRejectedValue(new Error("network error"));

    const runPython = await importRunPython();
    const result1 = await runPython("x = 1").catch((e: Error) => e);
    expect(result1).toBeInstanceOf(Error);

    // Second call: loadPyodide succeeds (simulates retry)
    window.loadPyodide = vi.fn().mockResolvedValue(mock);
    const result2 = await runPython("x = 2");
    expect(result2.error).toBeNull();
  });
});
