import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { asyncHandler } from "../middleware/error";

export class UserController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const filter = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      search: req.query.search as string | undefined,
    };

    const result = await UserService.list(filter);
    res.json(result);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.create(req.body);
    res.status(201).json(user);
  });

  static updateRole = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id, 10);
    const { role } = req.body;
    await UserService.updateRole(userId, role);
    res.json({ success: true });
  });
}
