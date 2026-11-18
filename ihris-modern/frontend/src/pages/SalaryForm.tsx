import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";
import { Save, AlertCircle, Plus } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import { ErrorState, LoadingState } from "@/components/ui/StateViews";

interface SalaryFormData {
  personId: string;
  startDate: string;
  endDate: string;
  salary: string;
  notes: string;
}

interface SalaryRecord {
  id: number;
  personId: number;
  startDate: string;
  endDate: string | null;
  salary: string;
  notes: string | null;
  person?: { id: number; surname: string; firstname: string } | null;
}

interface FormErrors {
  personId?: string;
  startDate?: string;
  salary?: string;
}

const EMPTY: SalaryFormData = {
  personId: "",
  startDate: "",
  endDate: "",
  salary: "",
  notes: "",
};

/** تاريخ الـAPI (ISO) ← قيمة حقل date. */
function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return String(value).slice(0, 10);
}

/** المبلغ يصل كنص — نعرضه منسّقاً إن كان رقماً. */
function amountLabel(value: string): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? formatNumber(parsed) : value;
}

export default function SalaryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const salaryId = id ? parseInt(id, 10) : null;
  const isEdit = !!salaryId;

  const [formData, setFormData] = useState<SalaryFormData>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});

  const { data: salary, isLoading, error, refetch } = useQuery<SalaryRecord>({
    queryKey: ["salary", salaryId],
    queryFn: async () => {
      const res = await api.get(`/salaries/${salaryId}`);
      return res.data;
    },
    enabled: !!salaryId,
  });

  useEffect(() => {
    if (!salary) return;
    setFormData({
      personId: salary.personId ? String(salary.personId) : "",
      startDate: toDateInput(salary.startDate),
      endDate: toDateInput(salary.endDate),
      salary: salary.salary ?? "",
      notes: salary.notes ?? "",
    });
  }, [salary]);

  const updateMutation = useMutation({
    mutationFn: async (data: SalaryFormData) => {
      const res = await api.put(`/salaries/${salaryId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
      queryClient.invalidateQueries({ queryKey: ["salary", salaryId] });
      toast.success("تم تحديث الراتب بنجاح");
      navigate(`/salaries`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "فشل تحديث الراتب");
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
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "فشل إضافة الراتب");
    },
  });

  const saving = updateMutation.isPending || createMutation.isPending;

  const set = (key: keyof SalaryFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (key === "personId" || key === "startDate" || key === "salary") {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    const personId = formData.personId.trim();
    if (!personId) nextErrors.personId = "رقم معرف الموظف مطلوب";
    else if (!/^\d+$/.test(personId))
      nextErrors.personId = "أدخل رقماً صحيحاً لمعرّف الموظف";
    if (!formData.startDate) nextErrors.startDate = "تاريخ البدء مطلوب";
    if (!formData.salary.trim()) nextErrors.salary = "المبلغ مطلوب";
    setErrors(nextErrors);

    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      document.getElementById(`salary-${firstError}`)?.focus();
      return;
    }

    if (isEdit && salaryId) updateMutation.mutate(formData);
    else createMutation.mutate(formData);
  };

  const goBack = () => navigate("/salaries");

  if (isLoading && salaryId) {
    return (
      <div className="stack">
        <PageHeader
          title="تعديل راتب"
          subtitle="تعديل بيانات الراتب المحددة"
          backTo="/salaries"
          backLabel="رجوع إلى الرواتب"
        />
        <section className="card">
          <LoadingState label="جارٍ تحميل بيانات الراتب…" />
        </section>
      </div>
    );
  }

  if (error && salaryId) {
    return (
      <div className="stack">
        <PageHeader
          title="تعديل راتب"
          subtitle="تعديل بيانات الراتب المحددة"
          backTo="/salaries"
          backLabel="رجوع إلى الرواتب"
        />
        <ErrorState
          title="تعذّر تحميل بيانات الراتب"
          message={error instanceof Error ? error.message : String(error)}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const requiredFields = [
    formData.personId.trim(),
    formData.startDate,
    formData.salary.trim(),
  ];
  const filled = requiredFields.filter((value) => value !== "").length;
  const completion = Math.round((filled / requiredFields.length) * 100);

  const personName = salary?.person
    ? `${salary.person.surname} ${salary.person.firstname}`
    : null;
  const personSummary = personName
    ? personName
    : formData.personId.trim()
      ? `معرّف ${formData.personId.trim()}`
      : null;

  return (
    <div className="stack">
      <PageHeader
        title={isEdit ? "تعديل راتب" : "إضافة راتب جديد"}
        subtitle={
          isEdit ? "تعديل بيانات الراتب المحددة" : "تسجيل راتب جديد لموظف"
        }
        backTo="/salaries"
        backLabel="رجوع إلى الرواتب"
      />

      <div className="form-layout">
        <form
          id="salary-form"
          className="form-stack"
          onSubmit={handleSubmit}
          noValidate
        >
          <section className="card">
            <div className="form-section-head">
              <span className="form-section-num" aria-hidden="true">
                1
              </span>
              <h2 className="form-section-title">الموظف والفترة</h2>
              <span className="form-section-note">
                الحقول المعلّمة بـ <span className="req">*</span> إلزامية
              </span>
            </div>
            <div className="form-body">
              <div className="field full">
                <label className="label" htmlFor="salary-personId">
                  الموظف <span className="req">*</span>
                </label>
                <input
                  className={`input${errors.personId ? " is-invalid" : ""}`}
                  id="salary-personId"
                  name="personId"
                  type="text"
                  inputMode="numeric"
                  value={formData.personId}
                  onChange={(event) => set("personId", event.target.value)}
                  placeholder="رقم معرف الموظف"
                  spellCheck={false}
                  aria-invalid={errors.personId ? "true" : undefined}
                  aria-describedby={
                    errors.personId ? "salary-personId-err" : undefined
                  }
                  required
                />
                {errors.personId ? (
                  <p className="err" id="salary-personId-err">
                    <AlertCircle aria-hidden="true" />
                    {errors.personId}
                  </p>
                ) : (
                  <span className="hint">
                    مثال: 1 — رقم السجل الظاهر في شاشة الموظفين.
                  </span>
                )}
              </div>

              <div className="field">
                <label className="label" htmlFor="salary-startDate">
                  تاريخ البدء <span className="req">*</span>
                </label>
                <input
                  className={`input${errors.startDate ? " is-invalid" : ""}`}
                  id="salary-startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(event) => set("startDate", event.target.value)}
                  aria-invalid={errors.startDate ? "true" : undefined}
                  aria-describedby={
                    errors.startDate ? "salary-startDate-err" : undefined
                  }
                  required
                />
                {errors.startDate && (
                  <p className="err" id="salary-startDate-err">
                    <AlertCircle aria-hidden="true" />
                    {errors.startDate}
                  </p>
                )}
              </div>

              <div className="field">
                <label className="label" htmlFor="salary-endDate">
                  تاريخ الانتهاء
                </label>
                <input
                  className="input"
                  id="salary-endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(event) => set("endDate", event.target.value)}
                />
                <span className="hint">اتركه فارغاً إذا كان الراتب سارياً.</span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="form-section-head">
              <span className="form-section-num" aria-hidden="true">
                2
              </span>
              <h2 className="form-section-title">المبلغ والملاحظات</h2>
            </div>
            <div className="form-body">
              <div className="field full">
                <label className="label" htmlFor="salary-amount">
                  المبلغ <span className="req">*</span>
                </label>
                <div className="input-wrap">
                  <input
                    className={`input num${errors.salary ? " is-invalid" : ""}`}
                    id="salary-amount"
                    name="salary"
                    type="text"
                    inputMode="decimal"
                    value={formData.salary}
                    onChange={(event) => set("salary", event.target.value)}
                    placeholder="مثل: 150,000"
                    style={{ paddingInlineEnd: 42 }}
                    spellCheck={false}
                    aria-invalid={errors.salary ? "true" : undefined}
                    aria-describedby={
                      errors.salary ? "salary-amount-err" : undefined
                    }
                    required
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      insetInlineEnd: 11,
                      fontSize: 12,
                      color: "var(--text-3)",
                      pointerEvents: "none",
                    }}
                  >
                    ر.ي
                  </span>
                </div>
                {errors.salary ? (
                  <p className="err" id="salary-amount-err">
                    <AlertCircle aria-hidden="true" />
                    {errors.salary}
                  </p>
                ) : (
                  <span className="hint">
                    أدخل المبلغ بالأرقام فقط؛ يُحفظ كما هو دون تقريب.
                  </span>
                )}
              </div>

              <div className="field full">
                <label className="label" htmlFor="salary-notes">
                  ملاحظات
                </label>
                <textarea
                  className="textarea"
                  id="salary-notes"
                  name="notes"
                  value={formData.notes}
                  onChange={(event) => set("notes", event.target.value)}
                  rows={3}
                  placeholder="أي تفاصيل إضافية عن الراتب…"
                />
              </div>
            </div>
          </section>
        </form>

        <aside className="side">
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">ملخّص الراتب</h2>
            </div>
            <div className="card-body">
              <div className="summary-row">
                <span className="summary-key">الموظف</span>
                <span className={`summary-val${personSummary ? "" : " empty"}`}>
                  {personSummary ?? "غير محدد"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">تاريخ البدء</span>
                <span
                  className={`summary-val${formData.startDate ? "" : " empty"}`}
                >
                  {formData.startDate ? formatDate(formData.startDate) : "غير محدد"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">تاريخ الانتهاء</span>
                <span
                  className={`summary-val${formData.endDate ? "" : " empty"}`}
                >
                  {formData.endDate ? formatDate(formData.endDate) : "غير محدد"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">المبلغ</span>
                <span
                  className={`summary-val num${formData.salary.trim() ? "" : " empty"}`}
                >
                  {formData.salary.trim()
                    ? `${amountLabel(formData.salary)} ر.ي`
                    : "غير محدد"}
                </span>
              </div>

              <div className="progress" style={{ marginTop: 14 }}>
                <div className="progress-top">
                  <b>اكتمال البيانات</b>
                  <span>
                    {filled} من {requiredFields.length}
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${completion}%` }}
                  />
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
                form="salary-form"
                className="btn btn-primary btn-block"
                disabled={saving}
              >
                {isEdit ? (
                  <Save aria-hidden="true" />
                ) : (
                  <Plus aria-hidden="true" />
                )}
                {saving
                  ? "جارٍ الحفظ…"
                  : isEdit
                    ? "تحديث البيانات"
                    : "حفظ الراتب"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={goBack}
              >
                إلغاء
              </button>
              <p className="side-note">
                تُحفظ القيم كما أُدخلت. راجع الموظف والمبلغ قبل الحفظ.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
