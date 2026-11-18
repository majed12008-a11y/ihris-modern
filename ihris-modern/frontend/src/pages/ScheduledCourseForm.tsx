import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { extractErrorMessages } from "@/lib/errorDetails";
import { toast } from "sonner";
import { Save, X, AlertCircle, CalendarPlus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { ErrorState, LoadingState } from "@/components/ui/StateViews";

/**
 * Sprint 6 / GAP-H-001 — نموذج الدورة المجدولة (إنشاء + تعديل).
 * المسارات:
 *   /training/courses/:courseId/schedule/new   → إنشاء
 *   /training/scheduled/:scheduledId/edit      → تعديل (مع version)
 */

interface ScheduledFormData {
  site: string;
  numStudents: string;
  instructors: string;
  startDate: string;
  endDate: string;
  notes: string;
  status: string;
}

const EMPTY: ScheduledFormData = {
  site: "",
  numStudents: "",
  instructors: "",
  startDate: "",
  endDate: "",
  notes: "",
  status: "scheduled",
};

const STATUS_LABELS: Record<string, string> = {
  planning: "قيد التخطيط",
  scheduled: "مجدولة",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

// آلة الحالة مطابقة لـ STATUS_TRANSITIONS في الخدمة الخلفية.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  planning: ["scheduled", "cancelled"],
  scheduled: ["completed", "cancelled", "planning"],
  completed: [],
  cancelled: ["planning"],
};

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function toNullableNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function toNullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export default function ScheduledCourseForm() {
  const { courseId, scheduledId } = useParams<{
    courseId?: string;
    scheduledId?: string;
  }>();
  const isEdit = Boolean(scheduledId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ScheduledFormData>(EMPTY);
  const [version, setVersion] = useState(1);
  const [currentStatus, setCurrentStatus] = useState("scheduled");
  const [errors, setErrors] = useState<string[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);

  const courseQuery = useQuery({
    queryKey: ["training-course", courseId],
    enabled: Boolean(courseId) && !isEdit,
    queryFn: async () => (await api.get(`/training/courses/${courseId}`)).data,
  });

  const scheduledQuery = useQuery({
    queryKey: ["training-scheduled", scheduledId],
    enabled: isEdit,
    queryFn: async () => (await api.get(`/training/scheduled/${scheduledId}`)).data,
  });

  useEffect(() => {
    if (!isEdit || !scheduledQuery.data) return;
    const item = scheduledQuery.data;
    setFormData({
      site: item.site ?? "",
      numStudents: item.numStudents !== null && item.numStudents !== undefined
        ? String(item.numStudents)
        : "",
      instructors: item.instructors ?? "",
      startDate: toDateInput(item.startDate),
      endDate: toDateInput(item.endDate),
      notes: item.notes ?? "",
      status: item.status ?? "scheduled",
    });
    setVersion(item.version ?? 1);
    setCurrentStatus(item.status ?? "scheduled");
  }, [isEdit, scheduledQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        site: toNullableText(formData.site),
        numStudents: toNullableNumber(formData.numStudents),
        instructors: toNullableText(formData.instructors),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        notes: toNullableText(formData.notes),
      };

      if (isEdit) {
        body.version = version;
        // أرسل الحالة فقط إذا تغيّرت (لتفادي 422 انتقال غير مسموح).
        if (formData.status !== currentStatus) body.status = formData.status;
        return (await api.put(`/training/scheduled/${scheduledId}`, body)).data;
      }

      body.trainingCourseId = Number(courseId);
      if (formData.status) body.status = formData.status;
      return (await api.post("/training/scheduled", body)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-courses"] });
      queryClient.invalidateQueries({ queryKey: ["training-scheduled"] });
      toast.success(isEdit ? "تم تحديث الدورة المجدولة" : "تمت جدولة الدورة");
      const target = isEdit
        ? scheduledId
        : (scheduledQuery.data?.id as number | undefined);
      if (target) navigate(`/training/scheduled/${target}/enrollments`);
      else navigate("/training");
    },
    onError: (error) => setErrors(extractErrorMessages(error)),
  });

  const set = (key: keyof ScheduledFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [key]: event.target.value }));
    if ((key === "startDate" || key === "endDate") && dateError) setDateError(null);
  };

  const courseName = isEdit
    ? scheduledQuery.data?.trainingCourse?.name
    : courseQuery.data?.name;

  const statusOptions = isEdit
    ? [currentStatus, ...(ALLOWED_TRANSITIONS[currentStatus] ?? [])]
    : ["planning", "scheduled"];

  const loading = (isEdit && scheduledQuery.isLoading) || (!isEdit && courseQuery.isLoading);
  const loadError = isEdit ? scheduledQuery.error : courseQuery.error;

  const title = isEdit ? "تعديل دورة مجدولة" : "جدولة دورة تدريبية";
  const subtitle = [
    courseName ? `الدورة: ${courseName}` : null,
    isEdit ? `الإصدار v${version}` : null,
  ]
    .filter(Boolean)
    .join(" — ");

  const completionFields = [
    formData.site,
    formData.numStudents,
    formData.instructors,
    formData.startDate,
    formData.endDate,
  ];
  const filled = completionFields.filter((value) => value.trim() !== "").length;
  const completion = Math.round((filled / completionFields.length) * 100);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrors([]);
    setDateError(null);
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      setDateError("تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية");
      document.getElementById("scheduled-end-date")?.focus();
      return;
    }
    saveMutation.mutate();
  };

  if (loading) {
    return (
      <div className="stack">
        <PageHeader title={title} subtitle={subtitle} backTo="/training" backLabel="العودة" />
        <section className="card">
          <LoadingState label="جارٍ تحميل البيانات…" />
        </section>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="stack">
        <PageHeader title={title} subtitle={subtitle} backTo="/training" backLabel="العودة" />
        <ErrorState
          title="تعذّر تحميل بيانات الدورة المجدولة"
          message={extractErrorMessages(loadError).join(" — ")}
          onRetry={() => {
            if (isEdit) scheduledQuery.refetch();
            else courseQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader title={title} subtitle={subtitle} backTo="/training" backLabel="العودة" />

      {errors.length > 0 && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <strong>تعذر الحفظ</strong>
            {errors.map((message, index) => (
              <div key={index}>{message}</div>
            ))}
          </div>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            aria-label="إخفاء التنبيه"
            onClick={() => setErrors([])}
            style={{ flex: "none" }}
          >
            <X aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="form-layout">
        <form
          id="scheduled-course-form"
          className="main-col"
          style={{ gap: 18 }}
          onSubmit={handleSubmit}
          noValidate
        >
          <section className="card">
            <div className="form-section-head">
              <span className="form-section-num" aria-hidden="true">
                1
              </span>
              <h2 className="form-section-title">تفاصيل الجلسة</h2>
              <span className="form-section-note">المكان والمدربون والعدد المستهدف</span>
            </div>
            <div className="form-body">
              <div className="field">
                <label className="label" htmlFor="scheduled-site">
                  الموقع
                </label>
                <input
                  className="input"
                  id="scheduled-site"
                  name="site"
                  type="text"
                  value={formData.site}
                  onChange={set("site")}
                  maxLength={255}
                  spellCheck={false}
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="scheduled-num-students">
                  عدد المتدربين المستهدف
                </label>
                <input
                  className="input"
                  id="scheduled-num-students"
                  name="numStudents"
                  type="number"
                  min={0}
                  value={formData.numStudents}
                  onChange={set("numStudents")}
                />
              </div>

              <div className="field full">
                <label className="label" htmlFor="scheduled-instructors">
                  المدربون
                </label>
                <input
                  className="input"
                  id="scheduled-instructors"
                  name="instructors"
                  type="text"
                  value={formData.instructors}
                  onChange={set("instructors")}
                  maxLength={255}
                  spellCheck={false}
                />
              </div>
            </div>
          </section>

          <section className="card">
            <div className="form-section-head">
              <span className="form-section-num" aria-hidden="true">
                2
              </span>
              <h2 className="form-section-title">التوقيت والحالة</h2>
            </div>
            <div className="form-body">
              <div className="field">
                <label className="label" htmlFor="scheduled-start-date">
                  تاريخ البداية
                </label>
                <input
                  className="input"
                  id="scheduled-start-date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={set("startDate")}
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="scheduled-end-date">
                  تاريخ الانتهاء
                </label>
                <input
                  className={`input${dateError ? " is-invalid" : ""}`}
                  id="scheduled-end-date"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={set("endDate")}
                  aria-invalid={dateError ? "true" : undefined}
                  aria-describedby={dateError ? "scheduled-end-date-err" : undefined}
                />
                {dateError && (
                  <p className="err" id="scheduled-end-date-err">
                    <AlertCircle aria-hidden="true" />
                    {dateError}
                  </p>
                )}
              </div>

              <div className="field full">
                <label className="label" htmlFor="scheduled-status">
                  الحالة
                </label>
                <select
                  className="select"
                  id="scheduled-status"
                  value={formData.status}
                  onChange={set("status")}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status] ?? status}
                    </option>
                  ))}
                </select>
                {isEdit && !(ALLOWED_TRANSITIONS[currentStatus] ?? []).length && (
                  <span className="hint">الدورة مكتملة — لا توجد انتقالات حالة متاحة.</span>
                )}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="form-section-head">
              <span className="form-section-num" aria-hidden="true">
                3
              </span>
              <h2 className="form-section-title">الملاحظات</h2>
            </div>
            <div className="form-body">
              <div className="field full">
                <label className="label" htmlFor="scheduled-notes">
                  الملاحظات
                </label>
                <textarea
                  className="textarea"
                  id="scheduled-notes"
                  name="notes"
                  value={formData.notes}
                  onChange={set("notes")}
                  rows={4}
                />
                <span className="hint">اختياري. تُحفظ مع الجلسة وتظهر لمدير التدريب.</span>
              </div>
            </div>
          </section>
        </form>

        <aside className="side">
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">ملخّص الجلسة</h2>
            </div>
            <div className="card-body">
              <div className="summary-row">
                <span className="summary-key">الدورة</span>
                <span className={`summary-val${courseName ? "" : " empty"}`}>
                  {courseName ?? "غير محددة"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">الموقع</span>
                <span className={`summary-val${formData.site ? "" : " empty"}`}>
                  {formData.site || "بدون موقع"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">الفترة</span>
                <span
                  className={`summary-val${
                    formData.startDate || formData.endDate ? "" : " empty"
                  }`}
                >
                  {formData.startDate || formData.endDate
                    ? `${formData.startDate || "—"} — ${formData.endDate || "—"}`
                    : "غير محددة"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">الحالة</span>
                <span className="summary-val">
                  {STATUS_LABELS[formData.status] ?? formData.status}
                </span>
              </div>
              {isEdit && (
                <div className="summary-row">
                  <span className="summary-key">الإصدار</span>
                  <span className="summary-val num">v{version}</span>
                </div>
              )}

              <div className="progress" style={{ marginTop: 14 }}>
                <div className="progress-top">
                  <b>اكتمال البيانات</b>
                  <span>
                    {filled} من {completionFields.length}
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${completion}%` }} />
                </div>
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
                form="scheduled-course-form"
                className="btn btn-primary btn-block"
                disabled={saveMutation.isPending}
              >
                {isEdit ? <Save aria-hidden="true" /> : <CalendarPlus aria-hidden="true" />}
                {saveMutation.isPending
                  ? "جارٍ الحفظ…"
                  : isEdit
                    ? "حفظ التعديلات"
                    : "جدولة الدورة"}
              </button>
              <a
                className="btn btn-ghost btn-block"
                href="/training"
                onClick={(event) => {
                  event.preventDefault();
                  navigate("/training");
                }}
              >
                إلغاء
              </a>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
