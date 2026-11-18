import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/format";

/** أرقام صفحات مختصرة حول الصفحة الحالية. */
export function pageWindow(current: number, total: number): (number | "gap")[] {
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

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  onPage: (page: number) => void;
  /** يظهر «جاري التحديث…» أثناء جلب الصفحة التالية. */
  isFetching?: boolean;
}

/** شريط تذييل الجدول: عدّاد النتائج + ترقيم الصفحات. */
export default function Pagination({
  page,
  totalPages,
  total,
  from,
  to,
  onPage,
  isFetching,
}: PaginationProps) {
  const pages = Math.max(1, totalPages);

  return (
    <div className="table-foot">
      <span aria-live="polite">
        عرض {formatNumber(from)}–{formatNumber(to)} من {formatNumber(total)}
        {isFetching ? " · جاري التحديث…" : ""}
      </span>
      <div className="pager">
        <button
          type="button"
          className="pg"
          aria-label="الصفحة السابقة"
          disabled={page <= 1}
          onClick={() => onPage(Math.max(1, page - 1))}
        >
          <ChevronRight aria-hidden="true" />
        </button>
        {pageWindow(page, pages).map((item, index) =>
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
              onClick={() => onPage(item)}
            >
              {formatNumber(item)}
            </button>
          )
        )}
        <button
          type="button"
          className="pg"
          aria-label="الصفحة التالية"
          disabled={page >= pages}
          onClick={() => onPage(Math.min(pages, page + 1))}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
