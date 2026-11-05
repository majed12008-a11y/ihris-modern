import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { ArrowLeft } from "lucide-react";

interface ReportDetail {
  id: number;
  name: string;
  description: string | null;
  type: string;
  definition: any;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUser: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
  };
  executions: Array<{
    id: number;
    status: string;
    startedAt: string;
    completedAt: string | null;
    rowCount: number;
    executedByUser: {
      id: number;
      firstname: string;
      lastname: string;
    };
  }>;
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportId = parseInt(id || "0", 10);

  const { data, isLoading, error } = useQuery<ReportDetail>({
    queryKey: ["report", reportId],
    queryFn: async () => {
      const res = await api.get(`/reports/${reportId}`);
      return res.data;
    },
    enabled: !!reportId,
  });

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
        <div className="bg-white p-8 rounded-xl shadow border border-red-100 text-center">
          <h2 className="text-red-600 font-bold mb-2">⚠️ لم يتم العثور على التقرير</h2>
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
          <h1 className="text-2xl font-bold text-gray-800">{data.name}</h1>
          <p className="text-gray-600">رقم التقرير: #{data.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            معلومات التقرير
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="text-gray-400" style={{ width: 20, height: 20 }}></div>
              <div>
                <div className="font-medium">{data.name}</div>
                <div className="text-xs text-gray-500">نوع التقرير: {data.type}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-gray-400" style={{ width: 20, height: 20 }}></div>
              <div>
                <div className="font-medium">
                  {data.createdByUser.firstname} {data.createdByUser.lastname}
                </div>
                <div className="text-xs text-gray-500">م creado بواسطة</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-gray-400" style={{ width: 20, height: 20 }}></div>
              <div>
                <div className="font-medium">
                  {new Date(data.createdAt).toLocaleDateString("ar-SA")}
                </div>
                <div className="text-xs text-gray-500">تاريخ الإنشاء</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-gray-400" style={{ width: 20, height: 20 }}></div>
              <div>
                <div className="font-medium">
                  {new Date(data.updatedAt).toLocaleDateString("ar-SA")}
                </div>
                <div className="text-xs text-gray-500">آخر تعديل</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            الحالة والإعدادات
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  data.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}
              >
                {data.isEnabled ? "مفعل" : "معطل"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">عدد عمليات التنفيذ:</span>
              <span className="font-mono text-gray-800">{data.executions?.length || 0}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">نوع التقرير:</span>
              <span className="font-mono text-gray-800">{data.type}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            تعريف التقرير (JSON)
          </h3>
          <div className="bg-gray-900 p-4 rounded-lg font-mono text-xs text-green-400 overflow-x-auto">
            <pre>{JSON.stringify(data.definition, null, 2)}</pre>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            سجل العمليات الأخيرة
          </h3>
          {(data.executions?.length || 0) > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 font-semibold text-gray-700">تاريخ التنفيذ</th>
                  <th className="px-4 py-2 font-semibold text-gray-700">الحالة</th>
                  <th className="px-4 py-2 font-semibold text-gray-700">عدد السجلات</th>
                  <th className="px-4 py-2 font-semibold text-gray-700">المستخدم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.executions.map((ex) => (
                  <tr key={ex.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {new Date(ex.startedAt).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ex.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : ex.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {ex.status === "completed" ? "مكتمل" : ex.status === "failed" ? "فشل" : "جاري"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{ex.rowCount}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {ex.executedByUser.firstname} {ex.executedByUser.lastname}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500 italic text-center py-8">
              لا توجد عمليات تنفيذ لهذا التقرير بعد.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
