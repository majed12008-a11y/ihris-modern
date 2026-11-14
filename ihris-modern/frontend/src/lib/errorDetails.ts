import { AxiosError } from "axios";

/**
 * Sprint 6 — Polish: إظهار تفاصيل 422 بشكل مقروء.
 * يدعم { error, errors[], details{} } القادمة من errorHandler.
 */
const DETAIL_LABELS: Record<string, string> = {
  scheduledCourses: "دورات مجدولة",
  courses: "دورات",
  enrollments: "تسجيلات",
  positions: "مناصب",
  مناصب: "مناصب",
};

export function extractErrorMessages(error: unknown): string[] {
  const axiosError = error as AxiosError<any>;
  const body = axiosError?.response?.data;

  if (!body) {
    if (error instanceof Error) return [error.message];
    return ["تعذر تنفيذ العملية"];
  }

  const messages: string[] = [];
  if (typeof body.error === "string" && body.error) messages.push(body.error);

  if (Array.isArray(body.errors)) {
    messages.push(...body.errors.filter((e: unknown) => typeof e === "string"));
  }

  if (body.details && typeof body.details === "object") {
    for (const [key, value] of Object.entries(body.details)) {
      const label = DETAIL_LABELS[key] ?? key;
      messages.push(`${label}: ${String(value)}`);
    }
  }

  return messages.length ? Array.from(new Set(messages)) : ["تعذر تنفيذ العملية"];
}
