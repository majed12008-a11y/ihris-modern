import { Request, Response } from "express";
import { PersonService } from "../services/person.service";
import { asyncHandler } from "../middleware/error";

export class PersonController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const filter = {
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
    };

    const result = await PersonService.list(filter);
    res.json(result);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const person = await PersonService.getById(id);
    res.json(person);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const person = await PersonService.create(req.body);
    res.status(201).json(person);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const person = await PersonService.update(id, req.body);
    res.json(person);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await PersonService.delete(id);
    res.status(204).send();
  });
}
