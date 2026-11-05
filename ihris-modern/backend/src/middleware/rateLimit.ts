import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

/**
 * حدّ معدل بسيط في الذاكرة (نافذة زمنية ثابتة).
 * افتراضياً: 10 تنفيذات تقرير في الدقيقة لكل مستخدم (ADR-004، البند 10).
 *
 * ملاحظة: الذاكرة محلية لكل عملية Node؛ في نشر متعدد النسخ يجب استخدام
 * مخزن مشترك (Redis) — موثق كقيد في ADR-004.
 */
export function rateLimit(options: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const key = String(req.user?.userId ?? req.ip ?? "anonymous");
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now >= entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (entry.count >= options.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({
        error: "Too many report executions. Please retry later.",
        retryAfterSeconds: retryAfter,
      });
      return;
    }

    entry.count += 1;
    next();
  };
}

/** 10 تنفيذات / دقيقة / مستخدم */
export const reportExecutionLimiter = rateLimit({ windowMs: 60_000, max: 10 });
