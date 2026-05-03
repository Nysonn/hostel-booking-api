import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { clerkMiddleware } from "@clerk/express";
import { errorHandler } from "./middlewares/error";
import rootRouter from "./routes/index";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:8080"],
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(clerkMiddleware());

app.use("/api", rootRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

export default app;
