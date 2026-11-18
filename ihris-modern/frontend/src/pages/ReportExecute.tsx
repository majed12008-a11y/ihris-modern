import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";
import {
  Download,
  Table,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  SearchX,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Pill from "@/components/ui/Pill";
import {
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "@/components/ui/StateViews";
import { formatNumber } from "@/lib/format";

interface ReportExecutionResult {
  id: number;
  reportDefinition: {
    id: number;
    name: string;
    type: string;
  };
  executedByUser: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
  };
  status: string;
  startedAt: string;
  completedAt: string | null;
  result: any;
  errorMessage: string | null;
  rowCount: number;
  executionTimeMs: number | null;
}

const PAGE_SIZES = [25, 50, 100];

export default function ReportExecute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportId = parseInt(id || "0", 0);
  const [exporting, setExporting] = useState<"csv" | "xlsx" | "pdf" | null>(
    null
  );
  const [filterText, setFilterText] = useState("");
  const [pageSize, setPageSize] = useState(50);

  const { data, isLoading, error, refetch } = useQuery<ReportExecutionResult>({
    queryKey: ["report-execution", reportId],
    queryFn: async () => {
      const res = await api.get(`/reports/executions/${reportId}`);
      return res.data;
    },
    enabled: !!reportId,
  });

  /**
   * تنزيل من الخادم (CSV/Excel/PDF) — التصدير على الخادم يضمن تشكيل العربية
   * واتجاه RTL في PDF، وورقة RTL في Excel (GAP-L-002).
   */
  const downloadExport = async (format: "csv" | "xlsx" | "pdf", definitionId: number, name: string) => {
    setExporting(format);
    try {
      const res = await api.post(`/reports/${definitionId}/export?format=${format}`, {}, {
        responseType: "blob",
      });

      const disposition = String(res.headers?.["content-disposition"] ?? "");
      const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
      const plain = /filename="([^"]+)"/i.exec(disposition);
      const fallback = `report-${definitionId}.${format}`;
      let filename = fallback;
      if (encoded) {
        try {
          filename = decodeURIComponent(encoded[1]);
        } catch {
          filename = plain?.[1] ?? fallback;
        }
      } else if (plain) {
        filename = plain[1];
      }

      const blob = new Blob([res.data], {
        type: String(res.headers?.["content-type"] ?? "application/octet-stream"),
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      toast.success(`تم تنزيل ${name} بصيغة ${format.toUpperCase()}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "تعذر تصدير التقرير، حاول مرة أخرى";
      toast.error(message);
    } finally {
      setExporting(null);
    }
  };

  const downloadJson = () => {
    if (!data) return;
    const dataStr = JSON.stringify(data.result, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${data.reportDefinition.name}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تنزيل التقرير بصيغة JSON");
  };

  const rows: Array<Record<string, unknown>> = useMemo(() => {
    const raw = data?.result?.data;
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const columns: string[] = useMemo(() => {
    const rawColumns = data?.result?.columns;
    if (Array.isArray(rawColumns) && rawColumns.length > 0) {
      return rawColumns.map((column: unknown) => String(column));
    }
    return rows.length > 0 ? Object.keys(rows[0]) : [];
  }, [data, rows]);

  const filteredRows = useMemo(() => {
    const term = filterText.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [rows, filterText]);

  const visibleRows =
    pageSize > 0 ? filteredRows.slice(0, pageSize) : filteredRows;

  if (isLoading) {
    return (
      <div className="stack">
        <PageHeader
          title="تنفيذ تقرير"
          subtitle="جاري تحميل نتائج التنفيذ…"
          backTo="/reports"
          backLabel="رجوع إلى التقارير"
        />
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">نتائج التقرير</h2>
          </div>
          <div className="table-wrap">
            <table className="data-table data-table--dense">
              <thead>
                <tr>
                  {Array.from({ length: 4 }, (_, index) => (
                    <th key={index} scope="col">
                      <span className="sr-only">عمود</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <TableSkeleton rows={6} cols={4} widths={[160, 120, 90, 70]} />
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="stack">
        <PageHeader
          title="تنفيذ تقرير"
          backTo="/reports"
          backLabel="رجوع إلى التقارير"
        />
        <ErrorState
          title="حدث خطأ"
          message={
            error instanceof Error ? error.message : "التقرير غير موجود"
          }
          onRetry={() => refetch()}
        />
        <div>
          <a
            className="btn btn-ghost"
            href="/reports"
            onClick={(event) => {
              event.preventDefault();
              navigate("/reports");
            }}
          >
            العودة إلى التقارير
          </a>
        </div>
      </div>
    );
  }

  const isRunning = data.status === "running";
  const statusTone =
    data.status === "completed"
      ? "ok"
      : data.status === "running"
        ? "warn"
        : "danger";
  const statusLabel =
    data.status === "completed"
      ? "مكتمل"
      : data.status === "running"
        ? "جاري التنفيذ"
        : "فشل";

  const noRows = !isRunning && rows.length === 0;
  const noMatches = !isRunning && rows.length > 0 && filteredRows.length === 0;

  return (
    <div className="stack">
      <PageHeader
        title={`تقرير: ${data.reportDefinition.name}`}
        subtitle={
          <>
            رقم التقرير: #{data.id} · <Pill tone={statusTone}>{statusLabel}</Pill>
          </>
        }
        backTo="/reports"
        backLabel="رجوع إلى التقارير"
        actions={
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={downloadJson}
            >
              <Download aria-hidden="true" />
              تحميل JSON
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                downloadExport(
                  "csv",
                  data.reportDefinition.id,
                  data.reportDefinition.name
                )
              }
              disabled={exporting !== null}
            >
              <Table aria-hidden="true" />
              {exporting === "csv" ? "جارٍ التصدير…" : "CSV"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                downloadExport(
                  "xlsx",
                  data.reportDefinition.id,
                  data.reportDefinition.name
                )
              }
              disabled={exporting !== null}
            >
              <FileSpreadsheet aria-hidden="true" />
              {exporting === "xlsx" ? "جارٍ التصدير…" : "Excel"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                downloadExport(
                  "pdf",
                  data.reportDefinition.id,
                  data.reportDefinition.name
                )
              }
              disabled={exporting !== null}
            >
              <FileText aria-hidden="true" />
              {exporting === "pdf" ? "جارٍ التصدير…" : "PDF عربي"}
            </button>
          </>
        }
      />

      {data.errorMessage && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle aria-hidden="true" />
          <div>
            <strong>خطأ في التنفيذ.</strong> {data.errorMessage}
          </div>
        </div>
      )}

      <section className="card">
        <div className="form-section-head">
          <span className="form-section-num" aria-hidden="true">
            1
          </span>
          <h2 className="form-section-title">معايير العرض</h2>
          <span className="form-section-note">
            تصفية الصفوف المعروضة دون إعادة تنفيذ التقرير
          </span>
        </div>
        <div className="form-body">
          <div className="field">
            <label className="label" htmlFor="result-filter">
              بحث في النتائج
            </label>
            <input
              className="input"
              id="result-filter"
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="ابحث في قيم الصفوف…"
              spellCheck={false}
            />
            <span className="hint">
              يطابق أي قيمة في الصفوف المسترجعة.
            </span>
          </div>

          <div className="field">
            <label className="label" htmlFor="result-page-size">
              عدد الصفوف المعروضة
            </label>
            <select
              className="select"
              id="result-page-size"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} صف
                </option>
              ))}
              <option value={0}>كل الصفوف</option>
            </select>
            <span className="hint">
              إجمالي الصفوف المسترجعة: {formatNumber(rows.length)}.
            </span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">نتائج التقرير</h2>
          <span className="card-sub" aria-live="polite">
            {isRunning
              ? "جاري التنفيذ…"
              : `عرض ${formatNumber(visibleRows.length)} من ${formatNumber(
                  filteredRows.length
                )} صف`}
          </span>
        </div>

        {!noRows && !noMatches && (
          <div className="table-wrap">
            <table className="data-table data-table--dense">
              <thead>
                <tr>
                  {columns.length > 0 ? (
                    columns.map((column) => (
                      <th key={column} scope="col">
                        {column}
                      </th>
                    ))
                  ) : (
                    <th scope="col">لا توجد بيانات</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {isRunning && (
                  <TableSkeleton
                    rows={5}
                    cols={Math.max(columns.length, 3)}
                    widths={[160, 120, 90, 70, 60]}
                  />
                )}

                {!isRunning &&
                  visibleRows.map((row, index) => (
                    <tr key={index}>
                      {columns.map((column) => {
                        const value = row[column];
                        return (
                          <td key={column}>
                            {value === null || value === undefined
                              ? "—"
                              : String(value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {noRows && (
          <EmptyState
            icon={Table}
            title="لا توجد بيانات معروضة"
            text="لم يُرجع التقرير أي صفوف. راجع تعريف التقرير أو أعد تشغيله."
          />
        )}

        {noMatches && (
          <EmptyState
            icon={SearchX}
            title="لا نتائج مطابقة"
            text={`لا يوجد صف يطابق «${filterText.trim()}». جرّب مصطلحاً آخر.`}
            action={
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setFilterText("")}
              >
                مسح البحث
              </button>
            }
          />
        )}
      </section>
    </div>
  );
}
