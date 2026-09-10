import cron from "node-cron";
import { prisma } from "../config/prisma";

export function startOverdueTasksJob() {
  cron.schedule("*/15 * * * *", async () => {
    const result = await prisma.task.updateMany({
      where: {
        dueDate: { lt: new Date() },
        isOverdue: false,
        status: { not: "DONE" },
      },
      data: { isOverdue: true },
    });

    if (result.count > 0) {
      console.log(`[overdue-job] flagged ${result.count} task(s) as overdue`);
    }
  });
}
