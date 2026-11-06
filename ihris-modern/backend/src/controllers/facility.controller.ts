import { Request, Response } from "express";
import { FacilityService, Actor } from "../services/facility.service";
import { asyncHandler } from "../middleware/error";
import { AuthRequest } from "../middleware/auth";
import { sendValidationError } from "../lib/httpError";
import {
  createFacilitySchema,
  formatFacilityZodErrors,
  idParamSchema,
  updateFacilitySchema,
} from "../services/facility.validation";

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
    const err: any = new Error("معرّف المنشأة غير صالح");
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

export class FacilityController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const result = await FacilityService.list({
      page: optionalInt(req.query.page) ?? 1,
      limit: optionalInt(req.query.limit) ?? 20,
      search: (req.query.search as string) || undefined,
    });
    res.json(result);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const facility = await FacilityService.getById(parseId(req));
    res.json(facility);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const parsed = createFacilitySchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, formatFacilityZodErrors(parsed.error));
      return;
    }

    const facility = await FacilityService.create(parsed.data, actorOf(req));
    res.status(201).json(facility);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateFacilitySchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, formatFacilityZodErrors(parsed.error));
      return;
    }

    const facility = await FacilityService.update(
      parseId(req),
      parsed.data,
      actorOf(req)
    );
    res.json(facility);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const result = await FacilityService.delete(parseId(req), actorOf(req));
    res.json(result);
  });

  // ------------------------------------------------------------
  // بيانات مرجعية للتسلسل الجغرافي
  // ------------------------------------------------------------

  static countries = asyncHandler(async (_req: Request, res: Response) => {
    res.json(await FacilityService.countries());
  });

  static districts = asyncHandler(async (req: Request, res: Response) => {
    res.json(await FacilityService.districts(optionalInt(req.query.countryId)));
  });

  static counties = asyncHandler(async (req: Request, res: Response) => {
    res.json(await FacilityService.counties(optionalInt(req.query.districtId)));
  });

  static regions = asyncHandler(async (_req: Request, res: Response) => {
    res.json(await FacilityService.regions());
  });

  static facilityTypes = asyncHandler(async (_req: Request, res: Response) => {
    res.json(await FacilityService.facilityTypes());
  });
}
