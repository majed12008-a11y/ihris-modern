import type { ReactNode } from "react";
import { AlertCircle, Inbox, type LucideIcon } from "lucide-react";

/** حالة تحميل موحّدة. */
export function LoadingState({ label = "جارٍ التحميل…" }: { label?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span className="state-text">{label}</span>
    </div>
  );
}

/** حالة خطأ موحّدة مع إعادة المحاولة. */
export function ErrorState({
  title = "تعذّر تحميل البيانات",
  message,
  onRetry,
}: {
  title?: string;
  message?: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div className="alert alert-danger" role="alert">
      <AlertCircle aria-hidden="true" />
      <div>
        <strong>{title}.</strong> {message}
        {onRetry && (
          <div style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
              إعادة المحاولة
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** حالة فراغ موحّدة (قائمة بلا نتائج أو بلا سجلات). */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  text,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  text?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="state">
      <span className="state-icon" aria-hidden="true">
        <Icon />
      </span>
      <span className="state-title">{title}</span>
      {text ? <span className="state-text">{text}</span> : null}
      {action}
    </div>
  );
}

/**
 * صفوف هيكلية أثناء التحميل — تُستخدم داخل <tbody> فقط.
 */
export function TableSkeleton({
  rows = 5,
  cols = 4,
  widths = [180, 90, 110, 70],
}: {
  rows?: number;
  cols?: number;
  widths?: number[];
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={`skeleton-${rowIndex}`}>
          {Array.from({ length: cols }, (_, colIndex) => (
            <td key={`skeleton-${rowIndex}-${colIndex}`}>
              <span
                className="skeleton"
                style={{
                  width: widths[colIndex] ?? 90,
                  height: colIndex === 0 ? 14 : 12,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
