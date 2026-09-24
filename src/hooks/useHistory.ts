import { useCallback, useReducer } from 'react';

const LIMIT = 100;

interface History<T> {
  past: T[];
  present: T;
  future: T[];
  /** 直前の変更のまとめ用キー。同じキーの連続した変更は 1 回の Undo で戻る */
  lastKey?: string;
}

type Action<T> =
  | { type: 'set'; value: T; coalesce?: string }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; value: T };

function reducer<T>(h: History<T>, action: Action<T>): History<T> {
  switch (action.type) {
    case 'set':
      if (action.coalesce && action.coalesce === h.lastKey) {
        return { ...h, present: action.value, future: [] };
      }
      return {
        past: [...h.past, h.present].slice(-LIMIT),
        present: action.value,
        future: [],
        lastKey: action.coalesce,
      };
    case 'undo': {
      if (!h.past.length) return h;
      return {
        past: h.past.slice(0, -1),
        present: h.past[h.past.length - 1],
        future: [h.present, ...h.future],
      };
    }
    case 'redo': {
      if (!h.future.length) return h;
      return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
    }
    case 'reset':
      return { past: [], present: action.value, future: [] };
  }
}

/** Undo / Redo 付きの状態 */
export function useHistory<T>(initial: T) {
  const [h, dispatch] = useReducer(reducer<T>, { past: [], present: initial, future: [] });
  return {
    present: h.present,
    canUndo: h.past.length > 0,
    canRedo: h.future.length > 0,
    set: useCallback(
      (value: T, coalesce?: string) => dispatch({ type: 'set', value, coalesce }),
      [],
    ),
    undo: useCallback(() => dispatch({ type: 'undo' }), []),
    redo: useCallback(() => dispatch({ type: 'redo' }), []),
    reset: useCallback((value: T) => dispatch({ type: 'reset', value }), []),
  };
}
