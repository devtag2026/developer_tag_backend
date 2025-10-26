import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.disable("x-powered-by");

// ✅ Allow all origins — public access
app.use(cors({
  origin: "*",                 // allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false           // must be false when origin is "*"
}));

// If you want to also manually set headers for safety:
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Body parsers & static
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// --------Routes------
import userRouter from "./routes/user.route.js";
import testimonialRouter from "./routes/testimonial.route.js";
import portfolioRouter from "./routes/portfolio.route.js";
import formRouter from "./routes/form.route.js";
import serviceRouter from "./routes/service.route.js";
import statsRouter from "./routes/stats.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/testimonials", testimonialRouter);
app.use("/api/v1/portfolio", portfolioRouter);
app.use("/api/v1/forms", formRouter);
app.use("/api/v1/services", serviceRouter);
app.use("/api/v1/stats", statsRouter);

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export { app };
