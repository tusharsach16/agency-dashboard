import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { initSockets } from "./sockets";
import { startOverdueTasksJob } from "./jobs/overdueTasks.job";

const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

const httpServer = createServer(app);
initSockets(httpServer);
startOverdueTasksJob();

httpServer.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
