import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";
import { Save, ArrowRight, AlertCircle, UserPlus } from "lucide-react";
import type { Person } from "@/types";
import { formatDate } from "@/lib/format";

interface PersonFormData {
  surname: string;
  firstname: string;
  othername: string;
  nationalityId: string;
  countryId: string;
  districtId: string;
  countyId: string;
  residenceCountryId: string;
  residenceDistrictId: string;
  residenceCountyId: string;
}

interface CountryOption {
  id: number;
  name: string;
}

const EMPTY: PersonFormData = {
  surname: "",
  firstname: "",
  othername: "",
  nationalityId: "",
  countryId: "",
  districtId: "",
  countyId: "",
  residenceCountryId: "",
  residenceDistrictId: "",
  residenceCountyId: "",
};

export default function PersonForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const personId = id ? parseInt(id, 10) : null;
  const isEdit = !!personId;

  const [formData, setFormData] = useState<PersonFormData>(EMPTY);
  const [errors, setErrors] = useState<{ surname?: string; firstname?: string }>({});

  const { data: person, isLoading } = useQuery<Person>({
    queryKey: ["person", personId],
    queryFn: async () => {
      const res = await api.get(`/persons/${personId}`);
      return res.data;
    },
    enabled: !!personId,
  });

  const { data: countries } = useQuery<CountryOption[]>({
    queryKey: ["countries", "options"],
    queryFn: async () => {
      const res = await api.get("/countries", { params: { limit: 100 } });
      return res.data.data ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (person) {
      setFormData({
        surname: person.surname,
        firstname: person.firstname,
        othername: person.othername || "",
        nationalityId: String(person.nationalityId || ""),
        countryId: String(person.countryId || ""),
        districtId: String(person.districtId || ""),
        countyId: String(person.countyId || ""),
        residenceCountryId: String(person.residenceCountryId || ""),
        residenceDistrictId: String(person.residenceDistrictId || ""),
        residenceCountyId: String(person.residenceCountyId || ""),
      });
    }
  }, [person]);

  const countryName = useMemo(() => {
    const map = new Map<number, string>();
    (countries ?? []).forEach((country) => map.set(country.id, country.name));
    return (value: string) => (value ? map.get(Number(value)) ?? "—" : "—");
  }, [countries]);

  const updateMutation = useMutation({
    mutationFn: async (data: PersonFormData) => {
      const res = await api.put(`/persons/${personId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persons"] });
      queryClient.invalidateQueries({ queryKey: ["person", personId] });
      toast.success("تم تحديث بيانات الموظف");
      navigate(`/persons/${personId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل تحديث بيانات الموظف");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PersonFormData) => {
      const res = await api.post("/persons", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persons"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("تمت إضافة الموظف");
      navigate("/persons");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "فشل إضافة الموظف");
    },
  });

  const saving = updateMutation.isPending || createMutation.isPending;

  const set = (key: keyof PersonFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (key === "surname" || key === "firstname") {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!formData.surname.trim()) nextErrors.surname = "اللقب مطلوب";
    if (!formData.firstname.trim()) nextErrors.firstname = "الاسم الأول مطلوب";
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(`person-${firstKey}`)?.focus();
      return;
    }

    if (isEdit && personId) updateMutation.mutate(formData);
    else createMutation.mutate(formData);
  };

  const completionFields = [
    formData.surname,
    formData.firstname,
    formData.nationalityId,
    formData.countryId,
    formData.residenceCountryId,
  ];
  const filled = completionFields.filter((value) => value.trim() !== "").length;
  const completion = Math.round((filled / completionFields.length) * 100);

  const fullName =
    [formData.firstname, formData.surname].filter(Boolean).join(" ") || null;

  if (isLoading && personId) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "grid", gap: 14 }}>
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="skeleton" style={{ height: 36 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            {isEdit ? "تعديل موظف" : "إضافة موظف"}
          </h1>
          <p className="page-sub">
            الحقول المعلّمة بـ <span className="req">*</span> إلزامية.
          </p>
        </div>
        <div className="head-actions">
          <a
            className="btn btn-ghost"
            href={isEdit ? `/persons/${personId}` : "/persons"}
            onClick={(event) => {
              event.preventDefault();
              navigate(isEdit ? `/persons/${personId}` : "/persons");
            }}
          >
            <ArrowRight aria-hidden="true" />
            العودة
          </a>
        </div>
      </div>

      <div className="form-layout">
        <form
          id="person-form"
          className="form-stack"
          onSubmit={handleSubmit}
          noValidate
        >
          <section className="card">
            <div className="form-section-head">
              <span className="form-section-num" aria-hidden="true">
                1
              </span>
              <h2 className="form-section-title">البيانات الشخصية</h2>
              <span className="form-section-note">كما في وثيقة الهوية</span>
            </div>
            <div className="form-body">
              <div className="field">
                <label className="label" htmlFor="person-firstname">
                  الاسم الأول <span className="req">*</span>
                </label>
                <input
                  className={`input${errors.firstname ? " is-invalid" : ""}`}
                  id="person-firstname"
                  name="firstname"
                  type="text"
                  value={formData.firstname}
                  onChange={(e) => set("firstname", e.target.value)}
                  autoComplete="given-name"
                  spellCheck={false}
                  aria-invalid={errors.firstname ? "true" : undefined}
                  aria-describedby={errors.firstname ? "person-firstname-err" : undefined}
                  required
                />
                {errors.firstname && (
                  <p className="err" id="person-firstname-err">
                    <AlertCircle aria-hidden="true" />
                    {errors.firstname}
                  </p>
                )}
              </div>

              <div className="field">
                <label className="label" htmlFor="person-surname">
                  اللقب (اسم العائلة) <span className="req">*</span>
                </label>
                <input
                  className={`input${errors.surname ? " is-invalid" : ""}`}
                  id="person-surname"
                  name="surname"
                  type="text"
                  value={formData.surname}
                  onChange={(e) => set("surname", e.target.value)}
                  autoComplete="family-name"
                  spellCheck={false}
                  aria-invalid={errors.surname ? "true" : undefined}
                  aria-describedby={errors.surname ? "person-surname-err" : undefined}
                  required
                />
                {errors.surname && (
                  <p className="err" id="person-surname-err">
                    <AlertCircle aria-hidden="true" />
                    {errors.surname}
                  </p>
                )}
              </div>

              <div className="field full">
                <label className="label" htmlFor="person-othername">
                  الأسماء الأخرى
                </label>
                <input
                  className="input"
                  id="person-othername"
                  name="othername"
                  type="text"
                  value={formData.othername}
                  onChange={(e) => set("othername", e.target.value)}
                  placeholder="اسم الأب أو الأسماء الوسطى…"
                  spellCheck={false}
                />
                <span className="hint">
                  اختياري. يظهر في الملف الشخصي ويساعد في تمييز الأسماء المتشابهة.
                </span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="form-section-head">
              <span className="form-section-num" aria-hidden="true">
                2
              </span>
              <h2 className="form-section-title">الجنسية والدولة</h2>
            </div>
            <div className="form-body">
              <div className="field">
                <label className="label" htmlFor="person-nationality">
                  الجنسية
                </label>
                <select
                  className="select"
                  id="person-nationality"
                  value={formData.nationalityId}
                  onChange={(e) => set("nationalityId", e.target.value)}
                >
                  <option value="">اختر الجنسية</option>
                  {(countries ?? []).map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="person-country">
                  الدولة (بلد الأصل)
                </label>
                <select
                  className="select"
                  id="person-country"
                  value={formData.countryId}
                  onChange={(e) => set("countryId", e.target.value)}
                >
                  <option value="">اختر الدولة</option>
                  {(countries ?? []).map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="person-residence-country">
                  دولة الإقامة
                </label>
                <select
                  className="select"
                  id="person-residence-country"
                  value={formData.residenceCountryId}
                  onChange={(e) => set("residenceCountryId", e.target.value)}
                >
                  <option value="">اختر دولة الإقامة</option>
                  {(countries ?? []).map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field full">
                <span className="hint">
                  المحافظة والمديرية غير متاحتين في هذه الشاشة بعد؛ تُحفظ القيم
                  المسجّلة سابقاً كما هي عند التحديث.
                </span>
              </div>
            </div>
          </section>
        </form>

        <aside className="side">
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">ملخّص السجل</h2>
            </div>
            <div className="card-body">
              <div className="summary-row">
                <span className="summary-key">الاسم الكامل</span>
                <span className={`summary-val${fullName ? "" : " empty"}`}>
                  {fullName ?? "غير مكتمل"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">الجنسية</span>
                <span
                  className={`summary-val${
                    formData.nationalityId ? "" : " empty"
                  }`}
                >
                  {countryName(formData.nationalityId)}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-key">الدولة</span>
                <span className={`summary-val${formData.countryId ? "" : " empty"}`}>
                  {countryName(formData.countryId)}
                </span>
              </div>
              {isEdit && person && (
                <div className="summary-row">
                  <span className="summary-key">تاريخ التسجيل</span>
                  <span className="summary-val">{formatDate(person.createdAt)}</span>
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
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <button
                type="submit"
                form="person-form"
                className="btn btn-primary btn-block"
                disabled={saving}
              >
                {isEdit ? <Save aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
                {saving
                  ? "جاري الحفظ…"
                  : isEdit
                    ? "حفظ التعديلات"
                    : "حفظ الموظف"}
              </button>
              <a
                className="btn btn-ghost btn-block"
                href={isEdit ? `/persons/${personId}` : "/persons"}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(isEdit ? `/persons/${personId}` : "/persons");
                }}
              >
                إلغاء
              </a>
              <p className="side-note">
                يُسجَّل كل تعديل في سجل التغييرات مع اسم المستخدم ووقت الحفظ.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
