import { Briefcase } from "lucide-react";
import ReferenceDataManager from "@/components/reference/ReferenceDataManager";

/** GAP-M-014 — CRUD أنواع الوظائف. */
export default function PositionTypes() {
  return (
    <ReferenceDataManager
      entity="position-types"
      title="أنواع الوظائف"
      subtitle="دائم، مؤقت، استشاري... تُستخدم لتوصيف المناصب"
      icon={Briefcase}
      searchPlaceholder="ابحث باسم النوع أو الكود..."
      fields={[
        { key: "name", label: "الاسم", required: true, maxLength: 100 },
        { key: "code", label: "الكود", maxLength: 50, mono: true, placeholder: "PT-PERM-FT" },
        { key: "description", label: "الوصف", maxLength: 2000, textarea: true },
      ]}
    />
  );
}
