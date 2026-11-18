import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { extractErrorMessages } from "@/lib/errorDetails";
import { toast } from "sonner";
import {
  BookOpen,
  GraduationCap,
  Building2,
  Users,
  Plus,
  Pencil,
  Trash2,
  CalendarPlus,
  ClipboardList,
  SearchX,
  AlertTriangle,
  X,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Pill from "@/components/ui/Pill";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/StateViews";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";
import { formatDate, formatNumber } from "@/lib/format";

interface EnrolledPerson {
  id: number;
  person: { id: number; surname: string; firstname: string };
}

interface ScheduledCourse {
  id: number;
  trainingCourseId: number;
  site: string | null;
  numStudents: number | null;
  instructors: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  version: number;
  personScheduled: EnrolledPerson[];
}

interface TrainingCourse {
  id: number;
  name: string;
  topic: string | null;
  notes: string | null;
  version: number;
  trainingInstitution: { id: number; name: string } | null;
  trainingCourseStatus: { id: number; name: string } | null;
  trainingCourseCategory: { id: number; name: string } | null;
  scheduledCourses: ScheduledCourse[];
}

interface Institution {
  id: number;
  name: string;
}

type Tone = "ok" | "warn" | "danger" | "mute";

const PAGE_SIZES = [10, 25, 50];

const STATUS_LABELS: Record<string, string> = {
  planning: "قيد التخطيط",
  scheduled: "مجدولة",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

const SCHEDULED_TONES: Record<string, Tone> = {
  planning: "warn",
  scheduled: "ok",
  completed: "ok",
  cancelled: "danger",
};

/** لون حبة حالة الدورة بحسب اسمها المرجعي (عربي أو إنجليزي). */
function courseStatusTone(name: string | null | undefined): Tone {
  if (!name) return "mute";
  if (/مكتمل|منته|completed|done/i.test(name)) return "ok";
  if (/ملغ|إلغاء|الغاء|cancel/i.test(name)) return "danger";
  if (/قيد|جار|مخطط|planning|progress|schedul/i.test(name)) return "warn";
  return "mute";
}

function errorToText(error: unknown): string {
  return extractErrorMessages(error).join(" — ");
}

export default function Training() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const canWrite =
    user?.role === "admin" || user?.role === "hr_manager" || user?.role === "training_manager";

  const { q, page, limit, setQ, setPage, setLimit } = useListParams({
    defaultLimit: PAGE_SIZES[0],
  });
  const [searchInput, setSearchInput] = useState(q);
  const debouncedInput = useDebouncedValue(searchInput, 300);

  const [deleteTarget, setDeleteTarget] = useState<TrainingCourse | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<string[]>([]);

  useEffect(() => {
    const next = debouncedInput.trim();
    if (next !== q) setQ(next);
  }, [debouncedInput, q, setQ]);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    setDeleteTarget(null);
    setDeleteErrors([]);
  }, [q, page, limit]);

  const coursesQuery = useQuery<TrainingCourse[]>({
    queryKey: ["training-courses"],
    queryFn: async () => (await api.get("/training/courses")).data,
  });
  const institutionsQuery = useQuery<Institution[]>({
    queryKey: ["training-institutions"],
    queryFn: async () => (await api.get("/training/institutions")).data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (course: TrainingCourse) =>
      (await api.delete(`/training/courses/${course.id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-courses"] });
      toast.success("تم حذف الدورة التدريبية");
      setDeleteTarget(null);
      setDeleteErrors([]);
    },
    onError: (error) => {
      setDeleteErrors(extractErrorMessages(error));
    },
  });

  const isLoading = coursesQuery.isLoading || institutionsQuery.isLoading;
  const error = coursesQuery.error || institutionsQuery.error;

  const courses = coursesQuery.data ?? [];
  const institutions = institutionsQuery.data ?? [];

  const scheduled = useMemo(
    () =>
      courses.flatMap((course) =>
        course.scheduledCourses.map((item) => ({ ...item, courseName: course.name }))
      ),
    [courses]
  );

  const totalEnrolled = useMemo(
    () => scheduled.reduce((sum, item) => sum + item.personScheduled.length, 0),
    [scheduled]
  );

  const filteredCourses = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return courses;
    return courses.filter((course) =>
      [
        course.name,
        course.topic,
        course.trainingInstitution?.name,
        course.trainingCourseCategory?.name,
        course.trainingCourseStatus?.name,
      ].some((value) => (value ?? "").toLowerCase().includes(term))
    );
  }, [courses, q]);

  const total = filteredCourses.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const rows = filteredCourses.slice((currentPage - 1) * limit, currentPage * limit);
  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, setPage]);

  const clearSearch = () => {
    setSearchInput("");
    setQ("");
  };

  const kpis = [
    { label: "الدورات التدريبية", value: courses.length, icon: GraduationCap },
    { label: "المؤسسات التدريبية", value: institutions.length, icon: Building2 },
    { label: "الدورات المجدولة", value: scheduled.length, icon: BookOpen },
    { label: "المتدربون المسجلون", value: totalEnrolled, icon: Users },
  ];

  return (
    <div className="stack">
      <PageHeader
        title="إدارة التدريب"
        subtitle="الدورات التدريبية، المؤسسات، الدورات المجدولة والمتسجلون"
        actions={
          <>
            <a
              className="btn btn-ghost"
              href="/training/institutions"
              onClick={(event) => {
                event.preventDefault();
                navigate("/training/institutions");
              }}
            >
              <Building2 aria-hidden="true" />
              المؤسسات التدريبية
            </a>
            {canWrite && (
              <a
                className="btn btn-primary"
                href="/training/new"
                onClick={(event) => {
                  event.preventDefault();
                  navigate("/training/new");
                }}
              >
                <Plus aria-hidden="true" />
                دورة جديدة
              </a>
            )}
          </>
        }
      />

      {error && (
        <ErrorState
          title="حدث خطأ في تحميل البيانات"
          message={errorToText(error)}
          onRetry={() => {
            coursesQuery.refetch();
            institutionsQuery.refetch();
          }}
        />
      )}

      <section className="kpi-strip" aria-label="مؤشرات التدريب">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div className="kpi" key={kpi.label}>
              <span className="kpi-top">
                <span className="kpi-icon">
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
            </div>
          );
        })}
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">الدورات التدريبية</h2>
          <span className="card-sub">{formatNumber(total)} دورة</span>
        </div>

        <div className="toolbar">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="ابحث باسم الدورة أو الموضوع أو المؤسسة…"
            label="بحث في الدورات التدريبية"
          />

          <select
            className="select"
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            aria-label="عدد الدورات في الصفحة"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} في الصفحة
              </option>
            ))}
          </select>

          {(q || searchInput) && (
            <button type="button" className="clear-link" onClick={clearSearch}>
              مسح البحث
            </button>
          )}

          {q && (
            <div className="chips">
              <span className="chip">
                البحث: {q}
                <button type="button" aria-label="إزالة فلتر البحث" onClick={clearSearch}>
                  <X aria-hidden="true" />
                </button>
              </span>
            </div>
          )}
        </div>

        <div className="table-wrap">
          <table className="data-table data-table--dense">
            <thead>
              <tr>
                <th scope="col">اسم الدورة</th>
                <th scope="col" className="col-optional">
                  الموضوع
                </th>
                <th scope="col" className="col-optional">
                  المؤسسة
                </th>
                <th scope="col" className="col-optional">
                  التصنيف
                </th>
                <th scope="col" className="col-compact">
                  الإصدار
                </th>
                <th scope="col">
                  <span className="sr-only">إجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <TableSkeleton rows={6} cols={6} widths={[180, 120, 120, 90, 40, 0]} />
              )}

              {!isLoading &&
                rows.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <span className="person-meta">
                        <span className="person-name">{course.name}</span>
                        <span className="person-sub">
                          {course.trainingCourseStatus ? (
                            <Pill tone={courseStatusTone(course.trainingCourseStatus.name)}>
                              {course.trainingCourseStatus.name}
                            </Pill>
                          ) : (
                            <Pill tone="mute">بدون حالة</Pill>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="col-optional">
                      <span
                        style={{
                          display: "block",
                          maxWidth: 260,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={course.topic ?? undefined}
                      >
                        {course.topic || "—"}
                      </span>
                    </td>
                    <td className="col-optional">{course.trainingInstitution?.name || "—"}</td>
                    <td className="col-optional">
                      {course.trainingCourseCategory?.name || "—"}
                    </td>
                    <td className="mono col-compact">v{course.version}</td>
                    <td className="col-actions">
                      {canWrite && (
                        <div className="row-actions">
                          <a
                            className="icon-btn icon-btn--sm"
                            href={`/training/courses/${course.id}/edit`}
                            aria-label={`تعديل ${course.name}`}
                            title="تعديل"
                            onClick={(event) => {
                              event.preventDefault();
                              navigate(`/training/courses/${course.id}/edit`);
                            }}
                          >
                            <Pencil aria-hidden="true" />
                          </a>
                          <a
                            className="icon-btn icon-btn--sm"
                            href={`/training/courses/${course.id}/schedule/new`}
                            aria-label={`جدولة ${course.name}`}
                            title="جدولة دورة"
                            onClick={(event) => {
                              event.preventDefault();
                              navigate(`/training/courses/${course.id}/schedule/new`);
                            }}
                          >
                            <CalendarPlus aria-hidden="true" />
                          </a>
                          <button
                            type="button"
                            className="icon-btn icon-btn--sm danger"
                            aria-label={`حذف ${course.name}`}
                            title="حذف"
                            onClick={() => {
                              setDeleteTarget(course);
                              setDeleteErrors([]);
                            }}
                          >
                            <Trash2 aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!isLoading && rows.length === 0 && (
          <EmptyState
            icon={q ? SearchX : GraduationCap}
            title={q ? "لا نتائج مطابقة" : "لا توجد دورات تدريبية"}
            text={
              q
                ? `لم نجد دورة تطابق «${q}». جرّب جزءاً من الاسم أو امسح البحث.`
                : "أضف أول دورة تدريبية لتظهر في القائمة وتُتاح جدولتها."
            }
            action={
              q ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={clearSearch}>
                  مسح البحث
                </button>
              ) : canWrite ? (
                <a
                  className="btn btn-primary btn-sm"
                  href="/training/new"
                  onClick={(event) => {
                    event.preventDefault();
                    navigate("/training/new");
                  }}
                >
                  <Plus aria-hidden="true" />
                  دورة جديدة
                </a>
              ) : undefined
            }
          />
        )}

        {!isLoading && rows.length > 0 && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            total={total}
            from={from}
            to={to}
            onPage={setPage}
            isFetching={coursesQuery.isFetching}
          />
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">الدورات المجدولة</h2>
          <span className="card-sub">{formatNumber(scheduled.length)} جلسة</span>
        </div>

        <div className="table-wrap">
          <table className="data-table data-table--dense">
            <thead>
              <tr>
                <th scope="col">الدورة</th>
                <th scope="col" className="col-optional">
                  الموقع
                </th>
                <th scope="col" className="col-optional">
                  الفترة
                </th>
                <th scope="col">الحالة</th>
                <th scope="col" className="col-compact">
                  المتدربون
                </th>
                <th scope="col">
                  <span className="sr-only">إجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <TableSkeleton rows={5} cols={6} widths={[180, 100, 150, 80, 60, 0]} />
              )}

              {!isLoading &&
                scheduled.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontWeight: 500, color: "var(--text)" }}>
                        {item.courseName}
                      </span>
                    </td>
                    <td className="col-optional">{item.site || "—"}</td>
                    <td className="mono col-optional">
                      {item.startDate || item.endDate
                        ? `${formatDate(item.startDate)} — ${formatDate(item.endDate)}`
                        : "—"}
                    </td>
                    <td>
                      <Pill tone={SCHEDULED_TONES[item.status] ?? "mute"}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </Pill>
                    </td>
                    <td className="mono col-compact">
                      {formatNumber(item.personScheduled.length)}
                      {item.numStudents ? ` / ${formatNumber(item.numStudents)}` : ""}
                    </td>
                    <td className="col-actions">
                      <div className="row-actions">
                        <a
                          className="icon-btn icon-btn--sm"
                          href={`/training/scheduled/${item.id}/enrollments`}
                          aria-label={`متدربو ${item.courseName}`}
                          title="المتدربون"
                          onClick={(event) => {
                            event.preventDefault();
                            navigate(`/training/scheduled/${item.id}/enrollments`);
                          }}
                        >
                          <ClipboardList aria-hidden="true" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!isLoading && scheduled.length === 0 && (
          <EmptyState
            icon={BookOpen}
            title="لا توجد دورات مجدولة بعد"
            text="جدول دورة من قائمة الدورات أعلاه لتظهر جلساتها هنا مع متدربيها."
          />
        )}
      </section>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="تأكيد الحذف"
        text={
          <>
            سيُحذف <strong>{deleteTarget?.name}</strong> حذفاً ناعماً. لا يمكن الحذف إذا كانت له
            دورة مجدولة.
            {deleteErrors.length > 0 && (
              <span className="alert alert-danger" role="alert" style={{ marginTop: 10 }}>
                <AlertTriangle aria-hidden="true" />
                <span>
                  {deleteErrors.map((message, index) => (
                    <span key={index} style={{ display: "block" }}>
                      {message}
                    </span>
                  ))}
                </span>
              </span>
            )}
          </>
        }
        confirmLabel="تأكيد الحذف"
        pending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteErrors([]);
        }}
      />
    </div>
  );
}
