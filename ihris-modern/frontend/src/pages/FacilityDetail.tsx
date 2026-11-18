import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Briefcase, Pencil, SearchX } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Pill from "@/components/ui/Pill";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateViews";

interface FacilityDetailData {
  id: number;
  name: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  facilityType: { id: number; name: string } | null;
  country: { id: number; name: string } | null;
  region: { id: number; name: string } | null;
  district: { id: number; name: string } | null;
  county: { id: number; name: string } | null;
  positionsCount: number;
  positions: Array<{
    id: number;
    code: string | null;
    title: string | null;
    job: { id: number; title: string } | null;
    department: { id: number; name: string } | null;
    posType: { id: number; name: string } | null;
    status: { id: number; name: string } | null;
    postedDate: string | null;
  }>;
}

/** خلية وصف: تسمية + قيمة، مع حالة فراغ موحّدة. */
function DescItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  const text = (value ?? "").trim();
  return (
    <div className="desc-item">
      <span className="desc-label">{label}</span>
      <span className={`desc-value${text ? "" : " empty"}`}>{text || "—"}</span>
    </div>
  );
}

export default function FacilityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const facilityId = id ? parseInt(id, 10) : null;
  const currentUser = useAuthStore((state) => state.user);
  const canWrite = currentUser?.role === "admin" || currentUser?.role === "hr_manager";

  const { data, isLoading, error, refetch } = useQuery<FacilityDetailData>({
    queryKey: ["facility", facilityId],
    queryFn: async () => {
      const res = await api.get(`/facilities/${facilityId}`);
      return res.data;
    },
    enabled: !!facilityId,
  });

  if (isLoading) {
    return (
      <div className="stack">
        <PageHeader
          title="بيانات المنشأة"
          subtitle="تفاصيل المنشأة والوظائف المرتبطة بها"
          backTo="/facilities"
          backLabel="رجوع إلى المنشآت"
        />
        <section className="card">
          <LoadingState label="جاري تحميل بيانات المنشأة…" />
        </section>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="stack">
        <PageHeader
          title="بيانات المنشأة"
          subtitle="تفاصيل المنشأة والوظائف المرتبطة بها"
          backTo="/facilities"
          backLabel="رجوع إلى المنشآت"
        />
        <ErrorState
          title="تعذّر تحميل المنشأة"
          message={error instanceof Error ? error.message : "المنشأة غير موجودة"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const location = [
    data.country?.name,
    data.region?.name,
    data.district?.name,
    data.county?.name,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="stack">
      <PageHeader
        title={data.name}
        subtitle={`تفاصيل المنشأة والوظائف المرتبطة بها — رقم المنشأة: ${formatNumber(
          data.id
        )}`}
        backTo="/facilities"
        backLabel="رجوع إلى المنشآت"
        actions={
          canWrite ? (
            <a
              className="btn btn-primary"
              href={`/facilities/${data.id}/edit`}
              onClick={(event) => {
                event.preventDefault();
                navigate(`/facilities/${data.id}/edit`);
              }}
            >
              <Pencil aria-hidden="true" />
              تعديل المنشأة
            </a>
          ) : null
        }
      />

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">البيانات الأساسية</h2>
          <span className="card-sub">رقم المنشأة: {formatNumber(data.id)}</span>
        </div>
        <div className="card-body">
          <div className="desc-grid">
            <DescItem label="اسم المنشأة" value={data.name} />
            <DescItem label="نوع المنشأة" value={data.facilityType?.name} />
            <DescItem label="الموقع الجغرافي" value={location} />
            <DescItem label="الدولة" value={data.country?.name} />
            <DescItem label="المنطقة" value={data.region?.name} />
            <DescItem label="المحافظة" value={data.district?.name} />
            <DescItem label="المديرية" value={data.county?.name} />
            <DescItem label="تاريخ الإنشاء" value={formatDate(data.createdAt)} />
            <DescItem label="آخر تحديث" value={formatDate(data.updatedAt)} />
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">الوظائف المرتبطة</h2>
          <span className="card-sub">
            عدد الوظائف: {formatNumber(data.positionsCount)}
          </span>
          <Pill tone={data.positionsCount > 0 ? "warn" : "mute"}>
            {data.positionsCount > 0 ? "مرتبطة بوظائف" : "بلا وظائف"}
          </Pill>
        </div>

        <div className="card-body" style={{ paddingBottom: 12 }}>
          <p className="hint">
            {data.positionsCount > 0
              ? "لا يمكن حذف المنشأة قبل نقل هذه الوظائف أو حذفها."
              : "لا توجد وظائف مرتبطة — يمكن حذف المنشأة."}
          </p>
        </div>

        {data.positions.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table data-table--dense">
              <thead>
                <tr>
                  <th scope="col">الكود</th>
                  <th scope="col">المسمى</th>
                  <th scope="col" className="col-optional">
                    الوظيفة
                  </th>
                  <th scope="col" className="col-optional">
                    القسم
                  </th>
                  <th scope="col" className="col-compact">
                    النوع
                  </th>
                  <th scope="col" className="col-compact">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.positions.map((position) => (
                  <tr key={position.id}>
                    <td className="mono">{position.code || "—"}</td>
                    <td>{position.title || "—"}</td>
                    <td className="col-optional">{position.job?.title || "—"}</td>
                    <td className="col-optional">{position.department?.name || "—"}</td>
                    <td className="col-compact">{position.posType?.name || "—"}</td>
                    <td className="col-compact">
                      {position.status?.name ? (
                        <Pill tone="mute">{position.status.name}</Pill>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={data.positionsCount > 0 ? SearchX : Briefcase}
            title="لا توجد وظائف مرتبطة"
            text="لا توجد وظائف مرتبطة بهذه المنشأة. أضف وظيفة من شاشة الوظائف لتظهر هنا."
          />
        )}
      </section>
    </div>
  );
}
