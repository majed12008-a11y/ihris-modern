import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

export interface UserCreateInput {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

export interface UserFilter {
  page?: number;
  limit?: number;
  search?: string;
}

export class UserService {
  static async list(filter: UserFilter = {}) {
    const { page = 1, limit = 50, search } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { firstname: { contains: search } },
        { lastname: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { username: "asc" },
        include: {
          access: { include: { role: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: data.map((u: any) => ({
        id: u.id,
        username: u.username,
        firstname: u.firstname,
        lastname: u.lastname,
        email: u.email,
        role: u.access?.[0]?.role?.name || "hr_staff",
        createdAt: u.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async create(data: UserCreateInput) {
    const existing = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existing) throw new Error("Username already exists");

    const role = await prisma.role.findUnique({
      where: { name: data.role },
    });
    if (!role) throw new Error("Invalid role");

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        creatorId: 1,
        access: {
          create: { roleId: role.id },
        },
      },
      include: { access: { include: { role: true } } },
    });

    return {
      id: user.id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: data.role,
    };
  }

  static async updateRole(userId: number, roleName: string) {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) throw new Error("Invalid role");

    await prisma.userAccess.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id },
    });

    return { success: true };
  }
}
