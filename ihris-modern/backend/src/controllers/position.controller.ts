import { Request, Response } from "express";
import { PositionService } from "../services/position.service";
import { asyncHandler } from "../middleware/error";

export class PositionController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const filter = {
      search: req.query.search as string | undefined,
      facilityId: req.query.facilityId ? parseInt(req.query.facilityId as string, 10) : undefined,
      jobId: req.query.jobId ? parseInt(req.query.jobId as string, 10) : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
    };

    const result = await PositionService.list(filter);
    res.json(result);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const position = await PositionService.getById(id);
    res.json(position);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const position = await PositionService.create(req.body);
    res.status(201).json(position);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const position = await PositionService.update(id, req.body);
    res.json(position);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await PositionService.delete(id);
    res.status(204).send();
  });
}
