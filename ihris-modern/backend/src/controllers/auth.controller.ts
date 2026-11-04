import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { asyncHandler } from "../middleware/error";

export class AuthController {
  static login = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);
    res.json(result);
  });

  static register = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    res.status(201).json(result);
  });

  static me = asyncHandler(async (req: any, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await (require("../lib/prisma").prisma as any).user.findUnique({
      where: { id: userId },
      include: { access: { include: { role: true } } },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.access?.[0]?.role?.name || "hr_staff",
    });
  });
}
