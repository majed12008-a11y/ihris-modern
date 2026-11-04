import { Request, Response } from "express";
import { SalaryService } from "../services/salary.service";
import { asyncHandler } from "../middleware/error";

export class SalaryController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const filter = {
      personId: req.query.personId ? parseInt(req.query.personId as string, 10) : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
    };

    const result = await SalaryService.list(filter);
    res.json(result);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const salary = await SalaryService.getById(id);
    res.json(salary);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const salary = await SalaryService.create(req.body);
    res.status(201).json(salary);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const salary = await SalaryService.update(id, req.body);
    res.json(salary);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await SalaryService.delete(id);
    res.status(204).send();
  });
}
