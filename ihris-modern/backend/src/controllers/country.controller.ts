import { Request, Response } from "express";
import { Actor, CountryService } from "../services/country.service";
import { asyncHandler } from "../middleware/error";
import { AuthRequest } from "../middleware/auth";
import { sendValidationError } from "../lib/httpError";
import {
  createCountrySchema,
  formatCountryZodErrors,
  idParamSchema,
  updateCountrySchema,
} from "../services/country.validation";

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
    const err: any = new Error("معرّف الدولة غير صالح");
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

export class CountryController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const result = await CountryService.list({
      page: optionalInt(req.query.page) ?? 1,
      limit: optionalInt(req.query.limit) ?? 20,
      search: (req.query.search as string) || undefined,
    });
    res.json(result);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    res.json(await CountryService.getById(parseId(req)));
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const parsed = createCountrySchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, formatCountryZodErrors(parsed.error));
      return;
    }

    const country = await CountryService.create(parsed.data, actorOf(req));
    res.status(201).json(country);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateCountrySchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, formatCountryZodErrors(parsed.error));
      return;
    }

    const country = await CountryService.update(
      parseId(req),
      parsed.data,
      actorOf(req)
    );
    res.json(country);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const result = await CountryService.delete(parseId(req), actorOf(req));
    res.json(result);
  });
}
