import { Tags } from "lucide-react";
import ReferenceDataManager from "@/components/reference/ReferenceDataManager";

/** GAP-M-013 — CRUD التصنيفات الوظيفية. */
export default function Classifications() {
  return (
    <ReferenceDataManager
      entity="classifications"
      title="التصنيفات الوظيفية"
      subtitle="تصنيفات ISCO وغيرها (مهني، فني، إداري...)"
      icon={Tags}
      searchPlaceholder="ابحث باسم التصنيف أو الكود..."
      fields={[
        { key: "name", label: "الاسم", required: true, maxLength: 100 },
        { key: "code", label: "الكود", maxLength: 50, mono: true, placeholder: "222" },
        { key: "description", label: "الوصف", maxLength: 2000, textarea: true },
      ]}
    />
  );
}
