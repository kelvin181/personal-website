/** Represents a minimal node shape needed for selection computation. */
export interface SelectableNode {
  id: string;
}

export interface SelectionResult {
  /** The updated selection set. */
  nextSelection: Set<string>;
  /**
   * The new anchor id, or `null` if the anchor should be cleared.
   * `undefined` means "keep the current anchor unchanged" (shift-click).
   */
  nextAnchor: string | null | undefined;
}

/**
 * Pure function that computes the next selection state given a click event.
 *
 * @param nodeId   - The id of the clicked node, or "" for empty-space clicks.
 * @param multi    - True when Ctrl/Cmd is held (toggle behaviour).
 * @param shift    - True when Shift is held (range selection).
 * @param anchorId - The current anchor (last non-shift-clicked node id).
 * @param orderedNodes - Nodes in display order.
 * @param currentSelection - The currently selected node ids.
 */
export function computeNextSelection(
  nodeId: string,
  multi: boolean,
  shift: boolean,
  anchorId: string | null,
  orderedNodes: SelectableNode[],
  currentSelection: Set<string>
): SelectionResult {
  if (!nodeId) {
    return { nextSelection: new Set(), nextAnchor: null };
  }

  if (shift && anchorId) {
    const anchorIdx = orderedNodes.findIndex((n) => n.id === anchorId);
    const targetIdx = orderedNodes.findIndex((n) => n.id === nodeId);
    if (anchorIdx !== -1 && targetIdx !== -1) {
      const [from, to] = anchorIdx < targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx];
      const rangeIds = new Set(orderedNodes.slice(from, to + 1).map((n) => n.id));
      const nextSelection = multi ? new Set([...currentSelection, ...rangeIds]) : rangeIds;
      return { nextSelection, nextAnchor: undefined }; // anchor stays fixed
    }
  }

  // Non-shift path — update anchor to this node
  if (multi) {
    const next = new Set(currentSelection);
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    return { nextSelection: next, nextAnchor: nodeId };
  }

  return { nextSelection: new Set([nodeId]), nextAnchor: nodeId };
}
