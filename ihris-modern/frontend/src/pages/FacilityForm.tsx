import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";
import { Save, ArrowRight, AlertCircle } from "lucide-react";

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

  const { data: existing, isLoading: isLoadingFacility } = useQuery({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    if (
      !formData.name.trim() ||
      !formData.countryId ||
      !formData.districtId ||
      !formData.countyId ||
      !formData.regionId
    ) {
      const errors = ["الاسم والدولة والمنطقة والمحافظة والمديرية حقول مطلوبة (BR-097)"];
      setFormErrors(errors);
      toast.error(errors[0]);
      return;
    }

    if (isEdit && facilityId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  if (isEdit && isLoadingFacility) {
    return <div className="p-6">جاري تحميل بيانات المنشأة...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(isEdit ? `/facilities/${facilityId}` : "/facilities")}
          className="text-primary-600 hover:text-primary-800 flex items-center gap-2"
        >
          <ArrowRight size={18} /> العودة
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? "تعديل منشأة" : "إضافة منشأة جديدة"}
          </h1>
          <p className="text-gray-600">
            {isEdit ? "تعديل بيانات المنشأة المحددة" : "إدخال منشأة صحية جديدة في النظام"}
          </p>
        </div>
      </div>

      {formErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle size={18} /> تعذّر الحفظ
          </div>
          {formErrors.map((err, i) => (
            <div key={i}>• {err}</div>
          ))}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المنشأة *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
                maxLength={255}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع المنشأة
              </label>
              <select
                value={formData.facilityTypeId}
                onChange={(e) =>
                  setFormData({ ...formData, facilityTypeId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">اختر النوع</option>
                {facilityTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الدولة *
              </label>
              <select
                value={formData.countryId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    countryId: e.target.value,
                    districtId: "",
                    countyId: "",
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              >
                <option value="">اختر الدولة</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المنطقة *
              </label>
              <select
                value={formData.regionId}
                onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              >
                <option value="">اختر المنطقة</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المحافظة *
              </label>
              <select
                value={formData.districtId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    districtId: e.target.value,
                    countyId: "",
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-50"
                required
                disabled={!formData.countryId || loadingDistricts}
              >
                <option value="">
                  {!formData.countryId
                    ? "اختر الدولة أولاً"
                    : loadingDistricts
                    ? "جاري التحميل..."
                    : "اختر المحافظة"}
                </option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المديرية *
              </label>
              <select
                value={formData.countyId}
                onChange={(e) => setFormData({ ...formData, countyId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-50"
                required
                disabled={!formData.districtId || loadingCounties}
              >
                <option value="">
                  {!formData.districtId
                    ? "اختر المحافظة أولاً"
                    : loadingCounties
                    ? "جاري التحميل..."
                    : "اختر المديرية"}
                </option>
                {counties.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            * BR-097: المنشأة يجب أن يكون لها دولة ومحافظة ومديرية ومنطقة.
          </p>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2 transition"
            >
              <Save size={18} />
              {isEdit ? "تحديث البيانات" : "حفظ المنشأة"}
            </button>
            <button
              type="button"
              onClick={() => navigate(isEdit ? `/facilities/${facilityId}` : "/facilities")}
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
