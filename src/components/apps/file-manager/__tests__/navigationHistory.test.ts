import { describe, it, expect } from "vitest";
import {
  createNavHistory,
  navigateTo,
  navGoBack,
  navGoForward,
  navCanGoBack,
  navCanGoForward,
  navCurrentPath,
  type NavHistoryState,
} from "../navigationHistory";

// ---------------------------------------------------------------------------
// createNavHistory
// ---------------------------------------------------------------------------
describe("createNavHistory", () => {
  it("initialises history with the given path", () => {
    const state = createNavHistory("/home/user");
    expect(state.history).toEqual(["/home/user"]);
  });

  it("sets historyIndex to 0", () => {
    const state = createNavHistory("/home/user");
    expect(state.historyIndex).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// navCurrentPath
// ---------------------------------------------------------------------------
describe("navCurrentPath", () => {
  it("returns the path at the current index", () => {
    const state: NavHistoryState = { history: ["/", "/home", "/home/user"], historyIndex: 2 };
    expect(navCurrentPath(state)).toBe("/home/user");
  });

  it("returns the first path when index is 0", () => {
    const state = createNavHistory("/home/user");
    expect(navCurrentPath(state)).toBe("/home/user");
  });
});

// ---------------------------------------------------------------------------
// navCanGoBack / navCanGoForward
// ---------------------------------------------------------------------------
describe("navCanGoBack", () => {
  it("returns false at the start of history", () => {
    expect(navCanGoBack(createNavHistory("/home/user"))).toBe(false);
  });

  it("returns true after navigating forward once", () => {
    const state = navigateTo(createNavHistory("/home/user"), "/home/user/projects");
    expect(navCanGoBack(state)).toBe(true);
  });
});

describe("navCanGoForward", () => {
  it("returns false at the end of history", () => {
    const state = navigateTo(createNavHistory("/home/user"), "/home/user/projects");
    expect(navCanGoForward(state)).toBe(false);
  });

  it("returns true after going back", () => {
    const state = navGoBack(navigateTo(createNavHistory("/home/user"), "/home/user/projects"));
    expect(navCanGoForward(state)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// navigateTo
// ---------------------------------------------------------------------------
describe("navigateTo", () => {
  it("appends the new path to history", () => {
    const state = navigateTo(createNavHistory("/home/user"), "/home/user/projects");
    expect(state.history).toEqual(["/home/user", "/home/user/projects"]);
  });

  it("advances the index by 1", () => {
    const state = navigateTo(createNavHistory("/home/user"), "/home/user/projects");
    expect(state.historyIndex).toBe(1);
  });

  it("truncates forward history when navigating from mid-history", () => {
    // Build: /home/user → /a → /b, then go back twice, then navigate to /c
    let state = navigateTo(createNavHistory("/home/user"), "/a");
    state = navigateTo(state, "/b");
    state = navGoBack(state); // at /a
    state = navGoBack(state); // at /home/user
    state = navigateTo(state, "/c");

    expect(state.history).toEqual(["/home/user", "/c"]);
    expect(state.historyIndex).toBe(1);
  });

  it("truncates only entries after the current index, not before", () => {
    let state = navigateTo(createNavHistory("/home/user"), "/a");
    state = navigateTo(state, "/b");
    state = navGoBack(state); // at /a (index 1)
    state = navigateTo(state, "/c"); // should keep /home/user and /a

    expect(state.history).toEqual(["/home/user", "/a", "/c"]);
    expect(state.historyIndex).toBe(2);
  });

  it("does not mutate the original state", () => {
    const original = createNavHistory("/home/user");
    navigateTo(original, "/home/user/projects");
    expect(original.history).toEqual(["/home/user"]);
    expect(original.historyIndex).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// navGoBack
// ---------------------------------------------------------------------------
describe("navGoBack", () => {
  it("decrements the index by 1", () => {
    const state = navGoBack(navigateTo(createNavHistory("/home/user"), "/home/user/projects"));
    expect(state.historyIndex).toBe(0);
  });

  it("returns the correct current path after going back", () => {
    const state = navGoBack(navigateTo(createNavHistory("/home/user"), "/home/user/projects"));
    expect(navCurrentPath(state)).toBe("/home/user");
  });

  it("does not go below index 0", () => {
    const state = createNavHistory("/home/user");
    const result = navGoBack(state);
    expect(result).toBe(state); // same reference returned — no change
  });

  it("does not mutate history array", () => {
    const state = navigateTo(createNavHistory("/home/user"), "/a");
    const result = navGoBack(state);
    expect(result.history).toBe(state.history); // same array reference
  });
});

// ---------------------------------------------------------------------------
// navGoForward
// ---------------------------------------------------------------------------
describe("navGoForward", () => {
  it("increments the index by 1", () => {
    let state = navigateTo(createNavHistory("/home/user"), "/home/user/projects");
    state = navGoBack(state);
    state = navGoForward(state);
    expect(state.historyIndex).toBe(1);
  });

  it("returns the correct current path after going forward", () => {
    let state = navigateTo(createNavHistory("/home/user"), "/home/user/projects");
    state = navGoBack(state);
    state = navGoForward(state);
    expect(navCurrentPath(state)).toBe("/home/user/projects");
  });

  it("does not go beyond the last history entry", () => {
    const state = navigateTo(createNavHistory("/home/user"), "/home/user/projects");
    const result = navGoForward(state);
    expect(result).toBe(state); // same reference returned — no change
  });

  it("does not mutate history array", () => {
    let state = navigateTo(createNavHistory("/home/user"), "/a");
    state = navGoBack(state);
    const result = navGoForward(state);
    expect(result.history).toBe(state.history);
  });
});

// ---------------------------------------------------------------------------
// Multi-step round-trip
// ---------------------------------------------------------------------------
describe("multi-step navigation round-trip", () => {
  it("back then forward restores original state shape", () => {
    let state = createNavHistory("/home/user");
    state = navigateTo(state, "/a");
    state = navigateTo(state, "/b");
    state = navigateTo(state, "/c");

    state = navGoBack(state);
    state = navGoBack(state);
    expect(navCurrentPath(state)).toBe("/a");

    state = navGoForward(state);
    expect(navCurrentPath(state)).toBe("/b");

    state = navGoForward(state);
    expect(navCurrentPath(state)).toBe("/c");

    expect(navCanGoForward(state)).toBe(false);
    expect(navCanGoBack(state)).toBe(true);
  });

  it("new navigation from mid-history disables forward", () => {
    let state = createNavHistory("/home/user");
    state = navigateTo(state, "/a");
    state = navigateTo(state, "/b");
    state = navGoBack(state); // at /a
    state = navigateTo(state, "/x"); // forward history (/b) discarded

    expect(navCanGoForward(state)).toBe(false);
    expect(navCurrentPath(state)).toBe("/x");
    expect(state.history).toEqual(["/home/user", "/a", "/x"]);
  });
});
