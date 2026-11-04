import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import { Person } from "@/types";

interface PersonFormData {
  surname: string;
  firstname: string;
  othername: string;
  nationalityId: string;
  countryId: string;
  districtId: string;
  countyId: string;
  residenceCountryId: string;
  residenceDistrictId: string;
  residenceCountyId: string;
}

export default function PersonForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const personId = id ? parseInt(id, 10) : null;
  const isEdit = !!personId;

  const [formData, setFormData] = useState<PersonFormData>({
    surname: "",
    firstname: "",
    othername: "",
    nationalityId: "",
    countryId: "",
    districtId: "",
    countyId: "",
    residenceCountryId: "",
    residenceDistrictId: "",
    residenceCountyId: "",
  });

  const { data: person, isLoading } = useQuery<Person>({
    queryKey: ["person", personId],
    queryFn: async () => {
      const res = await api.get(`/persons/${personId}`);
      return res.data;
    },
    enabled: !!personId,
  });

  useEffect(() => {
    if (person) {
      setFormData({
        surname: person.surname,
        firstname: person.firstname,
        othername: person.othername || "",
        nationalityId: String(person.nationalityId || ""),
        countryId: String(person.countryId || ""),
        districtId: String(person.districtId || ""),
        countyId: String(person.countyId || ""),
        residenceCountryId: String(person.residenceCountryId || ""),
        residenceDistrictId: String(person.residenceDistrictId || ""),
        residenceCountyId: String(person.residenceCountyId || ""),
      });
    }
  }, [person]);

  const updateMutation = useMutation({
    mutationFn: async (data: PersonFormData) => {
      const res = await api.put(`/persons/${personId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persons"] });
      toast.success("تم تحديث بيانات الموظف بنجاح");
      navigate(`/persons/${personId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل تحديث بيانات الموظف");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PersonFormData) => {
      const res = await api.post("/persons", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persons"] });
      toast.success("تم إضافة الموظف بنجاح");
      navigate("/persons");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل إضافة الموظف");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && personId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading && personId) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(isEdit ? `/persons/${personId}` : "/persons")}
          className="text-primary-600 hover:text-primary-800 flex items-center gap-2"
        >
          <ArrowLeft size={18} /> العودة
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? "تعديل موظف" : "إضافة موظف جديد"}
          </h1>
          <p className="text-gray-600">
            {isEdit ? "تعديل بيانات الموظف المحدد" : "إدخال بيانات موظف جديد في النظام"}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-lg-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اللقب (الاسم الأخير) *
              </label>
              <input
                type="text"
                value={formData.surname}
                onChange={(e) =>
                  setFormData({ ...formData, surname: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>

            <div className="col-span-lg-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الاسم الأول *
              </label>
              <input
                type="text"
                value={formData.firstname}
                onChange={(e) =>
                  setFormData({ ...formData, firstname: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الأسماء الأخرى
              </label>
              <input
                type="text"
                value={formData.othername}
                onChange={(e) =>
                  setFormData({ ...formData, othername: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الدولة
              </label>
              <select
                value={formData.countryId}
                onChange={(e) =>
                  setFormData({ ...formData, countryId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">اختر الدولة</option>
                <option value="1">الجمهورية اليمنية</option>
                <option value="2">مصر</option>
                <option value="3">المملكة العربية السعودية</option>
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
                <option value="1">صنعاء</option>
                <option value="2">عدن</option>
                <option value="3">تعز</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المديرية
              </label>
              <select
                value={formData.countyId}
                onChange={(e) =>
                  setFormData({ ...formData, countyId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">اختر المديرية</option>
                <option value="1">مديرية صنعاء</option>
                <option value="2">مديرية عدن</option>
                <option value="3">مديرية القاهرة</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={updateMutation.isPending || createMutation.isPending}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2 transition"
            >
              <Save size={18} />
              {isEdit ? "تحديث البيانات" : "حفظ الموظف"}
            </button>
            <button
              type="button"
              onClick={() => navigate(isEdit ? `/persons/${personId}` : "/persons")}
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
