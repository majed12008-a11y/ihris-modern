import { prisma } from "../lib/prisma";
import { hashPassword, comparePassword } from "../lib/password";
import { signToken, JwtPayload } from "../lib/jwt";
import type { AppError } from "../middleware/error";

/** خطأ مصادقة يحمل رمز 401 (بدل 500 الافتراضي) */
function unauthorized(message = "Invalid username or password"): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = 401;
  return err;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

export class AuthService {
  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { username: input.username },
      include: { access: { include: { role: true } } },
    });

    if (!user) {
      throw unauthorized();
    }

    let isValid = false;
    try {
      isValid = await comparePassword(input.password, user.password);
    } catch {
      isValid = false;
    }
    if (!isValid) {
      throw unauthorized();
    }

    const role = user.access?.[0]?.role?.name || "hr_staff";

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role,
    };

    const token = signToken(payload);

    return {
      user: {
        id: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role,
      },
      token,
    };
  }

  static async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { username: input.username },
    });
    if (existing) {
      throw new Error("Username already exists");
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingEmail) {
      throw new Error("Email already exists");
    }

    const role = await prisma.role.findUnique({
      where: { name: input.role },
    });
    if (!role) {
      throw new Error("Invalid role");
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        username: input.username,
        password: hashedPassword,
        firstname: input.firstname,
        lastname: input.lastname,
        email: input.email,
        creatorId: 1,
        access: {
          create: { roleId: role.id },
        },
      },
      include: { access: { include: { role: true } } },
    });

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: input.role,
    };

    const token = signToken(payload);

    return {
      user: {
        id: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: input.role,
      },
      token,
    };
  }
}
