import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";

interface FacilityFormData {
  name: string;
  facilityTypeId: string;
  districtId: string;
  countyId: string;
  countryId: string;
  regionId: string;
}

export default function FacilityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const facilityId = id ? parseInt(id, 10) : null;
  const isEdit = !!facilityId;

  const [formData, setFormData] = useState<FacilityFormData>({
    name: "",
    facilityTypeId: "",
    districtId: "",
    countyId: "",
    countryId: "",
    regionId: "",
  });

  const { isLoading } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: async () => {
      const res = await api.get(`/facilities/${facilityId}`);
      return res.data;
    },
    enabled: !!facilityId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FacilityFormData) => {
      const res = await api.put(`/facilities/${facilityId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
      toast.success("تم تحديث المنشأة بنجاح");
      navigate(`/facilities/${facilityId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل تحديث المنشأة");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FacilityFormData) => {
      const res = await api.post("/facilities", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
      toast.success("تم إضافة المنشأة بنجاح");
      navigate("/facilities");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل إضافة المنشأة");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && facilityId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading && facilityId) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() =>
            navigate(isEdit ? `/facilities/${facilityId}` : "/facilities")
          }
          className="text-primary-600 hover:text-primary-800 flex items-center gap-2"
        >
          <ArrowLeft size={18} /> العودة
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? "تعديل منشأة" : "إضافة منشأة جديدة"}
          </h1>
          <p className="text-gray-600">
            {isEdit
              ? "تعديل بيانات المنشأة المحددة"
              : "إدخال منشأة صحية جديدة في النظام"}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-lg-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المنشأة *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع المنشأة
              </label>
              <select
                value={formData.facilityTypeId}
                onChange={(e) =>
                  setFormData({ ...formData, facilityTypeId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">اختر النوع</option>
                <option value="1">مستشفى عام</option>
                <option value="2">مركز صحي</option>
                <option value="3">عيادة متخصصة</option>
                <option value="4">مستشفى ريفي</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المنطقة
              </label>
              <select
                value={formData.regionId}
                onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">اختر المنطقة</option>
                <option value="1">عاصمة</option>
                <option value="2">जनता</option>
                <option value="3">تعز</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المحافظة
              </label>
              <select
                value={formData.districtId}
                onChange={(e) =>
                  setFormData({ ...formData, districtId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">اختر المحافظة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المديرية
              </label>
              <select
                value={formData.countyId}
                onChange={(e) => setFormData({ ...formData, countyId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">اختر المديرية</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الدولة
              </label>
              <select
                value={formData.countryId}
                onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">اختر الدولة</option>
                <option value="1">الجمهورية اليمنية</option>
                <option value="2">مصر</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={
                updateMutation.isPending || createMutation.isPending
              }
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2 transition"
            >
              <Save size={18} />
              {isEdit ? "تحديث البيانات" : "حفظ المنشأة"}
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(isEdit ? `/facilities/${facilityId}` : "/facilities")
              }
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
