import { Request, Response } from "express";
import { z } from "zod";
import { Actor, ReferenceDataService, ReferenceEntityType } from "../services/referenceData.service";
import { asyncHandler } from "../middleware/error";
import { AuthRequest } from "../middleware/auth";
import { notFound, sendValidationError } from "../lib/httpError";
import {
  createCadreSchema,
  createClassificationSchema,
  createPositionTypeSchema,
  createSalaryGradeSchema,
  createSalarySourceSchema,
  formatReferenceZodErrors,
  idParamSchema,
  updateCadreSchema,
  updateClassificationSchema,
  updatePositionTypeSchema,
  updateSalaryGradeSchema,
  updateSalarySourceSchema,
} from "../services/referenceData.validation";

interface EntityRoute {
  entityType: ReferenceEntityType;
  createSchema: z.ZodTypeAny;
  updateSchema: z.ZodTypeAny;
}

/**
 * خريطة المسارات (kebab-case) → نوع الكيان + مخططات التحقق.
 * مسار واحد لكل كيان تحت /api/reference.
 */
const ENTITIES: Record<string, EntityRoute> = {
  "salary-grades": {
    entityType: "salary_grade",
    createSchema: createSalaryGradeSchema,
    updateSchema: updateSalaryGradeSchema,
  },
  cadres: {
    entityType: "cadre",
    createSchema: createCadreSchema,
    updateSchema: updateCadreSchema,
  },
  classifications: {
    entityType: "classification",
    createSchema: createClassificationSchema,
    updateSchema: updateClassificationSchema,
  },
  "position-types": {
    entityType: "position_type",
    createSchema: createPositionTypeSchema,
    updateSchema: updatePositionTypeSchema,
  },
  "salary-sources": {
    entityType: "salary_source",
    createSchema: createSalarySourceSchema,
    updateSchema: updateSalarySourceSchema,
  },
};

function resolveEntity(req: Request): EntityRoute {
  const route = ENTITIES[req.params.entity];
  if (!route) throw notFound("نوع البيانات المرجعية غير معروف");
  return route;
}

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
    const err: any = new Error("معرّف غير صالح");
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

export class ReferenceController {
  /** GET /api/reference/:entity */
  static list = asyncHandler(async (req: Request, res: Response) => {
    const { entityType } = resolveEntity(req);
    const result = await ReferenceDataService.list(entityType, {
      page: optionalInt(req.query.page) ?? 1,
      limit: optionalInt(req.query.limit) ?? 20,
      search: (req.query.search as string) || undefined,
    });
    res.json(result);
  });

  /** GET /api/reference/:entity/:id */
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { entityType } = resolveEntity(req);
    res.json(await ReferenceDataService.getById(entityType, parseId(req)));
  });

  /** POST /api/reference/:entity */
  static create = asyncHandler(async (req: Request, res: Response) => {
    const { entityType, createSchema } = resolveEntity(req);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, formatReferenceZodErrors(parsed.error));
      return;
    }

    const record = await ReferenceDataService.create(
      entityType,
      parsed.data as Record<string, unknown>,
      actorOf(req)
    );
    res.status(201).json(record);
  });

  /** PUT /api/reference/:entity/:id */
  static update = asyncHandler(async (req: Request, res: Response) => {
    const { entityType, updateSchema } = resolveEntity(req);
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, formatReferenceZodErrors(parsed.error));
      return;
    }

    const record = await ReferenceDataService.update(
      entityType,
      parseId(req),
      parsed.data as Record<string, unknown>,
      actorOf(req)
    );
    res.json(record);
  });

  /** DELETE /api/reference/:entity/:id */
  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { entityType } = resolveEntity(req);
    const result = await ReferenceDataService.delete(
      entityType,
      parseId(req),
      actorOf(req)
    );
    res.json(result);
  });
}
