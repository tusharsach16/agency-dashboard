import { Request, Response, NextFunction } from "express";
import { getAuthorizedActivities } from "../services/activity.service";

export async function listActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { projectId } = req.query as { projectId?: string };
    const activities = await getAuthorizedActivities(user, projectId);
    res.json({ success: true, activities });
  } catch (err) {
    next(err);
  }
}
