import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import { toast } from "sonner";
import { Lock, User as UserIcon, LogIn } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { username, password });
      const { user, token } = response.data;

      localStorage.setItem("ihris_token", token);
      localStorage.setItem("ihris_user", JSON.stringify(user));

      login(user, token);

      toast.success("تم تسجيل الدخول");
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-brand" aria-hidden="true">
        <div className="brand" style={{ border: 0, padding: 0 }}>
          <div className="brand-mark">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EAF3EF"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 20V9l8-5 8 5v11" />
              <path d="M9 20v-5h6v5" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name" translate="no">
              iHRIS Suite
            </span>
            <span className="brand-sub">نظام معلومات الموارد البشرية</span>
          </div>
        </div>

        <div className="auth-brand-copy">
          <h1 className="auth-brand-title">
            سجل واحد
            <br />
            لكل موظف في القطاع الصحي
          </h1>
          <p className="auth-brand-text">
            بيانات الموظفين والوظائف والمنشآت والرواتب والتدريب في مكان واحد،
            مع سجل تغييرات كامل لكل تعديل.
          </p>
        </div>

        <ul className="auth-facts">
          <li>سجل تدقيق لكل إضافة وتعديل وحذف</li>
          <li>تقارير تشغيلية قابلة للتصدير</li>
          <li>صلاحيات محدّدة بحسب الدور</li>
        </ul>
      </section>

      <section className="auth-form-panel">
        <div className="auth-mobile-brand">
          <div className="brand-mark" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EAF3EF"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 20V9l8-5 8 5v11" />
              <path d="M9 20v-5h6v5" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name" style={{ color: "var(--text)" }} translate="no">
              iHRIS
            </span>
            <span className="brand-sub" style={{ color: "var(--text-3)" }}>
              نظام معلومات الموارد البشرية
            </span>
          </div>
        </div>

        <div className="auth-form-card">
          <h1 className="auth-title">تسجيل الدخول</h1>
          <p className="auth-sub">أدخل بيانات حسابك للمتابعة.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label className="label" htmlFor="username">
                اسم المستخدم
              </label>
              <div className="input-wrap">
                <UserIcon aria-hidden="true" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="password">
                كلمة المرور
              </label>
              <div className="input-wrap">
                <Lock aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              style={{ height: 40, marginTop: 4 }}
            >
              <LogIn aria-hidden="true" />
              {loading ? "جاري الدخول…" : "تسجيل الدخول"}
            </button>
          </form>

          {import.meta.env.DEV && (
            <p className="auth-demo">
              بيئة تطوير — الحساب التجريبي: <bdi dir="ltr">admin / admin123</bdi>
            </p>
          )}
        </div>

        <p className="auth-foot">إدارة معلومات الموارد البشرية</p>
      </section>
    </div>
  );
}
