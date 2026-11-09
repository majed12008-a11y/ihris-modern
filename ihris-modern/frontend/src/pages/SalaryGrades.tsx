import { Layers } from "lucide-react";
import ReferenceDataManager from "@/components/reference/ReferenceDataManager";

/** GAP-FE-010/011/012 — CRUD درجات الرواتب. */
export default function SalaryGrades() {
  return (
    <ReferenceDataManager
      entity="salary-grades"
      title="درجات الرواتب"
      subtitle="البيانات المرجعية لدرجات الرواتب — تُستخدم عند إنشاء المسميات الوظيفية"
      icon={Layers}
      searchPlaceholder="ابحث باسم الدرجة أو الكود..."
      fields={[
        { key: "name", label: "الاسم", required: true, maxLength: 100 },
        { key: "code", label: "الكود", maxLength: 50, mono: true, placeholder: "SG-01" },
        { key: "startSalary", label: "الحد الأدنى", maxLength: 255, mono: true },
        { key: "endSalary", label: "الحد الأعلى", maxLength: 255, mono: true },
        { key: "midpointSalary", label: "نقطة الوسط", maxLength: 255, mono: true },
        { key: "notes", label: "ملاحظات", maxLength: 2000, textarea: true },
        { key: "description", label: "الوصف", maxLength: 2000, textarea: true },
      ]}
    />
  );
}
