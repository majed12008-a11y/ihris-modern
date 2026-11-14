import { Request, Response } from "express";
import { z } from "zod";
import { TrainingService, Actor } from "../services/training.service";
import { asyncHandler } from "../middleware/error";
import { AuthRequest } from "../middleware/auth";
import { badRequest, sendValidationError } from "../lib/httpError";
import {
  createCourseSchema,
  createInstitutionSchema,
  createScheduledSchema,
  enrollSchema,
  formatTrainingZodErrors,
  idParamSchema,
  updateCourseSchema,
  updateEnrollmentSchema,
  updateInstitutionSchema,
  updateScheduledSchema,
} from "../services/training.validation";

/**
 * ADR-009 — متحكم وحدة التدريب.
 * كل المدخلات تمر عبر Zod `.strict()` (منع Mass Assignment).
 */

function actorOf(req: Request): Actor {
  const user = (req as AuthRequest).user;
  if (!user) throw badRequest("Unauthorized");
  return user;
}

function parseId(req: Request, param = "id"): number {
  const parsed = idParamSchema.safeParse(parseInt(req.params[param], 10));
  if (!parsed.success) throw badRequest("معرّف غير صالح");
  return parsed.data;
}

function optionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) || n <= 0 ? undefined : n;
}

function parse<T extends z.ZodTypeAny>(schema: T, body: unknown, res: Response): z.infer<T> | null {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    sendValidationError(res, formatTrainingZodErrors(parsed.error));
    return null;
  }
  return parsed.data;
}

export class TrainingController {
  // ---------------------------------------------------------------- courses
  static listCourses = asyncHandler(async (req: Request, res: Response) => {
    const courses = await TrainingService.listCourses({
      search: (req.query.search as string) || undefined,
      includeDeleted: req.query.includeDeleted === "true",
    });
    res.json(courses);
  });

  static getCourse = asyncHandler(async (req: Request, res: Response) => {
    res.json(await TrainingService.getCourse(parseId(req)));
  });

  static createCourse = asyncHandler(async (req: Request, res: Response) => {
    const data = parse(createCourseSchema, req.body, res);
    if (!data) return;
    res.status(201).json(await TrainingService.createCourse(data, actorOf(req)));
  });

  static updateCourse = asyncHandler(async (req: Request, res: Response) => {
    const data = parse(updateCourseSchema, req.body, res);
    if (!data) return;
    res.json(await TrainingService.updateCourse(parseId(req), data, actorOf(req)));
  });

  static deleteCourse = asyncHandler(async (req: Request, res: Response) => {
    res.json(await TrainingService.deleteCourse(parseId(req), actorOf(req)));
  });

  // ---------------------------------------------------------------- institutions
  static listInstitutions = asyncHandler(async (req: Request, res: Response) => {
    const institutions = await TrainingService.listInstitutions({
      search: (req.query.search as string) || undefined,
    });
    res.json(institutions);
  });

  static getInstitution = asyncHandler(async (req: Request, res: Response) => {
    res.json(await TrainingService.getInstitution(parseId(req)));
  });

  static createInstitution = asyncHandler(async (req: Request, res: Response) => {
    const data = parse(createInstitutionSchema, req.body, res);
    if (!data) return;
    res.status(201).json(await TrainingService.createInstitution(data.name, actorOf(req)));
  });

  static updateInstitution = asyncHandler(async (req: Request, res: Response) => {
    const data = parse(updateInstitutionSchema, req.body, res);
    if (!data) return;
    res.json(
      await TrainingService.updateInstitution(
        parseId(req),
        data.name,
        data.version,
        actorOf(req)
      )
    );
  });

  static deleteInstitution = asyncHandler(async (req: Request, res: Response) => {
    res.json(await TrainingService.deleteInstitution(parseId(req), actorOf(req)));
  });

  // ---------------------------------------------------------------- scheduled courses
  static listScheduled = asyncHandler(async (req: Request, res: Response) => {
    res.json(
      await TrainingService.listScheduled({
        trainingCourseId: optionalInt(req.query.trainingCourseId),
      })
    );
  });

  static getScheduled = asyncHandler(async (req: Request, res: Response) => {
    res.json(await TrainingService.getScheduled(parseId(req)));
  });

  static createScheduled = asyncHandler(async (req: Request, res: Response) => {
    const data = parse(createScheduledSchema, req.body, res);
    if (!data) return;
    res.status(201).json(await TrainingService.createScheduled(data, actorOf(req)));
  });

  static updateScheduled = asyncHandler(async (req: Request, res: Response) => {
    const data = parse(updateScheduledSchema, req.body, res);
    if (!data) return;
    res.json(await TrainingService.updateScheduled(parseId(req), data, actorOf(req)));
  });

  static deleteScheduled = asyncHandler(async (req: Request, res: Response) => {
    res.json(await TrainingService.deleteScheduled(parseId(req), actorOf(req)));
  });

  // ---------------------------------------------------------------- enrollments
  static listEnrollments = asyncHandler(async (req: Request, res: Response) => {
    res.json(await TrainingService.listEnrollments(parseId(req)));
  });

  static enroll = asyncHandler(async (req: Request, res: Response) => {
    const data = parse(enrollSchema, req.body, res);
    if (!data) return;
    res.status(201).json(await TrainingService.enroll(parseId(req), data, actorOf(req)));
  });

  static updateEnrollment = asyncHandler(async (req: Request, res: Response) => {
    const data = parse(updateEnrollmentSchema, req.body, res);
    if (!data) return;
    res.json(await TrainingService.updateEnrollment(parseId(req), data, actorOf(req)));
  });

  static deleteEnrollment = asyncHandler(async (req: Request, res: Response) => {
    res.json(await TrainingService.deleteEnrollment(parseId(req), actorOf(req)));
  });

  // ---------------------------------------------------------------- lookups
  static listStatuses = asyncHandler(async (_req: Request, res: Response) => {
    res.json(await TrainingService.listStatuses());
  });

  static listCategories = asyncHandler(async (_req: Request, res: Response) => {
    res.json(await TrainingService.listCategories());
  });
}
