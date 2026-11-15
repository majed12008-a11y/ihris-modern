/**
 * تعريفات أنواع لحزمة `arabic-persian-reshaper` (لا تُصدِّر .d.ts).
 * الحزمة تُعيد تشكيل الحروف العربية/الفارسية إلى صورها السياقية (Presentation Forms).
 */
declare module "arabic-persian-reshaper" {
  export const ArabicShaper: {
    convertArabic(input: string): string;
  };

  export const PersianShaper: {
    convertPersian(input: string): string;
  };
}
