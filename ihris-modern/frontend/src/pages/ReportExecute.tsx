import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";
import { ArrowLeft, Download, Table, FileSpreadsheet, FileText } from "lucide-react";

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

export default function ReportExecute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportId = parseInt(id || "0", 0);
  const [exporting, setExporting] = useState<"csv" | "xlsx" | "pdf" | null>(null);

  const { data, isLoading, error } = useQuery<ReportExecutionResult>({
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">جاري تحميل التقرير...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow border border-red-100 max-w-md text-center">
          <div className="text-red-600 font-bold mb-2">⚠️ حدث خطأ</div>
          <p className="text-gray-600 text-sm mb-4">{error instanceof Error ? error.message : "التقرير غير موجود"}</p>
          <button
            onClick={() => navigate("/reports")}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            العودة إلى التقارير
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/reports")}
          className="text-primary-600 hover:text-primary-800 flex items-center gap-2"
        >
          <ArrowLeft size={18} /> العودة إلى التقارير
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">تقرير: {data.reportDefinition.name}</h1>
          <p className="text-gray-600">رقم التقرير: #{data.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">حالة التقرير</h3>
          <div className="flex items-center gap-3">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                data.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : data.status === "running"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {data.status === "completed" ? "مكتمل" : data.status === "running" ? "جاري التنفيذ" : "فشل"}
            </span>
            <span className="text-xs text-gray-500">{new Date(data.startedAt).toLocaleString("ar-SA")}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">السجلات المسترجعة</h3>
          <div className="text-2xl font-bold text-gray-800">{data.rowCount}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">وقت التنفيذ</h3>
          <div className="text-2xl font-bold text-gray-800">
            {data.executionTimeMs ? `${data.executionTimeMs} مللي ثانية` : "غير محدد"}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">بيانات التقرير</h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const dataStr = JSON.stringify(data.result, null, 2);
                const blob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `report-${data.reportDefinition.name}-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("تم تنزيل التقرير بصيغة JSON");
              }}
              className="bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition flex items-center gap-1"
            >
              <Download size={16} /> تحميل JSON
            </button>
            <button
              onClick={() =>
                downloadExport("csv", data.reportDefinition.id, data.reportDefinition.name)
              }
              disabled={exporting !== null}
              className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-1 disabled:opacity-60"
            >
              <Table size={16} /> {exporting === "csv" ? "جارٍ التصدير..." : "CSV"}
            </button>
            <button
              onClick={() =>
                downloadExport("xlsx", data.reportDefinition.id, data.reportDefinition.name)
              }
              disabled={exporting !== null}
              className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 transition flex items-center gap-1 disabled:opacity-60"
            >
              <FileSpreadsheet size={16} /> {exporting === "xlsx" ? "جارٍ التصدير..." : "Excel"}
            </button>
            <button
              onClick={() =>
                downloadExport("pdf", data.reportDefinition.id, data.reportDefinition.name)
              }
              disabled={exporting !== null}
              className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center gap-1 disabled:opacity-60"
            >
              <FileText size={16} /> {exporting === "pdf" ? "جارٍ التصدير..." : "PDF عربي"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                {data.result?.data?.length > 0 ? (
                  Object.keys(data.result.data[0]).map((key) => (
                    <th key={key} className="px-4 py-3 font-semibold text-gray-700">
                      {key}
                    </th>
                  ))
                ) : (
                  <th className="px-4 py-3 text-gray-500">لا توجد بيانات</th>
                )}
              </tr>
            </thead>
            <tbody>
              {(data.result?.data || []).map((row: any, index: number) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  {Object.values(row).map((value, idx) => (
                    <td key={idx} className="px-4 py-3 text-gray-600">
                      {value === null || value === undefined ? "-" : String(value)}
                    </td>
                  ))}
                </tr>
              ))}
              {data.result?.data?.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-gray-500 text-center" colSpan={Object.keys(data.result?.data?.[0] || {}).length}>
                    لا توجد بيانات معروضة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-red-700 mb-2">خطأ في التنفيذ</h3>
          <p className="text-sm text-red-600">{data.errorMessage}</p>
        </div>
      )}
    </div>
  );
}
