import { useState, useCallback } from "react";

/**
 * Reusable hook for dialog state management.
 *
 * Usage:
 *   const editDialog = useDialogState();
 *   editDialog.open(item)     → { open: true, item }
 *   editDialog.close()        → { open: false, item: null }
 *   editDialog.state.open     → boolean
 *   editDialog.state.item     → item | null
 */
export function useDialogState(initialItem = null) {
  const [state, setState] = useState({ open: false, item: initialItem });

  const open = useCallback((item = null) => {
    setState({ open: true, item });
  }, []);

  const close = useCallback(() => {
    setState({ open: false, item: null });
  }, []);

  return { state, open, close };
}
