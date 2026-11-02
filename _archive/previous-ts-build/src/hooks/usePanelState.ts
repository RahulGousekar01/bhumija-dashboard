import { useCallback, useEffect, useState } from "react";
import { readUrlParams, subscribeToUrl, writeUrlParams } from "../lib/urlState";

interface PanelState {
  panelId: string | null;
  tab: string | null;
}

const readPanel = (): PanelState => {
  const params = readUrlParams();
  return { panelId: params.get("panel"), tab: params.get("tab") };
};

const HISTORY_MARKER = { bhPanel: true };

/**
 * Which drawer is open, mirrored in `?panel=<item id>&tab=<tab id>`.
 *
 * Opening pushes a history entry, so the browser Back button closes the
 * drawer. Switching items or tabs inside the drawer replaces the entry.
 */
export function usePanelState() {
  const [state, setState] = useState<PanelState>(readPanel);

  useEffect(() => subscribeToUrl(() => setState(readPanel())), []);

  const open = useCallback((panelId: string, tab?: string) => {
    const alreadyOpen = Boolean(readUrlParams().get("panel"));
    writeUrlParams({ panel: panelId, tab }, alreadyOpen ? {} : { push: true, state: HISTORY_MARKER });
    setState({ panelId, tab: tab ?? null });
  }, []);

  const close = useCallback(() => {
    const pushedByUs = (window.history.state as typeof HISTORY_MARKER | null)?.bhPanel;
    if (pushedByUs) {
      // popstate updates the state.
      window.history.back();
    } else {
      // Opened from a shared link: there is no entry to go back to.
      writeUrlParams({ panel: undefined, tab: undefined });
      setState({ panelId: null, tab: null });
    }
  }, []);

  const setTab = useCallback((tab: string) => {
    writeUrlParams({ tab });
    setState((current) => ({ ...current, tab }));
  }, []);

  return { ...state, open, close, setTab };
}
