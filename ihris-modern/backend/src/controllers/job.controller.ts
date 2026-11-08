import { Request, Response } from "express";
import { Actor, JobService } from "../services/job.service";
import { asyncHandler } from "../middleware/error";
import { AuthRequest } from "../middleware/auth";
import { sendValidationError } from "../lib/httpError";
import {
  createJobSchema,
  formatJobZodErrors,
  idParamSchema,
  updateJobSchema,
} from "../services/job.validation";

function actorOf(req: Request): Actor {
  const user = (req as AuthRequest).user;
  if (!user) {
    const err: any = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
  return user;
}

function parseId(req: Request): number {
  const parsed = idParamSchema.safeParse(parseInt(req.params.id, 10));
  if (!parsed.success) {
    const err: any = new Error("معرّف المسمى الوظيفي غير صالح");
    err.statusCode = 400;
    throw err;
  }
  return parsed.data;
}

function optionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) || n <= 0 ? undefined : n;
}

export class JobController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const result = await JobService.list({
      page: optionalInt(req.query.page) ?? 1,
      limit: optionalInt(req.query.limit) ?? 20,
      search: (req.query.search as string) || undefined,
    });
    res.json(result);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    res.json(await JobService.getById(parseId(req)));
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const parsed = createJobSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, formatJobZodErrors(parsed.error));
      return;
    }

    const job = await JobService.create(parsed.data, actorOf(req));
    res.status(201).json(job);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateJobSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, formatJobZodErrors(parsed.error));
      return;
    }

    const job = await JobService.update(parseId(req), parsed.data, actorOf(req));
    res.json(job);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const result = await JobService.delete(parseId(req), actorOf(req));
    res.json(result);
  });

  // ------------------------------------------------------------
  // بيانات مرجعية للـcascade
  // ------------------------------------------------------------

  static salaryGrades = asyncHandler(async (_req: Request, res: Response) => {
    res.json(await JobService.salaryGrades());
  });

  static cadres = asyncHandler(async (_req: Request, res: Response) => {
    res.json(await JobService.cadres());
  });

  static classifications = asyncHandler(async (_req: Request, res: Response) => {
    res.json(await JobService.classifications());
  });
}
