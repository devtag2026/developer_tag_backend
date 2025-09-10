import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js"


const app = express();

app.disable("x-powered-by")

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
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

app.use("/api/v1/users", userRouter)
app.use("/api/v1/testimonials", testimonialRouter)
app.use("/api/v1/portfolio", portfolioRouter)
app.use("/api/v1/forms", formRouter)
app.use("/api/v1/services", serviceRouter)

// 404 handler
app.use(notFoundHandler)

// Centralized error handler
app.use(errorHandler)

export { app }

// 4E15BF