import { Request, Response } from "express";
import { UserService, Actor } from "../services/user.service";
import { asyncHandler } from "../middleware/error";
import { AuthRequest } from "../middleware/auth";
import { sendValidationError } from "../lib/httpError";
import {
  createUserSchema,
  deleteUserSchema,
  formatZodErrors,
  restoreUserSchema,
  updateRoleSchema,
  updateUserSchema,
} from "../services/user.validation";

function actorOf(req: Request): Actor {
  const user = (req as AuthRequest).user;
  if (!user) {
    // authenticate يجب أن يمنع هذا، لكنه دفاع إضافي
    const err: any = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
  return user;
}

function parseId(req: Request): number {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id <= 0) {
    const err: any = new Error("معرّف المستخدم غير صالح");
    err.statusCode = 400;
    throw err;
  }
  return id;
}

function parseFilter(req: Request) {
  return {
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
    search: req.query.search as string | undefined,
  };
}

export class UserController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const result = await UserService.list(parseFilter(req));
    res.json(result);
  });

  static listDeleted = asyncHandler(async (req: Request, res: Response) => {
    const result = await UserService.listDeleted(actorOf(req), parseFilter(req));
    res.json(result);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.getById(parseId(req), actorOf(req));
    res.json(user);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, formatZodErrors(parsed.error));
      return;
    }

    const user = await UserService.create(parsed.data, actorOf(req));
    res.status(201).json(user);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, formatZodErrors(parsed.error));
      return;
    }

    const user = await UserService.update(parseId(req), parsed.data, actorOf(req));
    res.json(user);
  });

  static softDelete = asyncHandler(async (req: Request, res: Response) => {
    const parsed = deleteUserSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, formatZodErrors(parsed.error));
      return;
    }

    const user = await UserService.softDelete(
      parseId(req),
      actorOf(req),
      parsed.data.reason,
      parsed.data.version
    );
    res.json(user);
  });

  static restore = asyncHandler(async (req: Request, res: Response) => {
    const parsed = restoreUserSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, formatZodErrors(parsed.error));
      return;
    }

    const user = await UserService.restore(
      parseId(req),
      actorOf(req),
      parsed.data.version
    );
    res.json(user);
  });

  /** @deprecated استخدم PUT /api/users/:id */
  static updateRole = asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, formatZodErrors(parsed.error));
      return;
    }

    const user = await UserService.updateRole(
      parseId(req),
      parsed.data.role,
      actorOf(req),
      parsed.data.version
    );
    res.json(user);
  });
}
