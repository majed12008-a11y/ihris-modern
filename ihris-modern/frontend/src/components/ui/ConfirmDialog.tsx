import { useEffect, useId, useRef } from "react";
import { AlertTriangle, X, type LucideIcon } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  text?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  /** danger لعمليات الحذف، primary لبقية التأكيدات. */
  tone?: "danger" | "primary";
  icon?: LucideIcon;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * نافذة تأكيد موحّدة: Escape يغلق، النقر على الخلفية يغلق،
 * التركيز يُحبس داخل النافذة ويُعاد إلى العنصر السابق عند الإغلاق.
 */
export default function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel = "تأكيد الحذف",
  cancelLabel = "إلغاء",
  pending = false,
  tone = "danger",
  icon: Icon = AlertTriangle,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="dialog-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={text ? textId : undefined}
        ref={panelRef}
      >
        <div className="dialog-head">
          <span
            className={`dialog-icon${tone === "danger" ? " danger" : ""}`}
            aria-hidden="true"
          >
            <Icon size={18} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h2 className="dialog-title" id={titleId}>
              {title}
            </h2>
            {text ? (
              <p className="dialog-text" id={textId}>
                {text}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="إغلاق"
            onClick={onClose}
            style={{ marginInlineStart: "auto", flex: "none" }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="dialog-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={tone === "danger" ? "btn btn-danger" : "btn btn-primary"}
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "جارٍ التنفيذ…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
