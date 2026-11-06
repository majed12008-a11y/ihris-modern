import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { ArrowRight, Pencil, Building2, MapPin, Briefcase } from "lucide-react";

interface FacilityDetailData {
  id: number;
  name: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  facilityType: { id: number; name: string } | null;
  country: { id: number; name: string } | null;
  region: { id: number; name: string } | null;
  district: { id: number; name: string } | null;
  county: { id: number; name: string } | null;
  positionsCount: number;
  positions: Array<{
    id: number;
    code: string | null;
    title: string | null;
    job: { id: number; title: string } | null;
    department: { id: number; name: string } | null;
    posType: { id: number; name: string } | null;
    status: { id: number; name: string } | null;
    postedDate: string | null;
  }>;
}

export default function FacilityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const facilityId = id ? parseInt(id, 10) : null;
  const currentUser = useAuthStore((state) => state.user);
  const canWrite = currentUser?.role === "admin" || currentUser?.role === "hr_manager";

  const { data, isLoading, error } = useQuery<FacilityDetailData>({
    queryKey: ["facility", facilityId],
    queryFn: async () => {
      const res = await api.get(`/facilities/${facilityId}`);
      return res.data;
    },
    enabled: !!facilityId,
  });

  if (isLoading) return <div className="p-6">جاري تحميل بيانات المنشأة...</div>;

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-white p-8 rounded-xl shadow border border-red-100 max-w-md text-center mx-auto">
          <div className="text-red-600 font-bold mb-2">⚠️ تعذّر تحميل المنشأة</div>
          <p className="text-gray-600 text-sm mb-4">
            {error instanceof Error ? error.message : "المنشأة غير موجودة"}
          </p>
          <button
            onClick={() => navigate("/facilities")}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            العودة للقائمة
          </button>
        </div>
      </div>
    );
  }

  const location = [data.country?.name, data.region?.name, data.district?.name, data.county?.name]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/facilities")}
            className="text-primary-600 hover:text-primary-800"
            title="العودة"
          >
            <ArrowRight size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{data.name}</h1>
            <p className="text-gray-600">تفاصيل المنشأة والوظائف المرتبطة بها</p>
          </div>
        </div>
        {canWrite && (
          <button
            onClick={() => navigate(`/facilities/${data.id}/edit`)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-primary-700 transition"
          >
            <Pencil size={18} /> تعديل المنشأة
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow border border-gray-100 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="bg-primary-50 text-primary-600 p-3 rounded-xl">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">البيانات الأساسية</h2>
              <p className="text-xs text-gray-500">رقم المنشأة: {data.id}</p>
            </div>
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500 mb-1">اسم المنشأة</dt>
              <dd className="font-medium text-gray-800">{data.name}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">نوع المنشأة</dt>
              <dd className="font-medium text-gray-800">{data.facilityType?.name || "—"}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-gray-500 mb-1">الموقع الجغرافي</dt>
              <dd className="font-medium text-gray-800 flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                {location || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">الدولة</dt>
              <dd className="font-medium text-gray-800">{data.country?.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">المنطقة</dt>
              <dd className="font-medium text-gray-800">{data.region?.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">المحافظة</dt>
              <dd className="font-medium text-gray-800">{data.district?.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">المديرية</dt>
              <dd className="font-medium text-gray-800">{data.county?.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">تاريخ الإنشاء</dt>
              <dd className="font-medium text-gray-800">
                {new Date(data.createdAt).toLocaleDateString("ar-SA")}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">آخر تحديث</dt>
              <dd className="font-medium text-gray-800">
                {new Date(data.updatedAt).toLocaleDateString("ar-SA")}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
              <Briefcase size={22} />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">الوظائف المرتبطة</h2>
              <p className="text-xs text-gray-500">عدد الوظائف: {data.positionsCount}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {data.positionsCount > 0
              ? "لا يمكن حذف المنشأة قبل نقل هذه الوظائف أو حذفها."
              : "لا توجد وظائف مرتبطة — يمكن حذف المنشأة."}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">قائمة الوظائف</h2>
        </div>
        {data.positions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">الكود</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">المسمى</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">الوظيفة</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">القسم</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">النوع</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.positions.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-600">{p.code || "—"}</td>
                    <td className="px-4 py-3 text-gray-800">{p.title || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{p.job?.title || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{p.department?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{p.posType?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{p.status?.name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic text-center py-8">
            لا توجد وظائف مرتبطة بهذه المنشأة.
          </p>
        )}
      </div>
    </div>
  );
}
