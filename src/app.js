import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js"

const app = express();

app.disable("x-powered-by")

// CORS configuration: support comma-separated origins or "*"
const corsEnv = "http://localhost:3000,http://localhost:3001,https://developertag.com,https://www.developertag.com,https://admin.developertag.com,https://developer-tag-admin.vercel.app/";
const allowedOrigins = corsEnv.split(",").map((o) => o.trim().replace(/\/$/, "")).filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Allow all origins if CORS_ORIGINS is "*"
        if (corsEnv === "*") {
            return callback(null, true);
        }
        
        // Normalize origin by removing trailing slash for comparison
        const normalizedOrigin = origin.replace(/\/$/, "");
        
        // Check if origin is in allowed list (with or without trailing slash)
        if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        console.log(`CORS blocked origin: ${origin} (normalized: ${normalizedOrigin})`);
        console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"]
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


// --------Routes--------

import userRouter from "./routes/user.route.js"
import testimonialRouter from "./routes/testimonial.route.js"
import portfolioRouter from "./routes/portfolio.route.js"
import formRouter from "./routes/form.route.js"
import serviceRouter from "./routes/service.route.js"
import statsRouter from "./routes/stats.route.js"
import careerRouter from "./routes/career.route.js"

app.use("/api/v1/users", userRouter)
app.use("/api/v1/testimonials", testimonialRouter)
app.use("/api/v1/portfolio", portfolioRouter)
app.use("/api/v1/forms", formRouter)
app.use("/api/v1/services", serviceRouter)
app.use("/api/v1/stats", statsRouter)
app.use("/api/v1/careers", careerRouter)

app.get("/", (req, res) => {
    res.send("Welcome to DeveloperTag Backend API")
})

// 404 handler
app.use(notFoundHandler)

// Centralized error handler
app.use(errorHandler)

export { app }

