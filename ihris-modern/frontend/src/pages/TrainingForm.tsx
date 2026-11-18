import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { extractErrorMessages } from "@/lib/errorDetails";
import { toast } from "sonner";
import { Save, X, AlertCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { ErrorState, LoadingState } from "@/components/ui/StateViews";

interface Institution {
  id: number;
  name: string;
}
interface Status {
  id: number;
  name: string;
}
interface Category {
  id: number;
  name: string;
}

interface TrainingFormData {
  name: string;
  topic: string;
  notes: string;
  trainingInstitutionId: string;
  trainingFunder: string;
  continuingEducationCourse: string;
  trainingCourseStatusId: string;
  trainingCourseCategoryId: string;
  competency: string;
}

const EMPTY: TrainingFormData = {
  name: "",
  topic: "",
  notes: "",
  trainingInstitutionId: "",
  trainingFunder: "",
  continuingEducationCourse: "",
  trainingCourseStatusId: "",
  trainingCourseCategoryId: "",
  competency: "",
};

function toNullableNumber(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toNullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export default function TrainingForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<TrainingFormData>(EMPTY);
  const [version, setVersion] = useState<number>(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);

  const institutionsQuery = useQuery<Institution[]>({
    queryKey: ["training-institutions"],
    queryFn: async () => (await api.get("/training/institutions")).data,
  });
  const statusesQuery = useQuery<Status[]>({
    queryKey: ["training-statuses"],
    queryFn: async () => (await api.get("/training/statuses")).data,
  });
  const categoriesQuery = useQuery<Category[]>({
    queryKey: ["training-categories"],
    queryFn: async () => (await api.get("/training/categories")).data,
  });

  const courseQuery = useQuery({
    queryKey: ["training-course", id],
    enabled: isEdit,
    queryFn: async () => (await api.get(`/training/courses/${id}`)).data,
  });

  useEffect(() => {
    if (!isEdit || !courseQuery.data) return;
    const course = courseQuery.data;
    setFormData({
      name: course.name ?? "",
      topic: course.topic ?? "",
      notes: course.notes ?? "",
      trainingInstitutionId: course.trainingInstitutionId
        ? String(course.trainingInstitutionId)
        : "",
      trainingFunder: course.trainingFunder ?? "",
      continuingEducationCourse: course.continuingEducationCourse ?? "",
      trainingCourseStatusId: course.trainingCourseStatusId
        ? String(course.trainingCourseStatusId)
        : "",
      trainingCourseCategoryId: course.trainingCourseCategoryId
        ? String(course.trainingCourseCategoryId)
        : "",
      competency: course.competency ?? "",
    });
    setVersion(course.version ?? 1);
  }, [isEdit, courseQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        name: formData.name.trim(),
        topic: toNullableText(formData.topic),
        notes: toNullableText(formData.notes),
        trainingInstitutionId: toNullableNumber(formData.trainingInstitutionId),
        trainingFunder: toNullableText(formData.trainingFunder),
        continuingEducationCourse: toNullableText(formData.continuingEducationCourse),
        trainingCourseStatusId: toNullableNumber(formData.trainingCourseStatusId),
        trainingCourseCategoryId: toNullableNumber(formData.trainingCourseCategoryId),
        competency: toNullableText(formData.competency),
      };
      if (isEdit) {
        body.version = version;
        return (await api.put(`/training/courses/${id}`, body)).data;
      }
      return (await api.post("/training/courses", body)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-courses"] });
      queryClient.invalidateQueries({ queryKey: ["training-course", id] });
      toast.success(isEdit ? "تم تحديث الدورة التدريبية" : "تمت إضافة الدورة التدريبية");
      navigate("/training");
    },
    onError: (error) => {
      setErrors(extractErrorMessages(error));
    },
  });

  const set = (key: keyof TrainingFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [key]: event.target.value }));
    if (key === "name" && nameError) setNameError(null);
  };

  const institutions = institutionsQuery.data ?? [];
  const statuses = statusesQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const institutionName = institutions.find(
    (item) => String(item.id) === formData.trainingInstitutionId
  )?.name;
  const statusName = statuses.find(
    (item) => String(item.id) === formData.trainingCourseStatusId
  )?.name;
  const categoryName = categories.find(
    (item) => String(item.id) === formData.trainingCourseCategoryId
  )?.name;

  const completionFields = [
    formData.name,
    formData.topic,
    formData.trainingInstitutionId,
    formData.trainingCourseStatusId,
    formData.trainingCourseCategoryId,
  ];
  const filled = completionFields.filter((value) => value.trim() !== "").length;
  const completion = Math.round((filled / completionFields.length) * 100);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrors([]);
    if (!formData.name.trim()) {
      setNameError("اسم الدورة مطلوب");
      document.getElementById("training-course-name")?.focus();
      return;
    }
    setNameError(null);
    saveMutation.mutate();
  };

  const title = isEdit ? "تعديل دورة تدريبية" : "إضافة دورة تدريبية";
  const subtitle = isEdit
    ? `الإصدار الحالي: v${version}`
    : "تسجيل دورة تدريبية جديدة في النظام";

  if (isEdit && courseQuery.isLoading) {
    return (
      <div className="stack">
        <PageHeader title={title} subtitle={subtitle} backTo="/training" backLabel="العودة" />
        <section className="card">
          <LoadingState label="جارٍ تحميل بيانات الدورة…" />
        </section>
      </div>
    );
  }

  if (isEdit && courseQuery.error) {
    return (
      <div className="stack">
        <PageHeader title={title} subtitle={subtitle} backTo="/training" backLabel="العودة" />
        <ErrorState
          title="تعذّر تحميل بيانات الدورة"
          message={extractErrorMessages(courseQuery.error).join(" — ")}
          onRetry={() => courseQuery.refetch()}
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
            <strong>تعذر حفظ الدورة</strong>
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
          id="training-course-form"
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
              <h2 className="form-section-title">بيانات الدورة</h2>
              <span className="form-section-note">الاسم والموضوع كما في خطة التدريب</span>
            </div>
            <div className="form-body">
              <div className="field full">
                <label className="label" htmlFor="training-course-name">
                  اسم الدورة <span className="req">*</span>
                </label>
                <input
                  className={`input${nameError ? " is-invalid" : ""}`}
                  id="training-course-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={set("name")}
                  maxLength={255}
                  spellCheck={false}
                  aria-invalid={nameError ? "true" : undefined}
                  aria-describedby={nameError ? "training-course-name-err" : undefined}
                  required
                />
                {nameError && (
                  <p className="err" id="training-course-name-err">
                    <AlertCircle aria-hidden="true" />
                    {nameError}
                  </p>
                )}
              </div>

              <div className="field">
                <label className="label" htmlFor="training-course-topic">
                  الموضوع
                </label>
                <input
                  className="input"
                  id="training-course-topic"
                  name="topic"
                  type="text"
                  value={formData.topic}
                  onChange={set("topic")}
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
              <h2 className="form-section-title">التصنيف والمؤسسة</h2>
            </div>
            <div className="form-body">
              <div className="field">
                <label className="label" htmlFor="training-course-institution">
                  المؤسسة التدريبية
                </label>
                <select
                  className="select"
                  id="training-course-institution"
                  value={formData.trainingInstitutionId}
                  onChange={set("trainingInstitutionId")}
                >
                  <option value="">بدون مؤسسة</option>
                  {institutions.map((institution) => (
                    <option key={institution.id} value={institution.id}>
                      {institution.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="training-course-status">
                  حالة الدورة
                </label>
                <select
                  className="select"
                  id="training-course-status"
                  value={formData.trainingCourseStatusId}
                  onChange={set("trainingCourseStatusId")}
                >
                  <option value="">بدون حالة</option>
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="training-course-category">
                  التصنيف
                </label>
                <select
                  className="select"
                  id="training-course-category"
                  value={formData.trainingCourseCategoryId}
                  onChange={set("trainingCourseCategoryId")}
                >
                  <option value="">بدون تصنيف</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="training-course-funder">
                  الممول
                </label>
                <input
                  className="input"
                  id="training-course-funder"
                  name="trainingFunder"
                  type="text"
                  value={formData.trainingFunder}
                  onChange={set("trainingFunder")}
                  spellCheck={false}
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="training-course-continuing">
                  دورة التعليم المستمر
                </label>
                <input
                  className="input"
                  id="training-course-continuing"
                  name="continuingEducationCourse"
                  type="text"
                  value={formData.continuingEducationCourse}
                  onChange={set("continuingEducationCourse")}
                  spellCheck={false}
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="training-course-competency">
                  الجدارة
                </label>
                <input
                  className="input"
                  id="training-course-competency"
                  name="competency"
                  type="text"
                  value={formData.competency}
                  onChange={set("competency")}
                  spellCheck={false}
                />
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
                <label className="label" htmlFor="training-course-notes">
                  الملاحظات
                </label>
                <textarea
                  className="textarea"
                  id="training-course-notes"
                  name="notes"
                  value={formData.notes}
                  onChange={set("notes")}
                  rows={4}
                />
                <span className="hint">اختياري. تظهر داخل تفاصيل الدورة التدريبية.</span>
              </div>
            </div>
          </section>
        </form>

        <aside className="side">
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">ملخّص الدورة</h2>
            </div>
            <div className="card-body">
              <div className="summary-row">
                <span className="summary-key">اسم الدورة</span>
                <span className={`summary-val${formData.name ? "" : " empty"}`}>
                  {formData.name || "غير مكتمل"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">المؤسسة</span>
                <span
                  className={`summary-val${
                    formData.trainingInstitutionId ? "" : " empty"
                  }`}
                >
                  {institutionName ?? "غير محددة"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">الحالة</span>
                <span
                  className={`summary-val${
                    formData.trainingCourseStatusId ? "" : " empty"
                  }`}
                >
                  {statusName ?? "بدون حالة"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">التصنيف</span>
                <span
                  className={`summary-val${
                    formData.trainingCourseCategoryId ? "" : " empty"
                  }`}
                >
                  {categoryName ?? "بدون تصنيف"}
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
                form="training-course-form"
                className="btn btn-primary btn-block"
                disabled={saveMutation.isPending}
              >
                <Save aria-hidden="true" />
                {saveMutation.isPending ? "جارٍ الحفظ…" : "حفظ الدورة التدريبية"}
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
              <p className="side-note">
                الحقول المعلّمة بـ <span className="req">*</span> إلزامية. يُسجَّل كل تعديل في سجل
                التدقيق مع اسم المستخدم ووقت الحفظ.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
