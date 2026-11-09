import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { ArrowRight, Layers, Wallet, Tag, Briefcase, Building2 } from "lucide-react";

/** GAP-M-004 — صفحة تفاصيل المسمى الوظيفي مع المناصب المرتبطة. */

interface JobDetailData {
  id: number;
  title: string;
  code: string | null;
  description: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  salaryGrade: { id: number; name: string } | null;
  cadre: { id: number; name: string } | null;
  classification: { id: number; name: string } | null;
  positionsCount: number;
  positions: Array<{
    id: number;
    code: string | null;
    title: string | null;
    source: string | null;
    posType: { id: number; name: string } | null;
    status: { id: number; name: string } | null;
    facility: { id: number; name: string } | null;
    department: { id: number; name: string } | null;
    proposedHiringDate: string | null;
  }>;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ar-SA");
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const jobId = id ? parseInt(id, 10) : null;

  const { data, isLoading, error } = useQuery<JobDetailData>({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const res = await api.get(`/jobs/${jobId}`);
      return res.data;
    },
    enabled: !!jobId,
  });

  if (isLoading) return <div className="p-6">جارٍ تحميل تفاصيل المسمى الوظيفي...</div>;

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-white p-8 rounded-xl shadow border border-red-100 max-w-md text-center mx-auto">
          <div className="text-red-600 font-bold mb-2">⚠️ تعذّر تحميل المسمى الوظيفي</div>
          <p className="text-gray-600 text-sm mb-4">
            {error instanceof Error ? error.message : "المسمى غير موجود"}
          </p>
          <button
            onClick={() => navigate("/jobs")}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            العودة للقائمة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/jobs")}
          className="text-primary-600 hover:text-primary-800"
          title="العودة"
        >
          <ArrowRight size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{data.title}</h1>
          <p className="text-gray-600">تفاصيل المسمى الوظيفي والمناصب المرتبطة به</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow border border-gray-100 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="bg-primary-50 text-primary-600 p-3 rounded-xl">
              <Layers size={22} />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">البيانات الأساسية</h2>
              <p className="text-xs text-gray-500">رقم المسمى: {data.id}</p>
            </div>
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500 mb-1">المسمى الوظيفي</dt>
              <dd className="font-medium text-gray-800">{data.title}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">الكود</dt>
              <dd className="font-medium text-gray-800 font-mono">{data.code || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">درجة الراتب</dt>
              <dd className="font-medium text-gray-800 flex items-center gap-2">
                <Wallet size={16} className="text-gray-400" />
                {data.salaryGrade?.name || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">الفئة الوظيفية</dt>
              <dd className="font-medium text-gray-800">{data.cadre?.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">التصنيف الوظيفي</dt>
              <dd className="font-medium text-gray-800 flex items-center gap-2">
                <Tag size={16} className="text-gray-400" />
                {data.classification?.name || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">الإصدار</dt>
              <dd className="font-medium text-gray-800">v{data.version}</dd>
            </div>
            {data.description && (
              <div className="md:col-span-2">
                <dt className="text-gray-500 mb-1">الوصف</dt>
                <dd className="text-gray-800 whitespace-pre-line">{data.description}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500 mb-1">تاريخ الإنشاء</dt>
              <dd className="font-medium text-gray-800">{formatDate(data.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">آخر تحديث</dt>
              <dd className="font-medium text-gray-800">{formatDate(data.updatedAt)}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
              <Briefcase size={22} />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">المناصب المرتبطة</h2>
              <p className="text-xs text-gray-500">{data.positionsCount} منصب</p>
            </div>
          </div>

          {data.positions.length === 0 ? (
            <p className="text-sm text-gray-500">لا توجد مناصب مرتبطة بهذا المسمى بعد.</p>
          ) : (
            <ul className="space-y-3">
              {data.positions.map((position) => (
                <li
                  key={position.id}
                  className="border border-gray-100 rounded-lg p-3 text-sm space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-800">
                      {position.title || `منصب #${position.id}`}
                    </span>
                    {position.code && (
                      <span className="text-xs font-mono text-gray-500">{position.code}</span>
                    )}
                  </div>
                  {position.facility && (
                    <div className="text-gray-600 flex items-center gap-1">
                      <Building2 size={14} className="text-gray-400" />
                      {position.facility.name}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                    <span>النوع: {position.posType?.name || "—"}</span>
                    <span>الحالة: {position.status?.name || "—"}</span>
                    <span>المصدر: {position.source || "—"}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
