import { useCallback, useEffect, useState } from "react";
import { useDashboard } from "../context/DashboardContext";
import type { DashboardApi } from "../services/dashboardApi";

// Only the read endpoints (get…) are queries; the rest are actions.
export type QueryKey = Extract<keyof DashboardApi, `get${string}`>;
export type QueryData<K extends QueryKey> = Awaited<ReturnType<DashboardApi[K]>>;

export type QueryState<T> =
  | { status: "loading"; data: undefined; error: undefined }
  | { status: "error"; data: undefined; error: Error }
  | { status: "success"; data: T; error: undefined };

export type QueryResult<T> = QueryState<T> & {
  /** True while a request is in flight, including background refreshes. */
  isFetching: boolean;
  /** When the current data arrived. */
  updatedAt: Date | null;
  retry: () => void;
};

const LOADING = { status: "loading", data: undefined, error: undefined } as const;

/**
 * Loads one dashboard module from the API for the current scope.
 * Re-fetches when the role, filters or refresh key change; stale responses
 * are aborted. Existing data stays on screen during a refetch.
 *
 * Swap the body for React Query / SWR if the main app already uses one.
 */
export function useDashboardQuery<K extends QueryKey>(key: K): QueryResult<QueryData<K>> {
  const { api, scope, refreshKey } = useDashboard();
  const [state, setState] = useState<QueryState<QueryData<K>>>(LOADING);
  const [isFetching, setIsFetching] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [attempt, setAttempt] = useState(0);

  const scopeKey = JSON.stringify(scope);

  useEffect(() => {
    const controller = new AbortController();
    setIsFetching(true);
    setState((current) => (current.status === "success" ? current : LOADING));

    const request = api[key](JSON.parse(scopeKey), controller.signal) as Promise<QueryData<K>>;

    request.then(
      (data) => {
        if (controller.signal.aborted) return;
        setState({ status: "success", data, error: undefined });
        setUpdatedAt(new Date());
        setIsFetching(false);
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          data: undefined,
          error: error instanceof Error ? error : new Error(String(error)),
        });
        setIsFetching(false);
      }
    );

    return () => controller.abort();
  }, [api, key, scopeKey, refreshKey, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { ...state, isFetching, updatedAt, retry };
}
