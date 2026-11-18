import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";
import { AlertCircle, Save } from "lucide-react";
import { Position } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import { ErrorState, LoadingState } from "@/components/ui/StateViews";

interface PositionFormData {
  code: string;
  title: string;
  description: string;
  jobId: string;
  facilityId: string;
  departmentId: string;
  proposedSalary: string;
  statusId: string;
}

interface Option {
  value: string;
  label: string;
}

const JOB_OPTIONS: Option[] = [
  { value: "1", label: "طبيب عام" },
  { value: "2", label: "ممرض" },
  { value: "3", label: "صيدلي" },
  { value: "4", label: "إداري" },
];

const FACILITY_OPTIONS: Option[] = [
  { value: "1", label: "مستشفى صنعاء العام" },
  { value: "2", label: "مركز صحي عدن" },
  { value: "3", label: "عيادة متخصصة" },
];

const DEPARTMENT_OPTIONS: Option[] = [
  { value: "1", label: "الإدارة" },
  { value: "2", label: "الطب العام" },
  { value: "3", label: "جراحة العظام" },
];

const STATUS_OPTIONS: Option[] = [
  { value: "1", label: "شاغر" },
  { value: "2", label: "مشغول" },
  { value: "3", label: "تحت الإجراء" },
];

const labelOf = (options: Option[], value: string) =>
  value ? options.find((option) => option.value === value)?.label ?? "—" : "—";

export default function PositionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const positionId = id ? parseInt(id, 10) : null;
  const isEdit = !!positionId;

  const [formData, setFormData] = useState<PositionFormData>({
    code: "",
    title: "",
    description: "",
    jobId: "",
    facilityId: "",
    departmentId: "",
    proposedSalary: "",
    statusId: "",
  });
  const [errors, setErrors] = useState<{ title?: string }>({});

  const {
    data: position,
    isLoading,
    error: loadError,
    refetch,
  } = useQuery<Position>({
    queryKey: ["position", positionId],
    queryFn: async () => {
      const res = await api.get(`/positions/${positionId}`);
      return res.data;
    },
    enabled: !!positionId,
  });

  useEffect(() => {
    if (position) {
      setFormData({
        code: position.code || "",
        title: position.title || "",
        description: position.description || "",
        jobId: String(position.jobId || ""),
        facilityId: String(position.facilityId || ""),
        departmentId: String(position.departmentId || ""),
        proposedSalary: position.proposedSalary || "",
        statusId: String(position.statusId || ""),
      });
    }
  }, [position]);

  const updateMutation = useMutation({
    mutationFn: async (data: PositionFormData) => {
      const res = await api.put(`/positions/${positionId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("تم تحديث الوظيفة بنجاح");
      navigate(`/positions/${positionId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل تحديث الوظيفة");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PositionFormData) => {
      const res = await api.post("/positions", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("تم إضافة الوظيفة بنجاح");
      navigate("/positions");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل إضافة الوظيفة");
    },
  });

  const saving = updateMutation.isPending || createMutation.isPending;

  const set = (key: keyof PositionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (key === "title") setErrors((prev) => ({ ...prev, title: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setErrors({ title: "المسمى الوظيفي مطلوب" });
      document.getElementById("position-title")?.focus();
      return;
    }

    if (isEdit && positionId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const backTo = isEdit ? `/positions/${positionId}` : "/positions";

  if (isEdit && isLoading) {
    return (
      <div className="stack">
        <PageHeader
          title="تعديل وظيفة"
          subtitle="تعديل بيانات الوظيفة المحددة"
          backTo={backTo}
          backLabel="العودة"
        />
        <section className="card">
          <LoadingState label="جاري تحميل بيانات الوظيفة…" />
        </section>
      </div>
    );
  }

  if (isEdit && loadError) {
    return (
      <div className="stack">
        <PageHeader
          title="تعديل وظيفة"
          subtitle="تعديل بيانات الوظيفة المحددة"
          backTo="/positions"
          backLabel="رجوع إلى الوظائف"
        />
        <ErrorState
          title="تعذّر تحميل الوظيفة"
          message={
            loadError instanceof Error ? loadError.message : "الوظيفة غير موجودة"
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        title={isEdit ? "تعديل وظيفة" : "إضافة وظيفة جديدة"}
        subtitle={
          isEdit
            ? "تعديل بيانات الوظيفة المحددة"
            : "إدخال وظيفة جديدة في الهيكل التنظيمي"
        }
        backTo={backTo}
        backLabel="العودة"
      />

      <div className="form-layout">
        <form
          id="position-form"
          className="main-col form-stack"
          onSubmit={handleSubmit}
          noValidate
        >
          <section className="card">
            <div className="form-section-head">
              <span className="form-section-num" aria-hidden="true">
                1
              </span>
              <h2 className="form-section-title">بيانات الوظيفة</h2>
              <span className="form-section-note">كما في الهيكل التنظيمي</span>
            </div>
            <div className="form-body">
              <div className="field">
                <label className="label" htmlFor="position-code">
                  كود الوظيفة
                </label>
                <input
                  className="input"
                  id="position-code"
                  name="code"
                  type="text"
                  value={formData.code}
                  onChange={(e) => set("code", e.target.value)}
                  placeholder="مثل: POS-001"
                  spellCheck={false}
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="position-title">
                  المسمى الوظيفي <span className="req">*</span>
                </label>
                <input
                  className={`input${errors.title ? " is-invalid" : ""}`}
                  id="position-title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => set("title", e.target.value)}
                  aria-invalid={errors.title ? "true" : undefined}
                  aria-describedby={errors.title ? "position-title-err" : undefined}
                  required
                />
                {errors.title && (
                  <p className="err" id="position-title-err">
                    <AlertCircle aria-hidden="true" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="field">
                <label className="label" htmlFor="position-salary">
                  الراتب المقترح
                </label>
                <input
                  className="input"
                  id="position-salary"
                  name="proposedSalary"
                  type="text"
                  value={formData.proposedSalary}
                  onChange={(e) => set("proposedSalary", e.target.value)}
                  placeholder="مثل: 150,000"
                  inputMode="numeric"
                />
                <span className="hint">اختياري — يُستخدم في المقارنة مع سلّم الرواتب.</span>
              </div>

              <div className="field">
                <label className="label" htmlFor="position-status">
                  حالة المنصب
                </label>
                <select
                  className="select"
                  id="position-status"
                  value={formData.statusId}
                  onChange={(e) => set("statusId", e.target.value)}
                >
                  <option value="">اختر الحالة</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field full">
                <label className="label" htmlFor="position-description">
                  الوصف
                </label>
                <textarea
                  className="textarea"
                  id="position-description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => set("description", e.target.value)}
                />
                <span className="hint">
                  موجز المهام والمسؤوليات المرتبطة بهذه الوظيفة.
                </span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="form-section-head">
              <span className="form-section-num" aria-hidden="true">
                2
              </span>
              <h2 className="form-section-title">التصنيف والربط</h2>
            </div>
            <div className="form-body">
              <div className="field">
                <label className="label" htmlFor="position-job">
                  المسمى الوظيفي (Job)
                </label>
                <select
                  className="select"
                  id="position-job"
                  value={formData.jobId}
                  onChange={(e) => set("jobId", e.target.value)}
                >
                  <option value="">اختر المسمى</option>
                  {JOB_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="position-facility">
                  المنشأة
                </label>
                <select
                  className="select"
                  id="position-facility"
                  value={formData.facilityId}
                  onChange={(e) => set("facilityId", e.target.value)}
                >
                  <option value="">اختر المنشأة</option>
                  {FACILITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="position-department">
                  القسم
                </label>
                <select
                  className="select"
                  id="position-department"
                  value={formData.departmentId}
                  onChange={(e) => set("departmentId", e.target.value)}
                >
                  <option value="">اختر القسم</option>
                  {DEPARTMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field full">
                <span className="hint">
                  الربط بالمنشأة والقسم يحدّد مكان ظهور الوظيفة في الشواغر والتقارير.
                </span>
              </div>
            </div>
          </section>
        </form>

        <aside className="side">
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">ملخّص الوظيفة</h2>
            </div>
            <div className="card-body">
              <div className="summary-row">
                <span className="summary-key">الكود</span>
                <span className={`summary-val${formData.code ? "" : " empty"}`}>
                  {formData.code || "غير محدد"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">المسمى الوظيفي</span>
                <span
                  className={`summary-val${formData.title.trim() ? "" : " empty"}`}
                >
                  {formData.title.trim() || "غير مكتمل"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">الحالة</span>
                <span
                  className={`summary-val${formData.statusId ? "" : " empty"}`}
                >
                  {labelOf(STATUS_OPTIONS, formData.statusId)}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">المنشأة</span>
                <span
                  className={`summary-val${formData.facilityId ? "" : " empty"}`}
                >
                  {labelOf(FACILITY_OPTIONS, formData.facilityId)}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">القسم</span>
                <span
                  className={`summary-val${formData.departmentId ? "" : " empty"}`}
                >
                  {labelOf(DEPARTMENT_OPTIONS, formData.departmentId)}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">الراتب المقترح</span>
                <span
                  className={`summary-val${formData.proposedSalary ? "" : " empty"}`}
                >
                  {formData.proposedSalary || "غير محدد"}
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
                form="position-form"
                className="btn btn-primary btn-block"
                disabled={saving}
              >
                <Save aria-hidden="true" />
                {saving
                  ? "جاري الحفظ…"
                  : isEdit
                  ? "تحديث البيانات"
                  : "حفظ الوظيفة"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => navigate(backTo)}
              >
                إلغاء
              </button>
              <p className="side-note">
                الحقول المعلّمة بـ <span className="req">*</span> إلزامية.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
