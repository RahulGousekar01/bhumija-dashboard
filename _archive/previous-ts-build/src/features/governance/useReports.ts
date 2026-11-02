import { useCallback, useState } from "react";
import { useToast } from "../../components/ui";
import { useDashboard } from "../../context/DashboardContext";
import { downloadExcel, downloadPdf, type ReportMeta, type ReportSection } from "../../lib/reports/official";

type Format = "PDF" | "Excel";

/**
 * Generates an official report, logs the export to the audit trail and
 * tells the user the reference number. `busy` is "<id>:pdf" / "<id>:xlsx".
 */
export function useReports() {
  const { api, officer } = useDashboard();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const run = useCallback(
    async (
      id: string,
      format: Format,
      build: () => { meta: ReportMeta; sections: ReportSection[] },
      recordId?: string
    ) => {
      setBusy(`${id}:${format === "PDF" ? "pdf" : "xlsx"}`);
      try {
        const { meta, sections } = build();
        const reference = format === "PDF" ? await downloadPdf(meta, sections) : await downloadExcel(meta, sections);
        await api.logExport?.(meta.title, format, officer, recordId);
        toast({ message: `${format} downloaded · ${reference} · logged in the audit trail` });
      } catch (error) {
        toast({ message: `Report could not be generated: ${(error as Error).message}`, tone: "error" });
      } finally {
        setBusy(null);
      }
    },
    [api, officer, toast]
  );

  return { run, busy };
}
