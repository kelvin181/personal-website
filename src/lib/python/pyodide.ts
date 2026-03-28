interface PyodideInterface {
  runPythonAsync(code: string): Promise<unknown>;
  loadPackage(name: string, options?: { checkIntegrity?: boolean }): Promise<void>;
}

declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string; fullStdLib: boolean }) => Promise<PyodideInterface>;
  }
}

const CDN_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/";

let pyodide: PyodideInterface | null = null;
let loadPromise: Promise<PyodideInterface> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function getPyodide(): Promise<PyodideInterface> {
  if (pyodide) return pyodide;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (!window.loadPyodide) {
      await loadScript(`${CDN_URL}pyodide.js`);
    }
    pyodide = await window.loadPyodide!({
      indexURL: CDN_URL,
      fullStdLib: false,
    });
    return pyodide;
  })();

  loadPromise.catch(() => {
    loadPromise = null;
  });

  return loadPromise;
}

// Wrap user code in a try/finally that captures stdout into a StringIO buffer,
// restores the original stdout even if the code throws, then returns the buffer
// contents as the last expression (Pyodide returns the last evaluated expression).
function wrapWithStdoutCapture(code: string): string {
  const indented = code
    .split("\n")
    .map((line) => "    " + line)
    .join("\n");
  return (
    "import sys, io as _io\n" +
    "_old_stdout = sys.stdout\n" +
    "_buf = _io.StringIO()\n" +
    "sys.stdout = _buf\n" +
    "try:\n" +
    indented +
    "\nfinally:\n" +
    "    sys.stdout = _old_stdout\n" +
    "_buf.getvalue()"
  );
}

export async function runPython(code: string): Promise<{ output: string; error: string | null }> {
  const py = await getPyodide();

  // Auto-load micropip if code uses it (same as daedalOS)
  if (code.includes("import micropip")) {
    await py.loadPackage("micropip", { checkIntegrity: false });
  }

  try {
    const output = (await py.runPythonAsync(wrapWithStdoutCapture(code))) as string;
    return { output, error: null };
  } catch (err: unknown) {
    return {
      output: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
