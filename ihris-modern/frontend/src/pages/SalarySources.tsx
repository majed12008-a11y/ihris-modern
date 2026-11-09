import { Landmark } from "lucide-react";
import ReferenceDataManager from "@/components/reference/ReferenceDataManager";

/** GAP-M-015 — CRUD مصادر الرواتب. */
export default function SalarySources() {
  return (
    <ReferenceDataManager
      entity="salary-sources"
      title="مصادر الرواتب"
      subtitle="الجهة الممولة للراتب (منظمات، وزارة الصحة، قطاع خاص...)"
      icon={Landmark}
      searchPlaceholder="ابحث باسم المصدر أو الكود..."
      fields={[
        { key: "name", label: "الاسم", required: true, maxLength: 100 },
        { key: "code", label: "الكود", maxLength: 50, mono: true, placeholder: "SRC-MOH" },
        { key: "description", label: "الوصف", maxLength: 2000, textarea: true },
      ]}
    />
  );
}
