import { Request, Response, NextFunction } from "express";
import { extractTokenFromHeader, verifyToken, JwtPayload } from "../lib/jwt";
import { prisma } from "../lib/prisma";

export interface AuthUser {
  userId: number;
  username: string;
  role: string;
  tokenVersion: number;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * ADR-005: بعد التحقق من توقيع JWT نقرأ المستخدم من قاعدة البيانات ونتحقق من:
 *   1. الحساب موجود وغير محذوف منطقياً (deletedAt = null)
 *   2. الحساب نشط (isActive = true)
 *   3. نسخة الرمز مطابقة (jwt.tokenVersion === user.tokenVersion)
 * الدور يُقرأ من قاعدة البيانات أيضاً، فيسري تغيير الدور فوراً.
 *
 * التكلفة: استعلام واحد إضافي بالمفتاح الأساسي لكل طلب مصادَق.
 */
async function resolveAuthUser(payload: JwtPayload): Promise<AuthUser | null> {
  if (!payload || typeof payload.userId !== "number") return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { access: { include: { role: true } } },
  });

  if (!user || user.deletedAt !== null || !user.isActive) return null;

  // رمز قديم (قبل ADR-005) لا يحمل tokenVersion → undefined، فيُرفض بأمان
  if (payload.tokenVersion !== user.tokenVersion) return null;

  return {
    userId: user.id,
    username: user.username,
    role: user.access?.[0]?.role?.name || "hr_staff",
    tokenVersion: user.tokenVersion,
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      res.status(401).json({ error: "Unauthorized: token required" });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: "Unauthorized: invalid or expired token" });
      return;
    }

    const user = await resolveAuthUser(payload);
    if (!user) {
      res.status(401).json({ error: "Unauthorized: session is no longer valid" });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        const user = await resolveAuthUser(payload);
        if (user) req.user = user;
      }
    }
    next();
  } catch {
    // optionalAuth لا يفشل الطلب؛ يتجاهل أي خطأ ويترك req.user فارغاً
    next();
  }
}
