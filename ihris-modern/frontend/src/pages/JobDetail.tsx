import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Briefcase, SearchX } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Pill from "@/components/ui/Pill";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateViews";

/** GAP-M-004 — صفحة تفاصيل المسمى الوظيفي مع المناصب المرتبطة. */

interface JobDetailData {
  id: number;
  title: string;
  code: string | null;
  description: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  salaryGrade: { id: number; name: string } | null;
  cadre: { id: number; name: string } | null;
  classification: { id: number; name: string } | null;
  positionsCount: number;
  positions: Array<{
    id: number;
    code: string | null;
    title: string | null;
    source: string | null;
    posType: { id: number; name: string } | null;
    status: { id: number; name: string } | null;
    facility: { id: number; name: string } | null;
    department: { id: number; name: string } | null;
    proposedHiringDate: string | null;
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

export default function JobDetail() {
  const { id } = useParams();
  const jobId = id ? parseInt(id, 10) : null;

  const { data, isLoading, error, refetch } = useQuery<JobDetailData>({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const res = await api.get(`/jobs/${jobId}`);
      return res.data;
    },
    enabled: !!jobId,
  });

  if (isLoading) {
    return (
      <div className="stack">
        <PageHeader
          title="المسمى الوظيفي"
          subtitle="تفاصيل المسمى الوظيفي والمناصب المرتبطة به"
          backTo="/jobs"
          backLabel="رجوع إلى المسميات"
        />
        <section className="card">
          <LoadingState label="جارٍ تحميل تفاصيل المسمى الوظيفي…" />
        </section>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="stack">
        <PageHeader
          title="المسمى الوظيفي"
          subtitle="تفاصيل المسمى الوظيفي والمناصب المرتبطة به"
          backTo="/jobs"
          backLabel="رجوع إلى المسميات"
        />
        <ErrorState
          title="تعذّر تحميل المسمى الوظيفي"
          message={error instanceof Error ? error.message : "المسمى غير موجود"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        title={data.title}
        subtitle={`تفاصيل المسمى الوظيفي والمناصب المرتبطة به — رقم المسمى: ${formatNumber(
          data.id
        )}`}
        backTo="/jobs"
        backLabel="رجوع إلى المسميات"
      />

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">البيانات الأساسية</h2>
          <span className="card-sub">رقم المسمى: {formatNumber(data.id)}</span>
          <Pill tone="mute">الإصدار v{data.version}</Pill>
        </div>
        <div className="card-body">
          <div className="desc-grid">
            <DescItem label="المسمى الوظيفي" value={data.title} />
            <DescItem label="الكود" value={data.code} />
            <DescItem label="درجة الراتب" value={data.salaryGrade?.name} />
            <DescItem label="الفئة الوظيفية" value={data.cadre?.name} />
            <DescItem label="التصنيف الوظيفي" value={data.classification?.name} />
            <DescItem label="تاريخ الإنشاء" value={formatDate(data.createdAt)} />
            <DescItem label="آخر تحديث" value={formatDate(data.updatedAt)} />
            {data.description && (
              <div className="desc-item" style={{ gridColumn: "1 / -1" }}>
                <span className="desc-label">الوصف</span>
                <span
                  className="desc-value"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {data.description}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">المناصب المرتبطة</h2>
          <span className="card-sub">
            عدد المناصب: {formatNumber(data.positionsCount)}
          </span>
          <Pill tone={data.positionsCount > 0 ? "warn" : "mute"}>
            {data.positionsCount > 0 ? "مرتبط بمناصب" : "بلا مناصب"}
          </Pill>
        </div>

        {data.positions.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table data-table--dense">
              <thead>
                <tr>
                  <th scope="col">المنصب</th>
                  <th scope="col" className="col-compact">
                    الكود
                  </th>
                  <th scope="col" className="col-compact">
                    النوع
                  </th>
                  <th scope="col" className="col-compact">
                    الحالة
                  </th>
                  <th scope="col" className="col-optional">
                    المنشأة
                  </th>
                  <th scope="col" className="col-optional">
                    القسم
                  </th>
                  <th scope="col" className="col-optional">
                    المصدر
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.positions.map((position) => (
                  <tr key={position.id}>
                    <td>{position.title || `منصب #${formatNumber(position.id)}`}</td>
                    <td className="mono col-compact">{position.code || "—"}</td>
                    <td className="col-compact">{position.posType?.name || "—"}</td>
                    <td className="col-compact">
                      {position.status?.name ? (
                        <Pill tone="mute">{position.status.name}</Pill>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="col-optional">{position.facility?.name || "—"}</td>
                    <td className="col-optional">{position.department?.name || "—"}</td>
                    <td className="col-optional">{position.source || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={data.positionsCount > 0 ? SearchX : Briefcase}
            title="لا توجد مناصب مرتبطة"
            text="لا توجد مناصب مرتبطة بهذا المسمى بعد."
          />
        )}
      </section>
    </div>
  );
}
