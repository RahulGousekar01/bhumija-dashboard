/*
 * Minimal URL query-string state, built on the History API.
 *
 * The project has no router. If the host app uses one, replace these three
 * functions with its equivalents; nothing else touches `window.location`.
 */

export type UrlParams = Record<string, string | undefined>;

export const readUrlParams = (): URLSearchParams => new URLSearchParams(window.location.search);

/**
 * Merge `updates` into the query string. `undefined` removes a key.
 * `push` adds a history entry (so Back undoes it); otherwise the entry is replaced.
 */
export function writeUrlParams(updates: UrlParams, { push = false, state }: { push?: boolean; state?: unknown } = {}) {
  const params = readUrlParams();

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === "") params.delete(key);
    else params.set(key, value);
  }

  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;

  if (url === `${window.location.pathname}${window.location.search}${window.location.hash}` && !push) return;

  if (push) window.history.pushState(state ?? null, "", url);
  else window.history.replaceState(state ?? window.history.state, "", url);
}

export const subscribeToUrl = (listener: () => void): (() => void) => {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
};
