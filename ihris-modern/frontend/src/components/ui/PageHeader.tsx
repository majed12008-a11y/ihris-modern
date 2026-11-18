import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** أزرار أو روابط الإجراءات — تُعرض في الطرف المقابل للعنوان. */
  actions?: ReactNode;
  /** مسار العودة (رابط حقيقي مع تنقّل داخلي). */
  backTo?: string;
  backLabel?: string;
}

/**
 * ترويسة الصفحة الموحّدة: عنوان + وصف + إجراءات، مع رابط عودة اختياري.
 */
export default function PageHeader({
  title,
  subtitle,
  actions,
  backTo,
  backLabel = "رجوع",
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="page-head">
      <div>
        {backTo && (
          <a
            className="link"
            href={backTo}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontSize: 12.5,
              marginBottom: 3,
            }}
            onClick={(event) => {
              event.preventDefault();
              navigate(backTo);
            }}
          >
            <ChevronRight size={14} aria-hidden="true" />
            {backLabel}
          </a>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="head-actions">{actions}</div> : null}
    </div>
  );
}
