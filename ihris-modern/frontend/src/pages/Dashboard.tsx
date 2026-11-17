import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  Briefcase,
  CreditCard,
  BookOpen,
  Shield,
  Plus,
  RefreshCw,
  ChevronLeft,
  UserPlus,
  AlertCircle,
  Inbox,
} from "lucide-react";
import api from "@/services/api";
import type { Person } from "@/types";
import { avatarTone, formatDate, formatLongDate, formatNumber, initials } from "@/lib/format";

interface FacilityRow {
  id: number;
  name: string;
}

interface PositionRow {
  id: number;
  facilityId: number | null;
}

interface FacilityBar {
  id: number;
  name: string;
  count: number;
}

interface DashboardData {
  totals: {
    persons: number;
    positions: number;
    facilities: number;
    salaries: number;
    courses: number;
    users: number;
  };
  recent: Person[];
  byFacility: FacilityBar[];
  positionsSampled: number;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const { data, isLoading, isFetching, error, refetch } = useQuery<DashboardData>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [personsRes, positionsRes, facilitiesRes, salariesRes, trainingRes, usersRes] =
        await Promise.all([
          api.get("/persons?limit=6"),
          api.get("/positions?limit=100"),
          api.get("/facilities?limit=100"),
          api.get("/salaries?limit=1"),
          api.get("/training/courses"),
          api.get("/users?limit=1"),
        ]);

      const positions: PositionRow[] = positionsRes.data.data ?? [];
      const facilities: FacilityRow[] = facilitiesRes.data.data ?? [];
      const totalPositions: number = positionsRes.data.total ?? positions.length;

      const nameById = new Map<number, string>(
        facilities.map((facility) => [facility.id, facility.name])
      );

      const counts = new Map<number, number>();
      positions.forEach((position) => {
        if (!position.facilityId) return;
        counts.set(position.facilityId, (counts.get(position.facilityId) ?? 0) + 1);
      });

      const byFacility: FacilityBar[] = [...counts.entries()]
        .map(([id, count]) => ({
          id,
          name: nameById.get(id) ?? `منشأة #${id}`,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const recent: Person[] = [...(personsRes.data.data ?? [])]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 6);

      return {
        totals: {
          persons: personsRes.data.total ?? 0,
          positions: totalPositions,
          facilities: facilitiesRes.data.total ?? 0,
          salaries: salariesRes.data.total ?? 0,
          courses: Array.isArray(trainingRes.data) ? trainingRes.data.length : 0,
          users: usersRes.data.total ?? 0,
        },
        recent,
        byFacility,
        positionsSampled: positions.length,
      };
    },
  });

  const totals = data?.totals;
  const maxBar = Math.max(1, ...(data?.byFacility ?? []).map((bar) => bar.count));

  const kpis = [
    {
      label: "الموظفون",
      value: totals?.persons ?? 0,
      icon: Users,
      note: "سجل موظف",
      tone: "",
      href: "/persons",
    },
    {
      label: "الوظائف",
      value: totals?.positions ?? 0,
      icon: Briefcase,
      note: "وظيفة مسجّلة",
      tone: "brass",
      href: "/positions",
    },
    {
      label: "المنشآت الصحية",
      value: totals?.facilities ?? 0,
      icon: Building2,
      note: "منشأة",
      tone: "",
      href: "/facilities",
    },
    {
      label: "سجلات الرواتب",
      value: totals?.salaries ?? 0,
      icon: CreditCard,
      note: "سجل مالي",
      tone: "brass",
      href: "/salaries",
    },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">لوحة التحكم</h1>
          <p className="page-sub">{formatLongDate()}</p>
        </div>
        <div className="head-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw aria-hidden="true" />
            تحديث
          </button>
          <a
            className="btn btn-primary"
            href="/persons/new"
            onClick={(event) => {
              event.preventDefault();
              navigate("/persons/new");
            }}
          >
            <Plus aria-hidden="true" />
            إضافة موظف
          </a>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert" style={{ marginBottom: 18 }}>
          <AlertCircle aria-hidden="true" />
          <div>
            <strong>تعذّر تحميل الإحصائيات.</strong>{" "}
            {error instanceof Error ? error.message : String(error)}
            <div style={{ marginTop: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => refetch()}>
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="kpi-strip" aria-label="المؤشرات الرئيسية">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <a
              key={kpi.label}
              className="kpi"
              href={kpi.href}
              onClick={(event) => {
                event.preventDefault();
                navigate(kpi.href);
              }}
            >
              <span className="kpi-top">
                <span className={`kpi-icon${kpi.tone ? " brass" : ""}`}>
                  <Icon aria-hidden="true" />
                </span>
                <span className="kpi-label">{kpi.label}</span>
              </span>
              <span className="kpi-row">
                {isLoading ? (
                  <span className="skeleton" style={{ width: 64, height: 30 }} />
                ) : (
                  <span className="kpi-value">{formatNumber(kpi.value)}</span>
                )}
              </span>
              <span className="kpi-foot">
                <span className="kpi-note">{kpi.note}</span>
              </span>
            </a>
          );
        })}
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">أحدث الموظفين</h2>
            <a
              className="card-link"
              href="/persons"
              onClick={(event) => {
                event.preventDefault();
                navigate("/persons");
              }}
            >
              كل الموظفين
              <ChevronLeft aria-hidden="true" />
            </a>
          </div>

          {isLoading ? (
            <div className="card-body" style={{ display: "grid", gap: 14 }}>
              {[0, 1, 2, 3, 4].map((row) => (
                <div key={row} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className="skeleton" style={{ width: 30, height: 30, borderRadius: "50%" }} />
                  <span className="skeleton" style={{ width: "45%" }} />
                  <span className="skeleton" style={{ width: 70, marginInlineStart: "auto" }} />
                </div>
              ))}
            </div>
          ) : data && data.recent.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table data-table--dense">
                <thead>
                  <tr>
                    <th scope="col">الموظف</th>
                    <th scope="col">تاريخ التسجيل</th>
                    <th scope="col" className="col-actions">
                      <span className="sr-only">إجراء</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((person) => (
                    <tr key={person.id}>
                      <td>
                        <div className="cell-person">
                          <span className={`avatar sm ${avatarTone(person.id)}`} aria-hidden="true">
                            {initials(person.firstname, person.surname)}
                          </span>
                          <span className="person-meta">
                            <span className="person-name">
                              {person.firstname} {person.surname}
                            </span>
                            <span className="person-sub">
                              {person.othername || `سجل رقم ${person.id}`}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="mono">{formatDate(person.createdAt)}</td>
                      <td className="col-actions">
                        <a
                          className="icon-btn icon-btn--sm"
                          href={`/persons/${person.id}`}
                          aria-label={`فتح ملف ${person.firstname} ${person.surname}`}
                          onClick={(event) => {
                            event.preventDefault();
                            navigate(`/persons/${person.id}`);
                          }}
                        >
                          <ChevronLeft aria-hidden="true" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="state">
              <span className="state-icon" aria-hidden="true">
                <Inbox />
              </span>
              <span className="state-title">لا يوجد موظفون بعد</span>
              <span className="state-text">
                سجّل أول موظف ليظهر هنا وفي التقارير التشغيلية.
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate("/persons/new")}
              >
                <UserPlus aria-hidden="true" />
                إضافة موظف
              </button>
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="card-title">الوظائف حسب المنشأة</h2>
            {data && data.positionsSampled < data.totals.positions && (
              <span className="card-sub">أحدث {formatNumber(data.positionsSampled)}</span>
            )}
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="bars">
                {[0, 1, 2, 3].map((row) => (
                  <div key={row} style={{ display: "grid", gap: 7 }}>
                    <span className="skeleton" style={{ width: "60%" }} />
                    <span className="skeleton" style={{ height: 7, borderRadius: 20 }} />
                  </div>
                ))}
              </div>
            ) : data && data.byFacility.length > 0 ? (
              <div className="bars">
                {data.byFacility.map((bar, index) => (
                  <div className="bar-row" key={bar.id}>
                    <div className="bar-top">
                      <span className="bar-name">{bar.name}</span>
                      <span className="bar-val">{formatNumber(bar.count)}</span>
                    </div>
                    <div className="track">
                      <div
                        className={`fill${index === 0 ? " brass" : ""}`}
                        style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="state" style={{ padding: "24px 0" }}>
                <span className="state-title">لا توجد وظائف مرتبطة بمنشآت</span>
                <span className="state-text">
                  اربط الوظائف بمنشأة ليظهر التوزيع هنا.
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">إجراءات سريعة</h2>
          </div>
          <div className="card-body">
            <div className="quick-actions">
              <a
                className="btn btn-ghost"
                href="/persons/new"
                onClick={(event) => {
                  event.preventDefault();
                  navigate("/persons/new");
                }}
              >
                <UserPlus aria-hidden="true" />
                إضافة موظف
              </a>
              <a
                className="btn btn-ghost"
                href="/positions/new"
                onClick={(event) => {
                  event.preventDefault();
                  navigate("/positions/new");
                }}
              >
                <Briefcase aria-hidden="true" />
                إضافة وظيفة
              </a>
              <a
                className="btn btn-ghost"
                href="/salaries/new"
                onClick={(event) => {
                  event.preventDefault();
                  navigate("/salaries/new");
                }}
              >
                <CreditCard aria-hidden="true" />
                إضافة سجل راتب
              </a>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="card-title">سجلات أخرى</h2>
          </div>
          <div className="card-body" style={{ paddingTop: 6, paddingBottom: 6 }}>
            <a
              className="summary-row"
              href="/training"
              onClick={(event) => {
                event.preventDefault();
                navigate("/training");
              }}
            >
              <span className="summary-key inline-flex items-center gap-2">
                <BookOpen size={14} aria-hidden="true" />
                الدورات التدريبية
              </span>
              <span className="summary-val">
                {isLoading ? "…" : formatNumber(totals?.courses ?? 0)}
              </span>
            </a>
            <a
              className="summary-row"
              href="/users"
              onClick={(event) => {
                event.preventDefault();
                navigate("/users");
              }}
            >
              <span className="summary-key inline-flex items-center gap-2">
                <Shield size={14} aria-hidden="true" />
                مستخدمو النظام
              </span>
              <span className="summary-val">
                {isLoading ? "…" : formatNumber(totals?.users ?? 0)}
              </span>
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
