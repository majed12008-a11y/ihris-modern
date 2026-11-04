import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { User, Building, Phone, MapPin, ArrowLeft } from "lucide-react";

interface PersonDetail {
  id: number;
  surname: string;
  firstname: string;
  othername: string | null;
  countryId: number | null;
  districtId: number | null;
  countyId: number | null;
  residenceCountryId: number | null;
  residenceDistrictId: number | null;
  residenceCountyId: number | null;
  createdAt: string;
  updatedAt: string;
  contacts: Array<{
    id: number;
    telephone: string | null;
    email: string | null;
    address: string | null;
  }>;
  demographics: Array<{
    id: number;
    birthDate: string | null;
    genderId: number | null;
  }>;
  salaries: Array<{
    id: number;
    salary: string;
    startDate: string;
    endDate: string | null;
  }>;
  personPositions: Array<{
    id: number;
    position: {
      id: number;
      title: string | null;
      facility: { name: string } | null;
      job: { title: string } | null;
    };
    startDate: string | null;
    endDate: string | null;
  }>;
}

export default function PersonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const personId = parseInt(id || "0", 10);

  const { data, isLoading, error } = useQuery<PersonDetail>({
    queryKey: ["person", personId],
    queryFn: async () => {
      const res = await api.get(`/persons/${personId}`);
      return res.data;
    },
    enabled: !!personId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">جاري تحميل بيانات الموظف...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow border border-red-100 text-center">
          <h2 className="text-red-600 font-bold mb-2">⚠️ لم يتم العثور على الموظف</h2>
          <button
            onClick={() => navigate("/persons")}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            العودة إلى القائمة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/persons")}
          className="text-primary-600 hover:text-primary-800 flex items-center gap-2"
        >
          <ArrowLeft size={18} /> العودة إلى القائمة
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {data.surname} {data.firstname}
          </h1>
          <p className="text-gray-600">رقم الموظف: #{data.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            المعلومات الأساسية
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User size={20} className="text-gray-400" />
              <div>
                <div className="font-medium">{data.surname} {data.firstname}</div>
                {data.othername && (
                  <div className="text-sm text-gray-500">{data.othername}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-gray-400" />
              <div className="text-sm text-gray-600">
                districtId: {data.districtId || "غير محدد"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building size={20} className="text-gray-400" />
              <div className="text-sm text-gray-600">
                countryId: {data.countryId || "غير محدد"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            معلومات الاتصال
          </h3>
          {(data.contacts?.length || 0) > 0 ? (
            <ul className="space-y-3">
              {data.contacts.map((c) => (
                <li key={c.id} className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={18} />
                  <div>
                    <div className="font-medium">{c.telephone || "غير محدد"}</div>
                    <div className="text-xs text-gray-400">{c.email || "-"}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">لا توجد بيانات اتصال</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            السجلات المالية
          </h3>
          {(data.salaries?.length || 0) > 0 ? (
            <ul className="space-y-3">
              {data.salaries.map((s) => (
                <li key={s.id} className="flex justify-between items-center text-sm">
                  <div>
                    <div className="font-medium">{s.salary}</div>
                    <div className="text-xs text-gray-400">
                      من {new Date(s.startDate).toLocaleDateString("ar-SA")}
                    </div>
                  </div>
                  <span className="text-gray-500">{s.endDate || "حتى الآن"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">لا توجد سجلات رواتب</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          الوظائف المحتلة
        </h3>
        {(data.personPositions?.length || 0) > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 font-semibold text-gray-700">المسمى الوظيفي</th>
                <th className="px-4 py-2 font-semibold text-gray-700">المنشأة</th>
                <th className="px-4 py-2 font-semibold text-gray-700">تاريخ البداية</th>
                <th className="px-4 py-2 font-semibold text-gray-700">تاريخ النهاية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.personPositions.map((pp) => (
                <tr key={pp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{pp.position.title || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {pp.position.facility?.name || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {pp.startDate ? new Date(pp.startDate).toLocaleDateString("ar-SA") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {pp.endDate ? new Date(pp.endDate).toLocaleDateString("ar-SA") : "حتى الآن"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-500 italic">لا توجد وظائف مسجلة</p>
        )}
      </div>
    </div>
  );
}
