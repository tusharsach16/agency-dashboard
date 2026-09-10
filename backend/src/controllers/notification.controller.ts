import { Request, Response, NextFunction } from "express";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service";
import { broadcastUnreadCountToUser } from "../services/notification-broadcast.service";

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(user.sub),
      getUnreadNotificationCount(user.sub),
    ]);

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const count = await getUnreadNotificationCount(user.sub);

    res.json({
      success: true,
      count,
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { id } = req.params;

    const notification = await markNotificationAsRead(user.sub, id);
    const newCount = await getUnreadNotificationCount(user.sub);

    broadcastUnreadCountToUser(user.sub, newCount);

    res.json({
      success: true,
      notification,
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const result = await markAllNotificationsAsRead(user.sub);

    broadcastUnreadCountToUser(user.sub, 0);

    res.json({
      success: true,
      count: result.count,
    });
  } catch (err) {
    next(err);
  }
}
