import { Request, Response } from "express";
import { FacilityService } from "../services/facility.service";
import { asyncHandler } from "../middleware/error";

export class FacilityController {
  static list = asyncHandler(async (_req: Request, res: Response) => {
    const facilities = await FacilityService.list();
    res.json(facilities);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const facility = await FacilityService.getById(id);
    res.json(facility);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const facility = await FacilityService.create(req.body);
    res.status(201).json(facility);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const facility = await FacilityService.update(id, req.body);
    res.json(facility);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await FacilityService.delete(id);
    res.status(204).send();
  });
}
