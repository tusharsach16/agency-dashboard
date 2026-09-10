import { Request, Response, NextFunction } from "express";
import { getDashboardStats, getFilteredDashboardData } from "../services/dashboard.service";
import { DashboardFilterParams } from "../types/dashboard";

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const stats = await getDashboardStats(user);
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
}

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const filters = req.query as unknown as DashboardFilterParams;
    const data = await getFilteredDashboardData(user, filters);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}
