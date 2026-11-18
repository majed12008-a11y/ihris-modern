import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { extractErrorMessages } from "@/lib/errorDetails";
import { toast } from "sonner";
import {
  UserPlus,
  Trash2,
  CheckCircle2,
  Circle,
  Users,
  Search,
  X,
  Pencil,
  SearchX,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Pill from "@/components/ui/Pill";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, LoadingState, TableSkeleton } from "@/components/ui/StateViews";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";
import { avatarTone, formatDate, formatNumber, initials } from "@/lib/format";

/**
 * Sprint 6 / GAP-H-002 — إدارة المتدربين في دورة مجدولة.
 * التسجيل/الإتمام/الحذف للكتابة فقط (admin, hr_manager, training_manager).
 */

interface Enrollment {
  id: number;
  personId: number;
  completed: boolean;
  isRetraining: boolean;
  requestDate: string | null;
  notes: string | null;
  person: { id: number; surname: string; firstname: string; othername: string | null };
}

interface ScheduledDetail {
  id: number;
  site: string | null;
  numStudents: number | null;
  instructors: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  version: number;
  trainingCourse: { id: number; name: string } | null;
  personScheduled: Enrollment[];
}

interface PersonRow {
  id: number;
  surname: string;
  firstname: string;
  othername: string | null;
}

interface PersonListResponse {
  data: PersonRow[];
  total: number;
}

const PAGE_SIZES = [10, 25, 50];

const STATUS_LABELS: Record<string, string> = {
  planning: "قيد التخطيط",
  scheduled: "مجدولة",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

const STATUS_TONES: Record<string, "ok" | "warn" | "danger" | "mute"> = {
  planning: "warn",
  scheduled: "ok",
  completed: "ok",
  cancelled: "danger",
};

function fullName(person: { surname: string; firstname: string; othername?: string | null }) {
  return [person.firstname, person.othername, person.surname].filter(Boolean).join(" ");
}

export default function EnrolledStudents() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canWrite =
    user?.role === "admin" || user?.role === "hr_manager" || user?.role === "training_manager";

  const { q, page, limit, setQ, setPage, setLimit } = useListParams({
    defaultLimit: PAGE_SIZES[0],
  });
  const [searchInput, setSearchInput] = useState(q);
  const debouncedInput = useDebouncedValue(searchInput, 300);

  const [personSearch, setPersonSearch] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [notes, setNotes] = useState("");
  const [actionErrors, setActionErrors] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Enrollment | null>(null);

  useEffect(() => {
    const next = debouncedInput.trim();
    if (next !== q) setQ(next);
  }, [debouncedInput, q, setQ]);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    setDeleteTarget(null);
  }, [q, page, limit]);

  const scheduledQuery = useQuery<ScheduledDetail>({
    queryKey: ["training-scheduled", id],
    queryFn: async () => (await api.get(`/training/scheduled/${id}`)).data,
  });

  const enrollmentsQuery = useQuery<Enrollment[]>({
    queryKey: ["training-enrollments", id],
    queryFn: async () => (await api.get(`/training/scheduled/${id}/enrollments`)).data,
  });

  const peopleQuery = useQuery<PersonListResponse>({
    queryKey: ["persons-for-enrollment", personSearch],
    queryFn: async () =>
      (await api.get("/persons", { params: { search: personSearch || undefined, limit: 25 } }))
        .data,
    enabled: canWrite,
  });

  const scheduled = scheduledQuery.data;
  const enrollments = enrollmentsQuery.data ?? [];
  const isClosed = scheduled?.status === "completed" || scheduled?.status === "cancelled";

  const enrolledIds = useMemo(
    () => new Set(enrollments.map((enrollment) => enrollment.personId)),
    [enrollments]
  );
  const candidates = (peopleQuery.data?.data ?? []).filter(
    (person) => !enrolledIds.has(person.id)
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["training-enrollments", id] });
    queryClient.invalidateQueries({ queryKey: ["training-scheduled", id] });
    queryClient.invalidateQueries({ queryKey: ["training-courses"] });
  };

  const enrollMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post(`/training/scheduled/${id}/enroll`, {
          personId: Number(selectedPersonId),
          notes: notes.trim() || null,
        })
      ).data,
    onSuccess: () => {
      invalidate();
      toast.success("تم تسجيل المتدرب");
      setSelectedPersonId("");
      setNotes("");
      setActionErrors([]);
    },
    onError: (error) => setActionErrors(extractErrorMessages(error)),
  });

  const toggleMutation = useMutation({
    mutationFn: async (enrollment: Enrollment) =>
      (
        await api.put(`/training/enrollments/${enrollment.id}`, {
          completed: !enrollment.completed,
        })
      ).data,
    onSuccess: () => {
      invalidate();
      toast.success("تم تحديث حالة المتدرب");
      setActionErrors([]);
    },
    onError: (error) => setActionErrors(extractErrorMessages(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (enrollment: Enrollment) =>
      (await api.delete(`/training/enrollments/${enrollment.id}`)).data,
    onSuccess: () => {
      invalidate();
      toast.success("تم حذف التسجيل");
      setDeleteTarget(null);
      setActionErrors([]);
    },
    onError: (error) => {
      setActionErrors(extractErrorMessages(error));
      setDeleteTarget(null);
    },
  });

  const filteredEnrollments = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return enrollments;
    return enrollments.filter(
      (enrollment) =>
        fullName(enrollment.person).toLowerCase().includes(term) ||
        (enrollment.notes ?? "").toLowerCase().includes(term) ||
        String(enrollment.personId).includes(term)
    );
  }, [enrollments, q]);

  const total = filteredEnrollments.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const rows = filteredEnrollments.slice((currentPage - 1) * limit, currentPage * limit);
  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, setPage]);

  const clearSearch = () => {
    setSearchInput("");
    setQ("");
  };

  if (scheduledQuery.isLoading) {
    return (
      <div className="stack">
        <PageHeader title="متدربو الدورة" backTo="/training" backLabel="التدريب" />
        <section className="card">
          <LoadingState label="جارٍ تحميل بيانات الدورة…" />
        </section>
      </div>
    );
  }

  if (scheduledQuery.error || !scheduled) {
    return (
      <div className="stack">
        <PageHeader title="متدربو الدورة" backTo="/training" backLabel="التدريب" />
        <ErrorState
          title="تعذّر تحميل بيانات الدورة"
          message={
            scheduledQuery.error
              ? extractErrorMessages(scheduledQuery.error).join(" — ")
              : "الدورة المجدولة غير موجودة"
          }
          onRetry={() => scheduledQuery.refetch()}
        />
      </div>
    );
  }

  const completedCount = enrollments.filter((enrollment) => enrollment.completed).length;

  const kpis: { label: string; value: number | string; icon: LucideIcon }[] = [
    { label: "المسجّلون", value: enrollments.length, icon: Users },
    { label: "أتمّوا الدورة", value: completedCount, icon: CheckCircle2 },
    { label: "المستهدف", value: scheduled.numStudents ?? "—", icon: Circle },
  ];

  return (
    <div className="stack">
      <PageHeader
        title={`متدربو الدورة: ${scheduled.trainingCourse?.name ?? "—"}`}
        subtitle={`${scheduled.site || "بدون موقع"} — ${formatDate(scheduled.startDate)} إلى ${formatDate(
          scheduled.endDate
        )}`}
        backTo="/training"
        backLabel="التدريب"
        actions={
          <>
            <Pill tone={STATUS_TONES[scheduled.status] ?? "mute"}>
              {STATUS_LABELS[scheduled.status] ?? scheduled.status}
            </Pill>
            {canWrite && (
              <a
                className="btn btn-ghost"
                href={`/training/scheduled/${scheduled.id}/edit`}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(`/training/scheduled/${scheduled.id}/edit`);
                }}
              >
                <Pencil aria-hidden="true" />
                تعديل الجدولة
              </a>
            )}
          </>
        }
      />

      <section
        className="kpi-strip"
        aria-label="مؤشرات التسجيل"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
      >
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
                <span className="kpi-value">
                  {typeof kpi.value === "number" ? formatNumber(kpi.value) : kpi.value}
                </span>
              </span>
            </div>
          );
        })}
      </section>

      {actionErrors.length > 0 && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <strong>تعذر تنفيذ العملية</strong>
            {actionErrors.map((message, index) => (
              <div key={index}>{message}</div>
            ))}
          </div>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            aria-label="إخفاء التنبيه"
            onClick={() => setActionErrors([])}
            style={{ flex: "none" }}
          >
            <X aria-hidden="true" />
          </button>
        </div>
      )}

      {canWrite && (
        <section className="card">
          <div className="card-head">
            <span className="kpi-icon" aria-hidden="true">
              <UserPlus size={14} />
            </span>
            <h2 className="card-title">تسجيل متدرب</h2>
          </div>
          <div className="card-body">
            {isClosed ? (
              <div className="alert alert-info" role="status">
                <AlertCircle aria-hidden="true" />
                <div>
                  لا يمكن التسجيل: الدورة{" "}
                  {STATUS_LABELS[scheduled.status] ?? scheduled.status}.
                </div>
              </div>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setActionErrors([]);
                  if (!selectedPersonId) {
                    setActionErrors(["اختر متدرباً أولاً"]);
                    return;
                  }
                  enrollMutation.mutate();
                }}
              >
                <div className="form-body" style={{ padding: 0 }}>
                  <div className="field">
                    <label className="label" htmlFor="enrollment-person-search">
                      بحث عن شخص
                    </label>
                    <div className="input-wrap">
                      <Search aria-hidden="true" />
                      <input
                        className="input"
                        id="enrollment-person-search"
                        type="text"
                        value={personSearch}
                        onChange={(event) => setPersonSearch(event.target.value)}
                        placeholder="الاسم أو اللقب…"
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label" htmlFor="enrollment-person">
                      الشخص <span className="req">*</span>
                    </label>
                    <select
                      className="select"
                      id="enrollment-person"
                      value={selectedPersonId}
                      onChange={(event) => setSelectedPersonId(event.target.value)}
                      required
                    >
                      <option value="">
                        {peopleQuery.isLoading
                          ? "جارٍ التحميل…"
                          : candidates.length
                            ? "اختر شخصاً"
                            : "لا يوجد أشخاص متاحون"}
                      </option>
                      {candidates.map((person) => (
                        <option key={person.id} value={person.id}>
                          {fullName(person)} (#{person.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field full">
                    <label className="label" htmlFor="enrollment-notes">
                      ملاحظات
                    </label>
                    <input
                      className="input"
                      id="enrollment-notes"
                      type="text"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </div>

                  <div className="field full">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={enrollMutation.isPending}
                      style={{ justifySelf: "start" }}
                    >
                      <UserPlus aria-hidden="true" />
                      {enrollMutation.isPending ? "جارٍ التسجيل…" : "تسجيل المتدرب"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </section>
      )}

      {enrollmentsQuery.error && (
        <ErrorState
          title="تعذّر تحميل المتدربين"
          message={extractErrorMessages(enrollmentsQuery.error).join(" — ")}
          onRetry={() => enrollmentsQuery.refetch()}
        />
      )}

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">قائمة المتدربين</h2>
          <span className="card-sub">{formatNumber(enrollments.length)} متدرب</span>
        </div>

        <div className="toolbar">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="ابحث باسم المتدرب أو الملاحظات…"
            label="بحث في المتدربين"
          />

          <select
            className="select"
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            aria-label="عدد المتدربين في الصفحة"
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
                <th scope="col">المتدرب</th>
                <th scope="col" className="col-compact">
                  تاريخ الطلب
                </th>
                <th scope="col">الحالة</th>
                <th scope="col" className="col-optional">
                  ملاحظات
                </th>
                <th scope="col">
                  <span className="sr-only">إجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {enrollmentsQuery.isLoading && (
                <TableSkeleton
                  rows={6}
                  cols={5}
                  widths={[180, 100, 80, 140, 0]}
                />
              )}

              {!enrollmentsQuery.isLoading &&
                rows.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td>
                      <div className="cell-person">
                        <span
                          className={`avatar sm ${avatarTone(enrollment.personId)}`}
                          aria-hidden="true"
                        >
                          {initials(enrollment.person.firstname, enrollment.person.surname)}
                        </span>
                        <span className="person-meta">
                          <span className="person-name">{fullName(enrollment.person)}</span>
                          <span className="person-sub">
                            #{formatNumber(enrollment.personId)}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="mono col-compact">
                      {formatDate(enrollment.requestDate)}
                    </td>
                    <td>
                      <Pill tone={enrollment.completed ? "ok" : "warn"}>
                        {enrollment.completed ? "أتمّ الدورة" : "قيد المشاركة"}
                      </Pill>
                    </td>
                    <td className="col-optional">
                      <span
                        style={{
                          display: "block",
                          maxWidth: 260,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={enrollment.notes ?? undefined}
                      >
                        {enrollment.notes || "—"}
                      </span>
                    </td>
                    <td className="col-actions">
                      {canWrite && (
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-btn icon-btn--sm"
                            aria-label={
                              enrollment.completed ? "إلغاء الإتمام" : "تأكيد الإتمام"
                            }
                            title={enrollment.completed ? "إلغاء الإتمام" : "تأكيد الإتمام"}
                            disabled={toggleMutation.isPending}
                            onClick={() => toggleMutation.mutate(enrollment)}
                            style={{
                              color: enrollment.completed ? "var(--warn)" : "var(--ok)",
                            }}
                          >
                            {enrollment.completed ? (
                              <Circle aria-hidden="true" />
                            ) : (
                              <CheckCircle2 aria-hidden="true" />
                            )}
                          </button>
                          <button
                            type="button"
                            className="icon-btn icon-btn--sm danger"
                            aria-label={`حذف تسجيل ${fullName(enrollment.person)}`}
                            title="حذف التسجيل"
                            onClick={() => {
                              setDeleteTarget(enrollment);
                              setActionErrors([]);
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

        {!enrollmentsQuery.isLoading && rows.length === 0 && (
          <EmptyState
            icon={q ? SearchX : Users}
            title={q ? "لا نتائج مطابقة" : "لا يوجد متدربون مسجّلون بعد"}
            text={
              q
                ? `لم نجد متدرباً يطابق «${q}». جرّب جزءاً من الاسم أو امسح البحث.`
                : "سجّل أول متدرب من النموذج أعلاه ليظهر في هذه القائمة."
            }
            action={
              q ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={clearSearch}>
                  مسح البحث
                </button>
              ) : undefined
            }
          />
        )}

        {!enrollmentsQuery.isLoading && rows.length > 0 && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            total={total}
            from={from}
            to={to}
            onPage={setPage}
            isFetching={enrollmentsQuery.isFetching}
          />
        )}
      </section>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="تأكيد حذف التسجيل"
        text={
          <>
            سيُحذف تسجيل <strong>{deleteTarget ? fullName(deleteTarget.person) : ""}</strong> من
            هذه الدورة.
          </>
        }
        confirmLabel="تأكيد الحذف"
        pending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
