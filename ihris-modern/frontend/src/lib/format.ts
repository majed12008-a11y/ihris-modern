/** أدوات تنسيق مشتركة — أرقام وتواريخ بصيغة عربية مع أرقام لاتينية. */

const numberFormatter = new Intl.NumberFormat("ar", {
  numberingSystem: "latn",
});

const dateFormatter = new Intl.DateTimeFormat("ar", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  numberingSystem: "latn",
  calendar: "gregory",
});

const longDateFormatter = new Intl.DateTimeFormat("ar", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  numberingSystem: "latn",
  calendar: "gregory",
});

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return numberFormatter.format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export function formatLongDate(value: Date = new Date()): string {
  return longDateFormatter.format(value);
}

/** الحروف الأولى من الاسم — للصورة الرمزية. */
export function initials(...parts: (string | null | undefined)[]): string {
  const letters = parts
    .map((part) => (part ?? "").trim().charAt(0))
    .filter(Boolean);
  return letters.length ? letters.slice(0, 2).join("") : "؟";
}

/** فئة لون الصورة الرمزية (ثابتة لكل سجل حتى لا تتغير مع كل رسم). */
export function avatarTone(seed: number): string {
  return `a${(Math.abs(seed) % 5) + 1}`;
}
