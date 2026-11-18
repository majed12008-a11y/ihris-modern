import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Save, AlertCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { LoadingState } from "@/components/ui/StateViews";

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

const ROLE_LABELS: Record<string, string> = {
  admin: "مسؤول النظام",
  hr_manager: "مدير الموارد البشرية",
  hr_staff: "موظف موارد بشرية",
  training_manager: "مدير التدريب",
  exec_manager: "مدير تنفيذي",
};

type FormErrors = Partial<Record<keyof UserFormData, string>>;

export default function UserForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === "admin";

  const [formData, setFormData] = useState<UserFormData>(EMPTY);
  const [version, setVersion] = useState<number | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

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

  const set = (key: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: FormErrors = {};
    if (!formData.username.trim()) nextErrors.username = "اسم المستخدم مطلوب";
    if (!isEdit) {
      if (!formData.password) nextErrors.password = "كلمة المرور مطلوبة";
      else if (formData.password.length < 6)
        nextErrors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    }
    if (!formData.firstname.trim()) nextErrors.firstname = "الاسم الأول مطلوب";
    if (!formData.lastname.trim()) nextErrors.lastname = "اللقب مطلوب";
    if (!formData.email.trim()) nextErrors.email = "البريد الإلكتروني مطلوب";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
      nextErrors.email = "صيغة البريد الإلكتروني غير صحيحة";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(`user-${firstKey}`)?.focus();
      return;
    }

    saveMutation.mutate(formData);
  };

  const fullName =
    [formData.firstname, formData.lastname].filter(Boolean).join(" ") || null;
  const backHref = "/users";

  if (isEdit && isLoading) {
    return (
      <div className="stack">
        <PageHeader
          title="تعديل مستخدم"
          subtitle="تعديل بيانات الحساب والصلاحيات."
          backTo={backHref}
          backLabel="رجوع"
        />
        <section className="card">
          <LoadingState label="جارٍ تحميل بيانات المستخدم…" />
        </section>
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        title={isEdit ? "تعديل مستخدم" : "إضافة مستخدم جديد"}
        subtitle={
          isEdit
            ? "تعديل بيانات الحساب. التغيير محمي عبر رقم النسخة (optimistic lock)."
            : "إنشاء حساب مستخدم وتعيين صلاحياته في النظام"
        }
        backTo={backHref}
        backLabel="رجوع"
      />

      <div className="form-layout">
        <form
          id="user-form"
          className="main-col form-stack"
          onSubmit={handleSubmit}
          noValidate
        >
          <section className="card">
            <div className="form-section-head">
              <span className="form-section-num" aria-hidden="true">
                1
              </span>
              <h2 className="form-section-title">بيانات الحساب</h2>
              <span className="form-section-note">بيانات الدخول إلى النظام</span>
            </div>
            <div className="form-body">
              <div className="field">
                <label className="label" htmlFor="user-username">
                  اسم المستخدم <span className="req">*</span>
                </label>
                <input
                  className={`input${errors.username ? " is-invalid" : ""}`}
                  id="user-username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => set("username", e.target.value)}
                  autoComplete="username"
                  spellCheck={false}
                  required
                  disabled={isEdit}
                  aria-invalid={errors.username ? "true" : undefined}
                  aria-describedby={
                    errors.username
                      ? "user-username-err"
                      : isEdit
                        ? "user-username-hint"
                        : undefined
                  }
                />
                {isEdit && (
                  <span className="hint" id="user-username-hint">
                    اسم المستخدم غير قابل للتعديل
                  </span>
                )}
                {errors.username && (
                  <p className="err" id="user-username-err">
                    <AlertCircle aria-hidden="true" />
                    {errors.username}
                  </p>
                )}
              </div>

              {!isEdit && (
                <div className="field">
                  <label className="label" htmlFor="user-password">
                    كلمة المرور <span className="req">*</span>
                  </label>
                  <input
                    className={`input${errors.password ? " is-invalid" : ""}`}
                    id="user-password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => set("password", e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    aria-invalid={errors.password ? "true" : undefined}
                    aria-describedby={
                      errors.password ? "user-password-err" : "user-password-hint"
                    }
                  />
                  {errors.password ? (
                    <p className="err" id="user-password-err">
                      <AlertCircle aria-hidden="true" />
                      {errors.password}
                    </p>
                  ) : (
                    <span className="hint" id="user-password-hint">
                      6 أحرف على الأقل.
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="form-section-head">
              <span className="form-section-num" aria-hidden="true">
                2
              </span>
              <h2 className="form-section-title">البيانات الشخصية</h2>
              <span className="form-section-note">تظهر في سجل التغييرات</span>
            </div>
            <div className="form-body">
              <div className="field">
                <label className="label" htmlFor="user-firstname">
                  الاسم الأول <span className="req">*</span>
                </label>
                <input
                  className={`input${errors.firstname ? " is-invalid" : ""}`}
                  id="user-firstname"
                  name="firstname"
                  type="text"
                  value={formData.firstname}
                  onChange={(e) => set("firstname", e.target.value)}
                  autoComplete="given-name"
                  spellCheck={false}
                  required
                  aria-invalid={errors.firstname ? "true" : undefined}
                  aria-describedby={errors.firstname ? "user-firstname-err" : undefined}
                />
                {errors.firstname && (
                  <p className="err" id="user-firstname-err">
                    <AlertCircle aria-hidden="true" />
                    {errors.firstname}
                  </p>
                )}
              </div>

              <div className="field">
                <label className="label" htmlFor="user-lastname">
                  اسم العائلة <span className="req">*</span>
                </label>
                <input
                  className={`input${errors.lastname ? " is-invalid" : ""}`}
                  id="user-lastname"
                  name="lastname"
                  type="text"
                  value={formData.lastname}
                  onChange={(e) => set("lastname", e.target.value)}
                  autoComplete="family-name"
                  spellCheck={false}
                  required
                  aria-invalid={errors.lastname ? "true" : undefined}
                  aria-describedby={errors.lastname ? "user-lastname-err" : undefined}
                />
                {errors.lastname && (
                  <p className="err" id="user-lastname-err">
                    <AlertCircle aria-hidden="true" />
                    {errors.lastname}
                  </p>
                )}
              </div>

              <div className="field full">
                <label className="label" htmlFor="user-email">
                  البريد الإلكتروني <span className="req">*</span>
                </label>
                <input
                  className={`input${errors.email ? " is-invalid" : ""}`}
                  id="user-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => set("email", e.target.value)}
                  autoComplete="email"
                  spellCheck={false}
                  required
                  aria-invalid={errors.email ? "true" : undefined}
                  aria-describedby={errors.email ? "user-email-err" : undefined}
                />
                {errors.email && (
                  <p className="err" id="user-email-err">
                    <AlertCircle aria-hidden="true" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="form-section-head">
              <span className="form-section-num" aria-hidden="true">
                3
              </span>
              <h2 className="form-section-title">الصلاحيات</h2>
              <span className="form-section-note">الدور يحدّد ما يمكن للحساب الوصول إليه</span>
            </div>
            <div className="form-body">
              <div className="field">
                <label className="label" htmlFor="user-role">
                  الدور <span className="req">*</span>
                </label>
                <select
                  className="select"
                  id="user-role"
                  name="role"
                  value={formData.role}
                  onChange={(e) => set("role", e.target.value)}
                  required
                  disabled={isEdit && !isAdmin}
                  aria-describedby={isEdit && !isAdmin ? "user-role-hint" : undefined}
                >
                  <option value="admin">مسؤول النظام</option>
                  <option value="hr_manager">مدير الموارد البشرية</option>
                  <option value="hr_staff">موظف موارد بشرية</option>
                  <option value="training_manager">مدير التدريب</option>
                  <option value="exec_manager">مدير تنفيذي</option>
                </select>
                {isEdit && !isAdmin && (
                  <span className="hint" id="user-role-hint">
                    تغيير الدور متاح للمسؤول فقط
                  </span>
                )}
              </div>
            </div>
          </section>
        </form>

        <aside className="side">
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">ملخّص الحساب</h2>
            </div>
            <div className="card-body">
              <div className="summary-row">
                <span className="summary-key">اسم المستخدم</span>
                <span className={`summary-val${formData.username ? "" : " empty"}`}>
                  {formData.username || "غير محدد"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">الاسم الكامل</span>
                <span className={`summary-val${fullName ? "" : " empty"}`}>
                  {fullName ?? "غير مكتمل"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">البريد الإلكتروني</span>
                <span className={`summary-val${formData.email ? "" : " empty"}`}>
                  {formData.email || "غير محدد"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">الدور</span>
                <span className="summary-val">
                  {ROLE_LABELS[formData.role] ?? formData.role}
                </span>
              </div>
            </div>
          </section>

          <section className="card">
            <div
              className="card-body"
              style={{ display: "flex", flexDirection: "column", gap: 9 }}
            >
              <button
                type="submit"
                form="user-form"
                className="btn btn-primary btn-block"
                disabled={saveMutation.isPending}
              >
                <Save aria-hidden="true" />
                {saveMutation.isPending
                  ? "جارٍ الحفظ…"
                  : isEdit
                    ? "حفظ التعديلات"
                    : "حفظ المستخدم"}
              </button>
              <a
                className="btn btn-ghost btn-block"
                href={backHref}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(backHref);
                }}
              >
                إلغاء
              </a>
              <p className="side-note">
                {isEdit
                  ? "يُحمى الحفظ برقم النسخة (optimistic lock) لمنع الكتابة فوق تعديلات مستخدم آخر."
                  : "تُسجَّل عمليات إنشاء الحسابات وتعديلها في سجل التغييرات مع اسم المستخدم."}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
