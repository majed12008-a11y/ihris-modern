import { UserCog } from "lucide-react";
import ReferenceDataManager from "@/components/reference/ReferenceDataManager";

/** GAP-M-012 — CRUD الفئات الوظيفية. */
export default function Cadres() {
  return (
    <ReferenceDataManager
      entity="cadres"
      title="الفئات الوظيفية"
      subtitle="الفئات الصحية والوظيفية (طبيب، ممرض، صيدلي...)"
      icon={UserCog}
      searchPlaceholder="ابحث باسم الفئة أو الكود..."
      fields={[
        { key: "name", label: "الاسم", required: true, maxLength: 100 },
        { key: "code", label: "الكود", maxLength: 50, mono: true, placeholder: "CAD-MD" },
        { key: "description", label: "الوصف", maxLength: 2000, textarea: true },
      ]}
    />
  );
}
