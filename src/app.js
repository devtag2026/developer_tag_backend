import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js"


const app = express();

app.disable("x-powered-by")

// CORS configuration: support comma-separated origins or "*"
const corsEnv = process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:3001";
const allowedOrigins = corsEnv.split(",").map((o) => o.trim()).filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // allow non-browser tools
        if (corsEnv === "*" || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


// --------Routes------

import userRouter from "./routes/user.route.js"
import testimonialRouter from "./routes/testimonial.route.js"
import portfolioRouter from "./routes/portfolio.route.js"
import formRouter from "./routes/form.route.js"
import serviceRouter from "./routes/service.route.js"
import statsRouter from "./routes/stats.route.js"

app.use("/api/v1/users", userRouter)
app.use("/api/v1/testimonials", testimonialRouter)
app.use("/api/v1/portfolio", portfolioRouter)
app.use("/api/v1/forms", formRouter)
app.use("/api/v1/services", serviceRouter)
app.use("/api/v1/stats", statsRouter)

app.get("/", (req, res) => {
    res.send("Welcome to DeveloperTag Backend API")
})

// 404 handler
app.use(notFoundHandler)

// Centralized error handler
app.use(errorHandler)

export { app }

// 4E15BF