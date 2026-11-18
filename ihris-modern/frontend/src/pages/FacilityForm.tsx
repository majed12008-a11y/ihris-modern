import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";
import { AlertCircle, Save } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { ErrorState, LoadingState } from "@/components/ui/StateViews";

interface Reference {
  id: number;
  name: string;
}

interface FacilityFormData {
  name: string;
  facilityTypeId: string;
  countryId: string;
  regionId: string;
  districtId: string;
  countyId: string;
}

const emptyForm: FacilityFormData = {
  name: "",
  facilityTypeId: "",
  countryId: "",
  regionId: "",
  districtId: "",
  countyId: "",
};

export default function FacilityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const facilityId = id ? parseInt(id, 10) : null;
  const isEdit = !!facilityId;

  const [formData, setFormData] = useState<FacilityFormData>(emptyForm);
  const [version, setVersion] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FacilityFormData, string>>
  >({});

  // ------------------------------------------------------------
  // بيانات مرجعية (ADR-006): تحميل عبر API بدل القيم الثابتة
  // ------------------------------------------------------------
  const { data: countries = [] } = useQuery<Reference[]>({
    queryKey: ["meta-countries"],
    queryFn: async () => (await api.get("/facilities/meta/countries")).data,
  });

  const { data: regions = [] } = useQuery<Reference[]>({
    queryKey: ["meta-regions"],
    queryFn: async () => (await api.get("/facilities/meta/regions")).data,
  });

  const { data: facilityTypes = [] } = useQuery<Reference[]>({
    queryKey: ["meta-facility-types"],
    queryFn: async () => (await api.get("/facilities/meta/facility-types")).data,
  });

  // Cascade: المحافظات تعتمد على الدولة
  const { data: districts = [], isFetching: loadingDistricts } = useQuery<Reference[]>({
    queryKey: ["meta-districts", formData.countryId],
    queryFn: async () =>
      (
        await api.get("/facilities/meta/districts", {
          params: { countryId: formData.countryId },
        })
      ).data,
    enabled: !!formData.countryId,
  });

  // Cascade: المديريات تعتمد على المحافظة
  const { data: counties = [], isFetching: loadingCounties } = useQuery<Reference[]>({
    queryKey: ["meta-counties", formData.districtId],
    queryFn: async () =>
      (
        await api.get("/facilities/meta/counties", {
          params: { districtId: formData.districtId },
        })
      ).data,
    enabled: !!formData.districtId,
  });

  const {
    data: existing,
    isLoading: isLoadingFacility,
    error: loadError,
    refetch,
  } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: async () => (await api.get(`/facilities/${facilityId}`)).data,
    enabled: !!facilityId,
  });

  useEffect(() => {
    if (!existing) return;
    setFormData({
      name: existing.name ?? "",
      facilityTypeId: existing.facilityTypeId ? String(existing.facilityTypeId) : "",
      countryId: existing.countryId ? String(existing.countryId) : "",
      regionId: existing.regionId ? String(existing.regionId) : "",
      districtId: existing.districtId ? String(existing.districtId) : "",
      countyId: existing.countyId ? String(existing.countyId) : "",
    });
    setVersion(existing.version);
  }, [existing]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put(`/facilities/${facilityId}`, {
        version,
        name: formData.name,
        facilityTypeId: formData.facilityTypeId
          ? parseInt(formData.facilityTypeId, 10)
          : null,
        countryId: parseInt(formData.countryId, 10),
        districtId: parseInt(formData.districtId, 10),
        countyId: parseInt(formData.countyId, 10),
        regionId: parseInt(formData.regionId, 10),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
      queryClient.invalidateQueries({ queryKey: ["facility", facilityId] });
      toast.success("تم تحديث المنشأة بنجاح");
      navigate(`/facilities/${facilityId}`);
    },
    onError: (error: any) => {
      const body = error.response?.data;
      setFormErrors(body?.errors || [body?.error || "فشل تحديث المنشأة"]);
      toast.error(body?.error || "فشل تحديث المنشأة");
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/facilities", {
        name: formData.name,
        facilityTypeId: formData.facilityTypeId
          ? parseInt(formData.facilityTypeId, 10)
          : null,
        countryId: parseInt(formData.countryId, 10),
        districtId: parseInt(formData.districtId, 10),
        countyId: parseInt(formData.countyId, 10),
        regionId: parseInt(formData.regionId, 10),
      });
      return res.data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
      toast.success("تم إضافة المنشأة بنجاح");
      navigate(`/facilities/${created.id}`);
    },
    onError: (error: any) => {
      const body = error.response?.data;
      setFormErrors(body?.errors || [body?.error || "فشل إضافة المنشأة"]);
      toast.error(body?.error || "فشل إضافة المنشأة");
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const set = (key: keyof FacilityFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const nextErrors: Partial<Record<keyof FacilityFormData, string>> = {};
    if (!formData.name.trim()) nextErrors.name = "اسم المنشأة مطلوب";
    if (!formData.countryId) nextErrors.countryId = "الدولة مطلوبة";
    if (!formData.regionId) nextErrors.regionId = "المنطقة مطلوبة";
    if (!formData.districtId) nextErrors.districtId = "المحافظة مطلوبة";
    if (!formData.countyId) nextErrors.countyId = "المديرية مطلوبة";

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const errors = ["الاسم والدولة والمنطقة والمحافظة والمديرية حقول مطلوبة (BR-097)"];
      setFormErrors(errors);
      toast.error(errors[0]);
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(`facility-${firstKey}`)?.focus();
      return;
    }

    if (isEdit && facilityId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const nameOf = (list: Reference[], value: string) =>
    value ? list.find((item) => String(item.id) === value)?.name ?? "—" : "—";

  if (isEdit && isLoadingFacility) {
    return (
      <div className="stack">
        <PageHeader
          title="تعديل منشأة"
          subtitle="تعديل بيانات المنشأة المحددة"
          backTo={`/facilities/${facilityId}`}
          backLabel="العودة إلى المنشأة"
        />
        <section className="card">
          <LoadingState label="جاري تحميل بيانات المنشأة…" />
        </section>
      </div>
    );
  }

  if (isEdit && loadError) {
    return (
      <div className="stack">
        <PageHeader
          title="تعديل منشأة"
          subtitle="تعديل بيانات المنشأة المحددة"
          backTo="/facilities"
          backLabel="رجوع إلى المنشآت"
        />
        <ErrorState
          title="تعذّر تحميل المنشأة"
          message={
            loadError instanceof Error ? loadError.message : "المنشأة غير موجودة"
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        title={isEdit ? "تعديل منشأة" : "إضافة منشأة جديدة"}
        subtitle={
          isEdit
            ? "تعديل بيانات المنشأة المحددة"
            : "إدخال منشأة صحية جديدة في النظام"
        }
        backTo={isEdit ? `/facilities/${facilityId}` : "/facilities"}
        backLabel={isEdit ? "العودة إلى المنشأة" : "رجوع إلى المنشآت"}
      />

      {formErrors.length > 0 && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle aria-hidden="true" />
          <div>
            <strong>تعذّر الحفظ.</strong>
            <ul style={{ margin: "4px 0 0", paddingInlineStart: 18 }}>
              {formErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="form-layout">
        <form
          id="facility-form"
          className="main-col form-stack"
          onSubmit={handleSubmit}
          noValidate
        >
          <section className="card">
            <div className="form-section-head">
              <span className="form-section-num" aria-hidden="true">
                1
              </span>
              <h2 className="form-section-title">بيانات المنشأة</h2>
              <span className="form-section-note">BR-097</span>
            </div>
            <div className="form-body">
              <div className="field full">
                <label className="label" htmlFor="facility-name">
                  اسم المنشأة <span className="req">*</span>
                </label>
                <input
                  className={`input${fieldErrors.name ? " is-invalid" : ""}`}
                  id="facility-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => set("name", e.target.value)}
                  maxLength={255}
                  aria-invalid={fieldErrors.name ? "true" : undefined}
                  aria-describedby={fieldErrors.name ? "facility-name-err" : undefined}
                  required
                />
                {fieldErrors.name && (
                  <p className="err" id="facility-name-err">
                    <AlertCircle aria-hidden="true" />
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div className="field">
                <label className="label" htmlFor="facility-type">
                  نوع المنشأة
                </label>
                <select
                  className="select"
                  id="facility-type"
                  value={formData.facilityTypeId}
                  onChange={(e) => set("facilityTypeId", e.target.value)}
                >
                  <option value="">اختر النوع</option>
                  {facilityTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="facility-country">
                  الدولة <span className="req">*</span>
                </label>
                <select
                  className={`select${fieldErrors.countryId ? " is-invalid" : ""}`}
                  id="facility-country"
                  value={formData.countryId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      countryId: e.target.value,
                      districtId: "",
                      countyId: "",
                    })
                  }
                  aria-invalid={fieldErrors.countryId ? "true" : undefined}
                  aria-describedby={
                    fieldErrors.countryId ? "facility-country-err" : undefined
                  }
                  required
                >
                  <option value="">اختر الدولة</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.countryId && (
                  <p className="err" id="facility-country-err">
                    <AlertCircle aria-hidden="true" />
                    {fieldErrors.countryId}
                  </p>
                )}
              </div>

              <div className="field">
                <label className="label" htmlFor="facility-region">
                  المنطقة <span className="req">*</span>
                </label>
                <select
                  className={`select${fieldErrors.regionId ? " is-invalid" : ""}`}
                  id="facility-region"
                  value={formData.regionId}
                  onChange={(e) => set("regionId", e.target.value)}
                  aria-invalid={fieldErrors.regionId ? "true" : undefined}
                  aria-describedby={
                    fieldErrors.regionId ? "facility-region-err" : undefined
                  }
                  required
                >
                  <option value="">اختر المنطقة</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.regionId && (
                  <p className="err" id="facility-region-err">
                    <AlertCircle aria-hidden="true" />
                    {fieldErrors.regionId}
                  </p>
                )}
              </div>

              <div className="field">
                <label className="label" htmlFor="facility-district">
                  المحافظة <span className="req">*</span>
                </label>
                <select
                  className={`select${fieldErrors.districtId ? " is-invalid" : ""}`}
                  id="facility-district"
                  value={formData.districtId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      districtId: e.target.value,
                      countyId: "",
                    })
                  }
                  aria-invalid={fieldErrors.districtId ? "true" : undefined}
                  aria-describedby={
                    fieldErrors.districtId ? "facility-district-err" : undefined
                  }
                  required
                  disabled={!formData.countryId || loadingDistricts}
                >
                  <option value="">
                    {!formData.countryId
                      ? "اختر الدولة أولاً"
                      : loadingDistricts
                      ? "جاري التحميل…"
                      : "اختر المحافظة"}
                  </option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.districtId && (
                  <p className="err" id="facility-district-err">
                    <AlertCircle aria-hidden="true" />
                    {fieldErrors.districtId}
                  </p>
                )}
              </div>

              <div className="field">
                <label className="label" htmlFor="facility-county">
                  المديرية <span className="req">*</span>
                </label>
                <select
                  className={`select${fieldErrors.countyId ? " is-invalid" : ""}`}
                  id="facility-county"
                  value={formData.countyId}
                  onChange={(e) => set("countyId", e.target.value)}
                  aria-invalid={fieldErrors.countyId ? "true" : undefined}
                  aria-describedby={
                    fieldErrors.countyId ? "facility-county-err" : undefined
                  }
                  required
                  disabled={!formData.districtId || loadingCounties}
                >
                  <option value="">
                    {!formData.districtId
                      ? "اختر المحافظة أولاً"
                      : loadingCounties
                      ? "جاري التحميل…"
                      : "اختر المديرية"}
                  </option>
                  {counties.map((county) => (
                    <option key={county.id} value={county.id}>
                      {county.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.countyId && (
                  <p className="err" id="facility-county-err">
                    <AlertCircle aria-hidden="true" />
                    {fieldErrors.countyId}
                  </p>
                )}
              </div>

              <div className="field full">
                <span className="hint">
                  BR-097: المنشأة يجب أن يكون لها دولة ومحافظة ومديرية ومنطقة.
                </span>
              </div>
            </div>
          </section>
        </form>

        <aside className="side">
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">ملخّص المنشأة</h2>
            </div>
            <div className="card-body">
              <div className="summary-row">
                <span className="summary-key">اسم المنشأة</span>
                <span
                  className={`summary-val${formData.name.trim() ? "" : " empty"}`}
                >
                  {formData.name.trim() || "غير مكتمل"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">النوع</span>
                <span
                  className={`summary-val${
                    formData.facilityTypeId ? "" : " empty"
                  }`}
                >
                  {nameOf(facilityTypes, formData.facilityTypeId)}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">الدولة</span>
                <span className={`summary-val${formData.countryId ? "" : " empty"}`}>
                  {nameOf(countries, formData.countryId)}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">المنطقة</span>
                <span className={`summary-val${formData.regionId ? "" : " empty"}`}>
                  {nameOf(regions, formData.regionId)}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">المحافظة</span>
                <span className={`summary-val${formData.districtId ? "" : " empty"}`}>
                  {nameOf(districts, formData.districtId)}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">المديرية</span>
                <span className={`summary-val${formData.countyId ? "" : " empty"}`}>
                  {nameOf(counties, formData.countyId)}
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
                form="facility-form"
                className="btn btn-primary btn-block"
                disabled={isSaving}
              >
                <Save aria-hidden="true" />
                {isSaving
                  ? "جاري الحفظ…"
                  : isEdit
                  ? "تحديث البيانات"
                  : "حفظ المنشأة"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() =>
                  navigate(isEdit ? `/facilities/${facilityId}` : "/facilities")
                }
              >
                إلغاء
              </button>
              <p className="side-note">
                الحقول المعلّمة بـ <span className="req">*</span> إلزامية بحسب
                BR-097.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
