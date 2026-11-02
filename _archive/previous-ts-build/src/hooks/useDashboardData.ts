import { useCallback, useMemo } from "react";
import { useDashboardQuery, type QueryData, type QueryKey, type QueryResult } from "./useDashboardQuery";

export interface DashboardData {
  stock: QueryData<"getStockSummary">;
  processing: QueryData<"getOreProcessing">;
  dumps: QueryData<"getDumpsSummary">;
  payments: QueryData<"getPaymentSummary">;
  permits: QueryData<"getPermitOverview">;
  operations: QueryData<"getOperationsOverview">;
  masterData: QueryData<"getMasterData">;
  trends: QueryData<"getTrends">;
  governance: QueryData<"getGovernanceSnapshot">;
}

type DataResult =
  | { status: "loading"; data: undefined; error: undefined }
  | { status: "error"; data: undefined; error: Error }
  | { status: "success"; data: DashboardData; error: undefined };

/**
 * Loads every module the overview needs. The page renders once all have
 * arrived; refreshes keep the previous data visible.
 */
export function useDashboardData(): DataResult & {
  isFetching: boolean;
  updatedAt: Date | null;
  retry: () => void;
} {
  const queries = {
    stock: useDashboardQuery("getStockSummary"),
    processing: useDashboardQuery("getOreProcessing"),
    dumps: useDashboardQuery("getDumpsSummary"),
    payments: useDashboardQuery("getPaymentSummary"),
    permits: useDashboardQuery("getPermitOverview"),
    operations: useDashboardQuery("getOperationsOverview"),
    masterData: useDashboardQuery("getMasterData"),
    trends: useDashboardQuery("getTrends"),
    governance: useDashboardQuery("getGovernanceSnapshot"),
  };

  const list: QueryResult<QueryData<QueryKey>>[] = Object.values(queries);
  const retries = list.map((query) => query.retry);

  const retry = useCallback(() => {
    retries.forEach((retryQuery) => retryQuery());
    // The retry callbacks are stable, so their identities never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFetching = list.some((query) => query.isFetching);
  const updatedAt = list.reduce<Date | null>(
    (latest, query) => (query.updatedAt && (!latest || query.updatedAt > latest) ? query.updatedAt : latest),
    null
  );

  const dataRefs = list.map((query) => query.data);
  const data = useMemo(
    () =>
      dataRefs.every((value) => value !== undefined)
        ? (Object.fromEntries(
            Object.keys(queries).map((name, index) => [name, dataRefs[index]])
          ) as unknown as DashboardData)
        : undefined,
    // One dependency per query result; the list order is fixed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dataRefs
  );

  const failed = list.find((query) => query.status === "error");
  if (failed?.error) {
    return { status: "error", data: undefined, error: failed.error, isFetching, updatedAt, retry };
  }

  if (!data) {
    return { status: "loading", data: undefined, error: undefined, isFetching, updatedAt, retry };
  }

  return { status: "success", data, error: undefined, isFetching, updatedAt, retry };
}
