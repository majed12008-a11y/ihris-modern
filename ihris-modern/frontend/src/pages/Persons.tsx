import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { toast } from "sonner";
import { Edit, Trash2, Eye, Plus } from "lucide-react";
import { Person } from "@/types";

interface PersonResponse {
  data: Person[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Persons() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [formData, setFormData] = useState({
    surname: "",
    firstname: "",
    othername: "",
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (editingPerson) {
      setFormData({
        surname: editingPerson.surname || "",
        firstname: editingPerson.firstname || "",
        othername: editingPerson.othername || "",
      });
    } else {
      setFormData({
        surname: "",
        firstname: "",
        othername: "",
      });
    }
  }, [editingPerson]);

  const { data, isLoading, error } = useQuery<PersonResponse>({
    queryKey: ["persons", search],
    queryFn: async () => {
      const res = await api.get(`/persons?search=${encodeURIComponent(search)}`);
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/persons/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persons"] });
      toast.success("تم حذف الموظف بنجاح");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل حذف الموظف");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">جاري تحميل الموظفين...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("❌ Persons error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow border border-red-100 max-w-md text-center">
          <div className="text-red-600 font-bold mb-2">⚠️ حدث خطأ في تحميل البيانات</div>
          <p className="text-gray-600 text-sm mb-4">{error instanceof Error ? error.message : String(error)}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الموظفون</h1>
          <p className="text-gray-600">إدارة بيانات الموظفين والموارد البشرية</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="البحث باسم الموظف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <button
            onClick={() => {
              console.log("🔘 Clicked Add Person button");
              setEditingPerson(null);
              setShowForm(true);
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-primary-700 transition"
          >
            <Plus size={18} /> موظف جديد
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">الاسم الكامل</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">الجنسية</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">الموقع</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data?.data || []).map((person: Person) => (
              <tr key={person.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="font-medium">{person.surname} {person.firstname}</div>
                  {person.othername && <div className="text-xs text-gray-500">{person.othername}</div>}
                </td>
                <td className="px-6 py-4 text-gray-600">غير محدد</td>
                <td className="px-6 py-4 text-gray-600">غير محدد</td>
                <td className="px-6 py-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/persons/${person.id}`)}
                    className="text-primary-600 hover:text-primary-800 text-sm flex items-center gap-1"
                  >
                    <Eye size={14} /> عرض
                  </button>
                  <button
                    onClick={() => {
                      setEditingPerson(person);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <Edit size={14} /> تعديل
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("هل أنت متأكد من حذف هذا الموظف؟")) {
                        deleteMutation.mutate(person.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!data?.data?.length && (
        <div className="text-center py-12 text-gray-500">
          لا توجد بيانات موظفين متاحة
          <button
            onClick={() => {
              setEditingPerson(null);
              setShowForm(true);
            }}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            إضافة موظف أول
          </button>
        </div>
      )}

      {/* نموذج إضافة/تعديل موظف */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 m-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingPerson ? "تعديل موظف" : "إضافة موظف جديد"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingPerson(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              console.log("📝 Form submitted:", formData);
              if (editingPerson && editingPerson.id) {
                // تحديث موظف موجود
              } else {
                // إضافة موظف جديد
              }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اللقب (الاسم الأخير) *
                  </label>
                  <input
                    type="text"
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الاسم الأول *
                  </label>
                  <input
                    type="text"
                    value={formData.firstname}
                    onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الأسماء الأخرى
                </label>
                <input
                  type="text"
                  value={formData.othername}
                  onChange={(e) => setFormData({ ...formData, othername: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPerson(null);
                  }}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
