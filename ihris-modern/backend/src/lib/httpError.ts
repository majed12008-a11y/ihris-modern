import { Response } from "express";

/**
 * خطأ HTTP يحمل رمز الحالة ورسالة عربية واضحة.
 * `errorHandler` يقرأ `statusCode` ويعيد `error` و`code` و`details` إن وُجدت.
 */
export class HttpError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(statusCode: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function forbidden(message = "غير مصرح لك بهذه العملية"): HttpError {
  return new HttpError(403, message, "FORBIDDEN");
}

export function notFound(message = "المستخدم غير موجود"): HttpError {
  return new HttpError(404, message, "NOT_FOUND");
}

export function badRequest(message: string, details?: unknown): HttpError {
  return new HttpError(400, message, "BAD_REQUEST", details);
}

export function conflict(message: string): HttpError {
  return new HttpError(409, message, "CONFLICT");
}

export function unprocessable(message: string, details?: unknown): HttpError {
  return new HttpError(422, message, "UNPROCESSABLE_ENTITY", details);
}

/** تحويل خطأ التحقق (Zod) إلى استجابة 400 موحدة */
export function sendValidationError(res: Response, errors: string[]): void {
  res.status(400).json({ error: "بيانات غير صحيحة", code: "VALIDATION_ERROR", errors });
}
