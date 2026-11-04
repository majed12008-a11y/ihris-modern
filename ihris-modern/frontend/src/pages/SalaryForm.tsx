import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";

interface SalaryFormData {
  personId: string;
  startDate: string;
  endDate: string;
  salary: string;
  notes: string;
}

export default function SalaryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const salaryId = id ? parseInt(id, 10) : null;
  const isEdit = !!salaryId;

  const [formData, setFormData] = useState<SalaryFormData>({
    personId: "",
    startDate: "",
    endDate: "",
    salary: "",
    notes: "",
  });

  const { isLoading } = useQuery({
    queryKey: ["salary", salaryId],
    queryFn: async () => {
      const res = await api.get(`/salaries/${salaryId}`);
      return res.data;
    },
    enabled: !!salaryId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SalaryFormData) => {
      const res = await api.put(`/salaries/${salaryId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
      toast.success("تم تحديث الراتب بنجاح");
      navigate(`/salaries`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل تحديث الراتب");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SalaryFormData) => {
      const res = await api.post("/salaries", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
      toast.success("تم إضافة الراتب بنجاح");
      navigate("/salaries");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل إضافة الراتب");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && salaryId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading && salaryId) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() =>
            navigate(isEdit ? `/salaries/${salaryId}` : "/salaries")
          }
          className="text-primary-600 hover:text-primary-800 flex items-center gap-2"
        >
          <ArrowLeft size={18} /> العودة
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? "تعديل راتب" : "إضافة راتب جديد"}
          </h1>
          <p className="text-gray-600">
            {isEdit
              ? "تعديل بيانات الراتب المحددة"
              : "تسجيل راتب جديد لموظف"}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-lg-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الموظف *
              </label>
              <input
                type="text"
                value={formData.personId}
                onChange={(e) =>
                  setFormData({ ...formData, personId: e.target.value })
                }
                placeholder="رقم معرف الموظف"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ البدء *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ الانتهاء
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div className="col-span-lg-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المبلغ *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ر.ي
                </span>
                <input
                  type="text"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                  placeholder="مثل: 150,000"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="col-span-lg-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ملاحظات
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
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
              {isEdit ? "تحديث البيانات" : "حفظ الراتب"}
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(isEdit ? `/salaries/${salaryId}` : "/salaries")
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
