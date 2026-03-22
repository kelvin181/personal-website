import { describe, it, expect } from "vitest";
import { computeNextSelection } from "../selectionUtils";

const nodes = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "e" }];

// ---------------------------------------------------------------------------
// Empty-space click
// ---------------------------------------------------------------------------
describe("empty-space click (nodeId = '')", () => {
  it("clears the selection", () => {
    const { nextSelection } = computeNextSelection(
      "",
      false,
      false,
      null,
      nodes,
      new Set(["a", "b"])
    );
    expect(nextSelection.size).toBe(0);
  });

  it("sets anchor to null", () => {
    const { nextAnchor } = computeNextSelection("", false, false, "a", nodes, new Set());
    expect(nextAnchor).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Single click (no modifiers)
// ---------------------------------------------------------------------------
describe("single click (no modifiers)", () => {
  it("selects only the clicked node", () => {
    const { nextSelection } = computeNextSelection(
      "c",
      false,
      false,
      null,
      nodes,
      new Set(["a", "b"])
    );
    expect([...nextSelection]).toEqual(["c"]);
  });

  it("sets anchor to the clicked node", () => {
    const { nextAnchor } = computeNextSelection("c", false, false, null, nodes, new Set());
    expect(nextAnchor).toBe("c");
  });
});

// ---------------------------------------------------------------------------
// Ctrl/Cmd+click (multi, no shift)
// ---------------------------------------------------------------------------
describe("ctrl+click (multi=true, shift=false)", () => {
  it("adds an unselected node to the selection", () => {
    const { nextSelection } = computeNextSelection(
      "c",
      true,
      false,
      "a",
      nodes,
      new Set(["a", "b"])
    );
    expect(nextSelection.has("a")).toBe(true);
    expect(nextSelection.has("b")).toBe(true);
    expect(nextSelection.has("c")).toBe(true);
  });

  it("removes an already-selected node from the selection", () => {
    const { nextSelection } = computeNextSelection(
      "b",
      true,
      false,
      "a",
      nodes,
      new Set(["a", "b"])
    );
    expect(nextSelection.has("b")).toBe(false);
    expect(nextSelection.has("a")).toBe(true);
  });

  it("updates the anchor", () => {
    const { nextAnchor } = computeNextSelection("c", true, false, "a", nodes, new Set());
    expect(nextAnchor).toBe("c");
  });
});

// ---------------------------------------------------------------------------
// Shift+click (range selection)
// ---------------------------------------------------------------------------
describe("shift+click (shift=true)", () => {
  it("selects the range from anchor to target (forward)", () => {
    const { nextSelection } = computeNextSelection("d", false, true, "b", nodes, new Set());
    expect([...nextSelection].sort()).toEqual(["b", "c", "d"]);
  });

  it("selects the range from anchor to target (backward)", () => {
    const { nextSelection } = computeNextSelection("a", false, true, "d", nodes, new Set());
    expect([...nextSelection].sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("selects a single item when anchor and target are the same", () => {
    const { nextSelection } = computeNextSelection("c", false, true, "c", nodes, new Set());
    expect([...nextSelection]).toEqual(["c"]);
  });

  it("replaces the current selection with the range", () => {
    const { nextSelection } = computeNextSelection("d", false, true, "b", nodes, new Set(["a"]));
    expect(nextSelection.has("a")).toBe(false);
    expect([...nextSelection].sort()).toEqual(["b", "c", "d"]);
  });

  it("does NOT update the anchor (returns undefined)", () => {
    const { nextAnchor } = computeNextSelection("d", false, true, "b", nodes, new Set());
    expect(nextAnchor).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Ctrl+Shift+click (add range to existing selection)
// ---------------------------------------------------------------------------
describe("ctrl+shift+click (multi=true, shift=true)", () => {
  it("adds the range to the existing selection", () => {
    const { nextSelection } = computeNextSelection("e", true, true, "d", nodes, new Set(["a"]));
    expect(nextSelection.has("a")).toBe(true);
    expect(nextSelection.has("d")).toBe(true);
    expect(nextSelection.has("e")).toBe(true);
  });

  it("does NOT update the anchor", () => {
    const { nextAnchor } = computeNextSelection("e", true, true, "d", nodes, new Set());
    expect(nextAnchor).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Shift+click with no anchor (fall back to single select)
// ---------------------------------------------------------------------------
describe("shift+click with no anchor", () => {
  it("falls back to single select when anchor is null", () => {
    const { nextSelection } = computeNextSelection("c", false, true, null, nodes, new Set(["a"]));
    expect([...nextSelection]).toEqual(["c"]);
  });

  it("sets the anchor when there was none", () => {
    const { nextAnchor } = computeNextSelection("c", false, true, null, nodes, new Set());
    expect(nextAnchor).toBe("c");
  });
});

// ---------------------------------------------------------------------------
// Shift+click when anchor is not in the displayed node list
// ---------------------------------------------------------------------------
describe("shift+click when anchor is stale (not in displayed nodes)", () => {
  it("falls back to single select", () => {
    const { nextSelection } = computeNextSelection("c", false, true, "z", nodes, new Set());
    expect([...nextSelection]).toEqual(["c"]);
  });
});
