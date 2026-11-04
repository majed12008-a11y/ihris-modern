import { Request, Response, NextFunction } from "express";
import { extractTokenFromHeader, verifyToken } from "../lib/jwt";

export interface AuthRequest extends Request {
  user?: { userId: number; username: string; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
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

  req.user = payload;
  next();
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = extractTokenFromHeader(req.headers.authorization);
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.user = payload;
  }
  next();
}
