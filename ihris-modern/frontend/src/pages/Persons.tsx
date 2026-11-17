import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/services/api";
import { toast } from "sonner";
import {
  Edit,
  Trash2,
  Eye,
  Plus,
  Search,
  X,
  Inbox,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Person, PaginatedResponse } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { avatarTone, formatDate, formatNumber, initials } from "@/lib/format";

interface CountryOption {
  id: number;
  name: string;
}

const PAGE_SIZES = [10, 25, 50];

/** أرقام صفحات مختصرة حول الصفحة الحالية. */
function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current]);
  if (current - 1 > 1) pages.add(current - 1);
  if (current + 1 < total) pages.add(current + 1);
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) out.push("gap");
    out.push(page);
  });
  return out;
}

export default function Persons() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [search, setSearch] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZES[0]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  // البحث من الشريط العلوي يصل عبر ?q=
  useEffect(() => {
    const next = searchParams.get("q") ?? "";
    setSearchInput(next);
    setSearch(next);
    setPage(1);
  }, [searchParams]);

  // تأخير بسيط حتى لا يُطلق كل حرف طلباً
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, error, refetch } = useQuery<
    PaginatedResponse<Person>
  >({
    queryKey: ["persons", search, page, limit],
    queryFn: async () => {
      const res = await api.get("/persons", {
        params: { search, page, limit },
      });
      return res.data;
    },
  });

  const { data: countries } = useQuery<CountryOption[]>({
    queryKey: ["countries", "options"],
    queryFn: async () => {
      const res = await api.get("/countries", { params: { limit: 100 } });
      return res.data.data ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const countryName = useMemo(() => {
    const map = new Map<number, string>();
    (countries ?? []).forEach((country) => map.set(country.id, country.name));
    return (id: number | null) => (id ? map.get(id) ?? `#${id}` : "—");
  }, [countries]);

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // إعادة ضبط التحديد عند تغيّر النتائج
  useEffect(() => {
    setSelected(new Set());
    setBulkConfirm(false);
    setConfirmingId(null);
  }, [search, page, limit]);

  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => api.delete(`/persons/${id}`))
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      return { ok: ids.length - failed, failed };
    },
    onSuccess: ({ ok, failed }) => {
      queryClient.invalidateQueries({ queryKey: ["persons"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setSelected(new Set());
      setConfirmingId(null);
      setBulkConfirm(false);
      if (failed === 0) {
        toast.success(
          ok === 1 ? "تم حذف الموظف" : `تم حذف ${formatNumber(ok)} سجلات`
        );
      } else if (ok === 0) {
        toast.error("لم يُحذف أي سجل — تحقّق من الصلاحيات");
      } else {
        toast.error(`تم حذف ${formatNumber(ok)} وتعذّر حذف ${formatNumber(failed)}`);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "فشل حذف الموظف");
    },
  });

  const toggleRow = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOnPageSelected =
    rows.length > 0 && rows.every((row) => selected.has(row.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) rows.forEach((row) => next.delete(row.id));
      else rows.forEach((row) => next.add(row.id));
      return next;
    });
  };

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">الموظفون</h1>
          <p className="page-sub">
            {isLoading
              ? "جاري تحميل السجلات…"
              : `${formatNumber(total)} سجل موظف في النظام`}
          </p>
        </div>
        <div className="head-actions">
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
            <strong>تعذّر تحميل السجلات.</strong>{" "}
            {error instanceof Error ? error.message : String(error)}
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => refetch()}
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="card">
        <div className="toolbar">
          <div className="input-wrap filter">
            <Search aria-hidden="true" />
            <input
              className="input"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث بالاسم أو رقم السجل…"
              aria-label="بحث في الموظفين"
            />
          </div>

          <select
            className="select"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            aria-label="عدد السجلات في الصفحة"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} في الصفحة
              </option>
            ))}
          </select>

          {(search || searchInput) && (
            <button
              type="button"
              className="clear-link"
              onClick={() => {
                setSearchInput("");
                setSearch("");
              }}
            >
              مسح البحث
            </button>
          )}

          {search && (
            <div className="chips">
              <span className="chip">
                البحث: {search}
                <button
                  type="button"
                  aria-label="إزالة فلتر البحث"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                  }}
                >
                  <X aria-hidden="true" />
                </button>
              </span>
            </div>
          )}
        </div>

        {selected.size > 0 && (
          <div className="bulk">
            <span>تم تحديد {formatNumber(selected.size)}</span>
            <span className="spacer" />
            {bulkConfirm ? (
              <>
                <span>حذف السجلات المحددة نهائياً؟</span>
                <button
                  type="button"
                  className="danger"
                  onClick={() => deleteMutation.mutate([...selected])}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "جاري الحذف…" : "تأكيد الحذف"}
                </button>
                <button type="button" onClick={() => setBulkConfirm(false)}>
                  إلغاء
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setSelected(new Set())}>
                  إلغاء التحديد
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => setBulkConfirm(true)}
                  >
                    حذف
                  </button>
                )}
              </>
            )}
          </div>
        )}

        <div className="table-wrap">
          <table className="data-table data-table--dense">
            <thead>
              <tr>
                <th scope="col" className="col-check">
                  <button
                    type="button"
                    className="cbx"
                    role="checkbox"
                    aria-checked={allOnPageSelected ? "true" : "false"}
                    aria-label="تحديد كل الصفوف في الصفحة"
                    onClick={toggleAll}
                    disabled={rows.length === 0}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  </button>
                </th>
                <th scope="col">الموظف</th>
                <th scope="col" className="col-optional">
                  الجنسية
                </th>
                <th scope="col" className="col-optional">
                  الدولة
                </th>
                <th scope="col" className="col-compact">
                  تاريخ التسجيل
                </th>
                <th scope="col">
                  <span className="sr-only">إجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                [0, 1, 2, 3, 4].map((row) => (
                  <tr key={`skeleton-${row}`}>
                    <td className="col-check" />
                    <td>
                      <div className="cell-person">
                        <span
                          className="skeleton"
                          style={{ width: 30, height: 30, borderRadius: "50%" }}
                        />
                        <span className="skeleton" style={{ width: 160 }} />
                      </div>
                    </td>
                    <td className="col-optional">
                      <span className="skeleton" style={{ width: 70 }} />
                    </td>
                    <td className="col-optional">
                      <span className="skeleton" style={{ width: 70 }} />
                    </td>
                    <td className="col-compact">
                      <span className="skeleton" style={{ width: 90 }} />
                    </td>
                    <td className="col-actions" />
                  </tr>
                ))}

              {!isLoading &&
                rows.map((person) => {
                  const isSelected = selected.has(person.id);
                  const isConfirming = confirmingId === person.id;
                  return (
                    <tr key={person.id} className={isSelected ? "is-selected" : undefined}>
                      <td className="col-check">
                        <button
                          type="button"
                          className="cbx"
                          role="checkbox"
                          aria-checked={isSelected ? "true" : "false"}
                          aria-label={`تحديد ${person.firstname} ${person.surname}`}
                          onClick={() => toggleRow(person.id)}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="m5 13 4 4L19 7" />
                          </svg>
                        </button>
                      </td>
                      <td>
                        <div className="cell-person">
                          <span
                            className={`avatar sm ${avatarTone(person.id)}`}
                            aria-hidden="true"
                          >
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
                      <td className="col-optional">
                        {countryName(person.nationalityId)}
                      </td>
                      <td className="col-optional">
                        {countryName(person.countryId)}
                      </td>
                      <td className="mono col-compact">{formatDate(person.createdAt)}</td>
                      <td className="col-actions">
                        {isConfirming ? (
                          <div className="row-actions">
                            <span style={{ fontSize: 12, color: "var(--danger)" }}>
                              حذف؟
                            </span>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => deleteMutation.mutate([person.id])}
                              disabled={deleteMutation.isPending}
                            >
                              تأكيد
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setConfirmingId(null)}
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <div className="row-actions">
                            <a
                              className="icon-btn icon-btn--sm"
                              href={`/persons/${person.id}`}
                              aria-label={`عرض ${person.firstname} ${person.surname}`}
                              title="عرض"
                              onClick={(event) => {
                                event.preventDefault();
                                navigate(`/persons/${person.id}`);
                              }}
                            >
                              <Eye aria-hidden="true" />
                            </a>
                            <a
                              className="icon-btn icon-btn--sm"
                              href={`/persons/${person.id}/edit`}
                              aria-label={`تعديل ${person.firstname} ${person.surname}`}
                              title="تعديل"
                              onClick={(event) => {
                                event.preventDefault();
                                navigate(`/persons/${person.id}/edit`);
                              }}
                            >
                              <Edit aria-hidden="true" />
                            </a>
                            {isAdmin && (
                              <button
                                type="button"
                                className="icon-btn icon-btn--sm danger"
                                aria-label={`حذف ${person.firstname} ${person.surname}`}
                                title="حذف"
                                onClick={() => setConfirmingId(person.id)}
                              >
                                <Trash2 aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {!isLoading && rows.length === 0 && (
          <div className="state">
            <span className="state-icon" aria-hidden="true">
              <Inbox />
            </span>
            <span className="state-title">
              {search ? "لا نتائج مطابقة" : "لا يوجد موظفون بعد"}
            </span>
            <span className="state-text">
              {search
                ? `لم نجد سجلاً يطابق «${search}». جرّب جزءاً من الاسم أو امسح البحث.`
                : "ابدأ بتسجيل أول موظف ليظهر في القوائم والتقارير."}
            </span>
            {search ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
              >
                مسح البحث
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate("/persons/new")}
              >
                <Plus aria-hidden="true" />
                إضافة موظف
              </button>            )}
          </div>
        )}

        {!isLoading && rows.length > 0 && (
          <div className="table-foot">
            <span aria-live="polite">
              عرض {formatNumber(from)}–{formatNumber(to)} من {formatNumber(total)}
              {isFetching && " · جاري التحديث…"}
            </span>
            <div className="pager">
              <button
                type="button"
                className="pg"
                aria-label="الصفحة السابقة"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronRight aria-hidden="true" />
              </button>
              {pageWindow(page, Math.max(1, totalPages)).map((item, index) =>
                item === "gap" ? (
                  <span key={`gap-${index}`} className="pg" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    type="button"
                    key={item}
                    className={`pg${item === page ? " is-current" : ""}`}
                    aria-current={item === page ? "page" : undefined}
                    onClick={() => setPage(item)}
                  >
                    {formatNumber(item)}
                  </button>
                )
              )}
              <button
                type="button"
                className="pg"
                aria-label="الصفحة التالية"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
