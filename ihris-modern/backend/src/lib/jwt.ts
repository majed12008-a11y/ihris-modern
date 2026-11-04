import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { config } from "../config";

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
}

const jwtSecret: Secret = config.jwtSecret as Secret;
const signOptions: SignOptions = { expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"] };

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, jwtSecret, signOptions);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
