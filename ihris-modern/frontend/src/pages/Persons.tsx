import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { toast } from "sonner";
import { Edit, Trash2, Eye, Plus, X, SearchX, Users } from "lucide-react";
import type { Person, PaginatedResponse } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { avatarTone, formatDate, formatNumber, initials } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/StateViews";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";

interface CountryOption {
  id: number;
  name: string;
}

const PAGE_SIZES = [10, 25, 50];

export default function Persons() {
  const { q, page, limit, setQ, setPage, setLimit } = useListParams({
    defaultLimit: PAGE_SIZES[0],
  });

  const [searchInput, setSearchInput] = useState(q);
  const debouncedInput = useDebouncedValue(searchInput, 300);
  const search = q;

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  // إدخال المستخدم ← عنوان URL (بعد توقّف الكتابة)
  useEffect(() => {
    const next = debouncedInput.trim();
    if (next !== q) setQ(next);
  }, [debouncedInput, q, setQ]);

  // تغيّر خارجي (شريط البحث العلوي أو زر الرجوع) ← حقل البحث
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

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

  const clearSearch = () => {
    setSearchInput("");
    setQ("");
  };

  return (
    <>
      <PageHeader
        title="الموظفون"
        subtitle={
          isLoading
            ? "جاري تحميل السجلات…"
            : `${formatNumber(total)} سجل موظف في النظام`
        }
        actions={
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
        }
      />

      {error && (
        <div style={{ marginBottom: 18 }}>
          <ErrorState
            message={error instanceof Error ? error.message : String(error)}
            onRetry={() => refetch()}
          />
        </div>
      )}

      <section className="card">
        <div className="toolbar">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="ابحث بالاسم أو رقم السجل…"
            label="بحث في الموظفين"
          />

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
            <button type="button" className="clear-link" onClick={clearSearch}>
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
                  onClick={clearSearch}
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
              {isLoading && (
                <TableSkeleton rows={5} cols={6} widths={[18, 160, 70, 70, 90, 0]} />
              )}

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
          <EmptyState
            icon={search ? SearchX : Users}
            title={search ? "لا نتائج مطابقة" : "لا يوجد موظفون بعد"}
            text={
              search
                ? `لم نجد سجلاً يطابق «${search}». جرّب جزءاً من الاسم أو امسح البحث.`
                : "ابدأ بتسجيل أول موظف ليظهر في القوائم والتقارير."
            }
            action={
              search ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={clearSearch}>
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
                </button>
              )
            }
          />
        )}

        {!isLoading && rows.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            from={from}
            to={to}
            onPage={setPage}
            isFetching={isFetching}
          />
        )}
      </section>
    </>
  );
}
