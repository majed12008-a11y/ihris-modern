import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";

interface UserFormData {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

const EMPTY: UserFormData = {
  username: "",
  password: "",
  firstname: "",
  lastname: "",
  email: "",
  role: "hr_staff",
};

export default function UserForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === "admin";

  const [formData, setFormData] = useState<UserFormData>(EMPTY);
  const [version, setVersion] = useState<number | null>(null);

  const { data: userData, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const res = await api.get(`/users/${id}`);
      return res.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        username: userData.username || "",
        password: "",
        firstname: userData.firstname || "",
        lastname: userData.lastname || "",
        email: userData.email || "",
        role: userData.role || "hr_staff",
      });
      setVersion(userData.version);
    }
  }, [userData]);

  const saveMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (isEdit) {
        const payload: Record<string, unknown> = {
          version,
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
        };
        // تغيير الدور متاح للأدمن فقط (منع تصعيد الصلاحيات)
        if (isAdmin) payload.role = data.role;
        const res = await api.put(`/users/${id}`, payload);
        return res.data;
      }

      const res = await api.post("/users", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      if (id) queryClient.invalidateQueries({ queryKey: ["user", id] });
      toast.success(isEdit ? "تم تعديل المستخدم بنجاح" : "تم إضافة المستخدم بنجاح");
      navigate("/users");
    },
    onError: (error: any) => {
      const body = error.response?.data;
      const message =
        body?.error ||
        (Array.isArray(body?.errors) ? body.errors.join(" — ") : null) ||
        (isEdit ? "فشل تعديل المستخدم" : "فشل إضافة المستخدم");
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isEdit && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/users")}
          className="text-primary-600 hover:text-primary-800 flex items-center gap-2"
        >
          <ArrowLeft size={18} /> العودة
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? "تعديل مستخدم" : "إضافة مستخدم جديد"}
          </h1>
          <p className="text-gray-600">
            {isEdit
              ? "تعديل بيانات الحساب. التغيير محمي عبر رقم النسخة (optimistic lock)."
              : "إنشاء حساب مستخدم وتعيين صلاحياته في النظام"}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-100 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المستخدم *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100"
                required
                disabled={isEdit}
              />
              {isEdit && (
                <p className="text-xs text-gray-500 mt-1">اسم المستخدم غير قابل للتعديل</p>
              )}
            </div>

            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  كلمة المرور *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                  minLength={6}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الاسم الأول *
              </label>
              <input
                type="text"
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم العائلة *
              </label>
              <input
                type="text"
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الدور *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100"
                required
                disabled={isEdit && !isAdmin}
              >
                <option value="admin">مسؤول النظام</option>
                <option value="hr_manager">مدير الموارد البشرية</option>
                <option value="hr_staff">موظف موارد بشرية</option>
                <option value="training_manager">مدير التدريب</option>
                <option value="exec_manager">مدير تنفيذي</option>
              </select>
              {isEdit && !isAdmin && (
                <p className="text-xs text-gray-500 mt-1">تغيير الدور متاح للمسؤول فقط</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2 transition"
            >
              <Save size={18} />
              {isEdit ? "حفظ التعديلات" : "حفظ المستخدم"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/users")}
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
