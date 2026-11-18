import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";
import { Save, AlertCircle, FilePlus2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { ErrorState, LoadingState } from "@/components/ui/StateViews";
import { formatDate, formatNumber } from "@/lib/format";

interface ReportFormData {
  name: string;
  description: string;
  type: string;
  definition: any;
  isEnabled: boolean;
}

interface ReportDetail {
  id: number;
  name: string;
  description: string | null;
  type: string;
  definition: any;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  list: "قائمة",
  table: "جدول",
  pie: "رسم بياني دائري",
  bar: "رسم بياني شريطي",
  line: "رسم بياني خطي",
};

export default function ReportForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reportId = id ? parseInt(id, 10) : null;
  const isEdit = !!reportId;

  const [formData, setFormData] = useState<ReportFormData>({
    name: "",
    description: "",
    type: "list",
    definition: {},
    isEnabled: true,
  });
  const [definitionText, setDefinitionText] = useState("{}");
  const [errors, setErrors] = useState<{
    name?: string;
    definition?: string;
  }>({});

  const {
    data: report,
    isLoading,
    error: loadError,
    refetch,
  } = useQuery<ReportDetail>({
    queryKey: ["report", reportId],
    queryFn: async () => {
      const res = await api.get(`/reports/${reportId}`);
      return res.data;
    },
    enabled: !!reportId,
  });

  useEffect(() => {
    if (report) {
      setFormData({
        name: report.name,
        description: report.description || "",
        type: report.type,
        definition: report.definition || {},
        isEnabled: report.isEnabled,
      });
      setDefinitionText(
        JSON.stringify(report.definition ?? {}, null, 2)
      );
    }
  }, [report]);

  const createMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const res = await api.post("/reports", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("تم إنشاء التقرير بنجاح");
      navigate("/reports");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل إنشاء التقرير");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const res = await api.put(`/reports/${reportId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["report", reportId] });
      toast.success("تم تحديث التقرير بنجاح");
      navigate("/reports");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل تحديث التقرير");
    },
  });

  const saving = createMutation.isPending || updateMutation.isPending;

  const set = <K extends keyof ReportFormData>(
    key: K,
    value: ReportFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (key === "name") setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const parsedDefinition = useMemo(() => {
    try {
      return JSON.parse(definitionText);
    } catch {
      return null;
    }
  }, [definitionText]);

  const definitionSummary = useMemo(() => {
    const raw = parsedDefinition;
    const definition =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, any>)
        : null;

    const entityCandidate = definition
      ? definition.table ?? definition.entity ?? definition.model ?? definition.source
      : null;
    const fields = definition
      ? Array.isArray(definition.fields)
        ? definition.fields
        : Array.isArray(definition.columns)
          ? definition.columns
          : null
      : null;
    const filterCount =
      definition &&
      definition.filters &&
      typeof definition.filters === "object" &&
      !Array.isArray(definition.filters)
        ? Object.keys(definition.filters).length
        : 0;

    return {
      entity:
        typeof entityCandidate === "string" && entityCandidate.trim()
          ? entityCandidate
          : null,
      fieldCount: fields ? fields.length : null,
      filterCount,
    };
  }, [parsedDefinition]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: typeof errors = {};
    if (!formData.name.trim()) nextErrors.name = "اسم التقرير مطلوب";

    let definition = formData.definition;
    if (!definitionText.trim()) {
      nextErrors.definition = "تعريف التقرير مطلوب بصيغة JSON";
    } else {
      try {
        definition = JSON.parse(definitionText);
      } catch {
        nextErrors.definition = "تعريف التقرير ليس JSON صالحاً";
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      document
        .getElementById(nextErrors.name ? "report-name" : "report-definition")
        ?.focus();
      return;
    }

    const payload: ReportFormData = { ...formData, definition };
    if (isEdit && reportId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading && reportId) {
    return (
      <div className="stack">
        <PageHeader
          title="تعديل تقرير"
          subtitle="جاري تحميل بيانات التقرير…"
          backTo="/reports"
          backLabel="رجوع إلى التقارير"
        />
        <section className="card">
          <LoadingState label="جاري تحميل التقرير…" />
        </section>
      </div>
    );
  }

  if (isEdit && loadError) {
    return (
      <div className="stack">
        <PageHeader
          title="تعديل تقرير"
          backTo="/reports"
          backLabel="رجوع إلى التقارير"
        />
        <ErrorState
          title="تعذّر تحميل التقرير"
          message={
            loadError instanceof Error
              ? loadError.message
              : "قد يكون التقرير محذوفاً أو غير متاح لحسابك."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const typeOptions = Object.entries(TYPE_LABELS);

  return (
    <div className="stack">
      <PageHeader
        title={isEdit ? "تعديل تقرير" : "إضافة تقرير جديد"}
        subtitle={
          isEdit ? "تعديل تقرير موجود" : "إنشاء تقرير مخصص جديد"
        }
        backTo="/reports"
        backLabel="رجوع إلى التقارير"
      />

      <div className="form-layout">
        <form
          id="report-form"
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
              <h2 className="form-section-title">البيانات الأساسية</h2>
              <span className="form-section-note">
                الحقول المعلّمة بـ <span className="req">*</span> إلزامية
              </span>
            </div>
            <div className="form-body">
              <div className="field full">
                <label className="label" htmlFor="report-name">
                  اسم التقرير <span className="req">*</span>
                </label>
                <input
                  className={`input${errors.name ? " is-invalid" : ""}`}
                  id="report-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="مثال: تقرير الموظفين حسب المنشأة"
                  spellCheck={false}
                  aria-invalid={errors.name ? "true" : undefined}
                  aria-describedby={errors.name ? "report-name-err" : undefined}
                  required
                />
                {errors.name && (
                  <p className="err" id="report-name-err">
                    <AlertCircle aria-hidden="true" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="field">
                <label className="label" htmlFor="report-type">
                  نوع التقرير <span className="req">*</span>
                </label>
                <select
                  className="select"
                  id="report-type"
                  name="type"
                  value={formData.type}
                  onChange={(e) => set("type", e.target.value)}
                  required
                >
                  {typeOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="report-status">
                  الحالة <span className="req">*</span>
                </label>
                <select
                  className="select"
                  id="report-status"
                  name="isEnabled"
                  value={formData.isEnabled ? "true" : "false"}
                  onChange={(e) => set("isEnabled", e.target.value === "true")}
                  required
                >
                  <option value="true">مفعل</option>
                  <option value="false">معطل</option>
                </select>
                <span className="hint">
                  التقرير المعطل لا يمكن تشغيله أو تصديره.
                </span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="form-section-head">
              <span className="form-section-num" aria-hidden="true">
                2
              </span>
              <h2 className="form-section-title">الوصف</h2>
              <span className="form-section-note">اختياري</span>
            </div>
            <div className="form-body">
              <div className="field full">
                <label className="label" htmlFor="report-description">
                  وصف التقرير
                </label>
                <textarea
                  className="textarea"
                  id="report-description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  placeholder="ما الذي يعرضه هذا التقرير ولمن؟"
                />
              </div>
            </div>
          </section>

          <section className="card">
            <div className="form-section-head">
              <span className="form-section-num" aria-hidden="true">
                3
              </span>
              <h2 className="form-section-title">تعريف التقرير</h2>
              <span className="form-section-note">JSON</span>
            </div>
            <div className="form-body">
              <div className="field full">
                <label className="label" htmlFor="report-definition">
                  تعريف التقرير (JSON)
                </label>
                <textarea
                  className={`textarea${errors.definition ? " is-invalid" : ""}`}
                  id="report-definition"
                  name="definition"
                  dir="ltr"
                  style={{
                    fontVariantNumeric: "tabular-nums",
                    textAlign: "left",
                    lineHeight: 1.6,
                  }}
                  value={definitionText}
                  onChange={(e) => {
                    setDefinitionText(e.target.value);
                    setErrors((prev) => ({ ...prev, definition: undefined }));
                  }}
                  rows={10}
                  spellCheck={false}
                  placeholder='{"fields": ["name", "surname"], "table": "person", "filters": {}}'
                  aria-invalid={errors.definition ? "true" : undefined}
                  aria-describedby={
                    errors.definition
                      ? "report-definition-err report-definition-hint"
                      : "report-definition-hint"
                  }
                />
                {errors.definition ? (
                  <p className="err" id="report-definition-err">
                    <AlertCircle aria-hidden="true" />
                    {errors.definition}
                  </p>
                ) : (
                  <span className="hint" id="report-definition-hint">
                    تعريف التقرير بصيغة JSON يحدد الحقول والعلاقات والفلاتر التي
                    سيتم تضمينها في التقرير.
                  </span>
                )}
              </div>
            </div>
          </section>
        </form>

        <aside className="side">
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">ملخّص التقرير</h2>
            </div>
            <div className="card-body">
              <div className="summary-row">
                <span className="summary-key">اسم التقرير</span>
                <span
                  className={`summary-val${formData.name ? "" : " empty"}`}
                >
                  {formData.name || "غير محدد"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">نوع التقرير</span>
                <span className="summary-val">
                  {TYPE_LABELS[formData.type] ?? formData.type}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">الحالة</span>
                <span className="summary-val">
                  {formData.isEnabled ? "مفعل" : "معطل"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">الكيان</span>
                <span
                  className={`summary-val${
                    definitionSummary.entity ? "" : " empty"
                  }`}
                >
                  {definitionSummary.entity ?? "غير محدد"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">الحقول</span>
                <span
                  className={`summary-val${
                    definitionSummary.fieldCount === null ? " empty" : ""
                  }`}
                >
                  {definitionSummary.fieldCount === null
                    ? "غير محدد"
                    : formatNumber(definitionSummary.fieldCount)}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">الفلاتر</span>
                <span
                  className={`summary-val${
                    parsedDefinition ? "" : " empty"
                  }`}
                >
                  {parsedDefinition
                    ? formatNumber(definitionSummary.filterCount)
                    : "JSON غير صالح"}
                </span>
              </div>
              {isEdit && report && (
                <div className="summary-row">
                  <span className="summary-key">آخر تعديل</span>
                  <span className="summary-val">
                    {formatDate(report.updatedAt)}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div
              className="card-body"
              style={{ display: "flex", flexDirection: "column", gap: 9 }}
            >
              <button
                type="submit"
                form="report-form"
                className="btn btn-primary btn-block"
                disabled={saving}
              >
                {isEdit ? (
                  <Save aria-hidden="true" />
                ) : (
                  <FilePlus2 aria-hidden="true" />
                )}
                {saving
                  ? "جاري الحفظ…"
                  : isEdit
                    ? "تحديث التقرير"
                    : "إنشاء التقرير"}
              </button>
              <a
                className="btn btn-ghost btn-block"
                href="/reports"
                onClick={(event) => {
                  event.preventDefault();
                  navigate("/reports");
                }}
              >
                إلغاء
              </a>
              <p className="side-note">
                يُحفظ تعريف التقرير بصيغة JSON ويُتحقق من صحته قبل التشغيل.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
