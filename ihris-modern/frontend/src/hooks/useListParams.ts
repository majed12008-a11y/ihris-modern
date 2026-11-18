import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

interface ListParamsOptions {
  defaultLimit?: number;
}

/**
 * حالة القوائم (بحث/صفحة/حجم الصفحة) محفوظة في عنوان URL،
 * حتى تعمل المشاركة والتحديث وزر الرجوع كما هو متوقع.
 */
export function useListParams({ defaultLimit = 10 }: ListParamsOptions = {}) {
  const [params, setParams] = useSearchParams();

  const q = params.get("q") ?? "";
  const rawPage = Number(params.get("page"));
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const rawLimit = Number(params.get("limit"));
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : defaultLimit;

  const update = useCallback(
    (patch: Record<string, string | number | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            const isDefaultPage = key === "page" && Number(value) <= 1;
            if (value === null || value === "" || isDefaultPage) {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  return useMemo(
    () => ({
      q,
      page,
      limit,
      setQ: (value: string) => update({ q: value, page: null }),
      setPage: (value: number) => update({ page: value }),
      setLimit: (value: number) => update({ limit: value, page: null }),
    }),
    [q, page, limit, update]
  );
}
