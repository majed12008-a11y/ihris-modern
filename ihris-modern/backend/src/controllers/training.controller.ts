import { Request, Response } from "express";
import { TrainingService } from "../services/training.service";
import { asyncHandler } from "../middleware/error";

export class TrainingController {
  static listCourses = asyncHandler(async (_req: Request, res: Response) => {
    const courses = await TrainingService.listCourses();
    res.json(courses);
  });

  static createCourse = asyncHandler(async (req: Request, res: Response) => {
    const course = await TrainingService.createCourse(req.body);
    res.status(201).json(course);
  });

  static listInstitutions = asyncHandler(async (_req: Request, res: Response) => {
    const institutions = await TrainingService.listInstitutions();
    res.json(institutions);
  });

  static createInstitution = asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;
    const institution = await TrainingService.createInstitution(name);
    res.status(201).json(institution);
  });

  static listStatuses = asyncHandler(async (_req: Request, res: Response) => {
    const statuses = await TrainingService.listStatuses();
    res.json(statuses);
  });

  static listCategories = asyncHandler(async (_req: Request, res: Response) => {
    const categories = await TrainingService.listCategories();
    res.json(categories);
  });
}
