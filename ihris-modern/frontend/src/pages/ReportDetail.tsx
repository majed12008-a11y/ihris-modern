import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Play, Edit, History } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Pill from "@/components/ui/Pill";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/StateViews";
import { formatDate, formatNumber } from "@/lib/format";

interface ReportDetail {
  id: number;
  name: string;
  description: string | null;
  type: string;
  definition: any;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUser: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
  };
  executions: Array<{
    id: number;
    status: string;
    startedAt: string;
    completedAt: string | null;
    rowCount: number;
    executedByUser: {
      id: number;
      firstname: string;
      lastname: string;
    };
  }>;
}

const TYPE_LABELS: Record<string, string> = {
  list: "قائمة",
  table: "جدول",
  pie: "رسم بياني دائري",
  bar: "رسم بياني شريطي",
  line: "رسم بياني خطي",
};

function typeLabel(type: string) {
  return TYPE_LABELS[type] ?? type;
}

function executionTone(status: string) {
  if (status === "completed") return "ok" as const;
  if (status === "failed") return "danger" as const;
  return "warn" as const;
}

function executionLabel(status: string) {
  if (status === "completed") return "مكتمل";
  if (status === "failed") return "فشل";
  return "جاري";
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportId = parseInt(id || "0", 10);

  const { data, isLoading, error, refetch } = useQuery<ReportDetail>({
    queryKey: ["report", reportId],
    queryFn: async () => {
      const res = await api.get(`/reports/${reportId}`);
      return res.data;
    },
    enabled: !!reportId,
  });

  if (isLoading) {
    return (
      <div className="stack">
        <PageHeader
          title="تفاصيل التقرير"
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

  if (error || !data) {
    return (
      <div className="stack">
        <PageHeader
          title="تفاصيل التقرير"
          backTo="/reports"
          backLabel="رجوع إلى التقارير"
        />
        <ErrorState
          title="لم يتم العثور على التقرير"
          message={
            error instanceof Error
              ? error.message
              : "قد يكون التقرير محذوفاً أو غير متاح لحسابك."
          }
          onRetry={() => refetch()}
        />
        <div>
          <a
            className="btn btn-ghost"
            href="/reports"
            onClick={(event) => {
              event.preventDefault();
              navigate("/reports");
            }}
          >
            العودة إلى التقارير
          </a>
        </div>
      </div>
    );
  }

  const executions = data.executions ?? [];
  const createdBy = `${data.createdByUser.firstname} ${data.createdByUser.lastname}`.trim();

  return (
    <div className="stack">
      <PageHeader
        title={data.name}
        subtitle={`رقم التقرير: #${data.id}`}
        backTo="/reports"
        backLabel="رجوع إلى التقارير"
        actions={
          <>
            <a
              className="btn btn-ghost"
              href={`/reports/${data.id}/edit`}
              onClick={(event) => {
                event.preventDefault();
                navigate(`/reports/${data.id}/edit`);
              }}
            >
              <Edit aria-hidden="true" />
              تعديل
            </a>
            <a
              className="btn btn-primary"
              href={`/reports/${data.id}/execute`}
              onClick={(event) => {
                event.preventDefault();
                navigate(`/reports/${data.id}/execute`);
              }}
            >
              <Play aria-hidden="true" />
              تشغيل التقرير
            </a>
          </>
        }
      />

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">معلومات التقرير</h2>
          <Pill tone={data.isEnabled ? "ok" : "mute"}>
            {data.isEnabled ? "مفعل" : "معطل"}
          </Pill>
        </div>
        <div className="card-body">
          <div className="desc-grid">
            <div className="desc-item">
              <span className="desc-label">اسم التقرير</span>
              <span className="desc-value">{data.name}</span>
            </div>
            <div className="desc-item">
              <span className="desc-label">نوع التقرير</span>
              <span className="desc-value">{typeLabel(data.type)}</span>
            </div>
            <div className="desc-item">
              <span className="desc-label">أنشأه</span>
              <span className="desc-value">{createdBy || "—"}</span>
            </div>
            <div className="desc-item">
              <span className="desc-label">تاريخ الإنشاء</span>
              <span className="desc-value">{formatDate(data.createdAt)}</span>
            </div>
            <div className="desc-item">
              <span className="desc-label">آخر تعديل</span>
              <span className="desc-value">{formatDate(data.updatedAt)}</span>
            </div>
            <div className="desc-item">
              <span className="desc-label">عمليات التنفيذ</span>
              <span className="desc-value num">
                {formatNumber(executions.length)}
              </span>
            </div>
            <div className="desc-item">
              <span className="desc-label">الوصف</span>
              <span
                className={`desc-value${data.description ? "" : " empty"}`}
              >
                {data.description || "لا يوجد وصف"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">تعريف التقرير</h2>
          <span className="card-sub">JSON</span>
        </div>
        <div className="card-body">
          {data.definition ? (
            <pre
              className="mono"
              dir="ltr"
              style={{
                margin: 0,
                padding: 14,
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r-md)",
                overflowX: "auto",
                lineHeight: 1.7,
                textAlign: "left",
                color: "var(--text-2)",
              }}
            >
              {JSON.stringify(data.definition, null, 2)}
            </pre>
          ) : (
            <p className="muted">لا يوجد تعريف محفوظ لهذا التقرير.</p>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">سجل العمليات الأخيرة</h2>
          <span className="card-sub">
            {formatNumber(executions.length)} عملية
          </span>
        </div>

        {executions.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table data-table--dense">
              <thead>
                <tr>
                  <th scope="col">تاريخ التنفيذ</th>
                  <th scope="col">الحالة</th>
                  <th scope="col">عدد السجلات</th>
                  <th scope="col" className="col-optional">
                    المستخدم
                  </th>
                  <th scope="col" className="col-compact">
                    الانتهاء
                  </th>
                </tr>
              </thead>
              <tbody>
                {executions.map((execution) => (
                  <tr key={execution.id}>
                    <td className="mono">{formatDate(execution.startedAt)}</td>
                    <td>
                      <Pill tone={executionTone(execution.status)}>
                        {executionLabel(execution.status)}
                      </Pill>
                    </td>
                    <td className="num">{formatNumber(execution.rowCount)}</td>
                    <td className="col-optional">
                      {execution.executedByUser.firstname}{" "}
                      {execution.executedByUser.lastname}
                    </td>
                    <td className="mono col-compact">
                      {execution.completedAt
                        ? formatDate(execution.completedAt)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={History}
            title="لا توجد عمليات تنفيذ لهذا التقرير بعد"
            text="شغّل التقرير لعرض نتائجه هنا وفي سجل العمليات."
            action={
              <a
                className="btn btn-primary btn-sm"
                href={`/reports/${data.id}/execute`}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(`/reports/${data.id}/execute`);
                }}
              >
                <Play aria-hidden="true" />
                تشغيل التقرير
              </a>
            }
          />
        )}
      </section>
    </div>
  );
}
