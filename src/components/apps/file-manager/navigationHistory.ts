export interface NavHistoryState {
  history: string[];
  historyIndex: number;
}

export function createNavHistory(initialPath: string): NavHistoryState {
  return { history: [initialPath], historyIndex: 0 };
}

export function navigateTo(state: NavHistoryState, path: string): NavHistoryState {
  return {
    history: [...state.history.slice(0, state.historyIndex + 1), path],
    historyIndex: state.historyIndex + 1,
  };
}

export function navGoBack(state: NavHistoryState): NavHistoryState {
  if (state.historyIndex <= 0) return state;
  return { history: state.history, historyIndex: state.historyIndex - 1 };
}

export function navGoForward(state: NavHistoryState): NavHistoryState {
  if (state.historyIndex >= state.history.length - 1) return state;
  return { history: state.history, historyIndex: state.historyIndex + 1 };
}

export function navCanGoBack(state: NavHistoryState): boolean {
  return state.historyIndex > 0;
}

export function navCanGoForward(state: NavHistoryState): boolean {
  return state.historyIndex < state.history.length - 1;
}

export function navCurrentPath(state: NavHistoryState): string {
  return state.history[state.historyIndex];
}
