import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js"

const app = express();

app.disable("x-powered-by")

app.use(cors({ origin: "*" }))

// ─── Stripe Webhook — must be registered BEFORE express.json() ───────────────
import subscriptionRouter from "./routes/subscription.route.js"
app.use("/api/v1/subscriptions/webhook", express.raw({ type: "application/json" }))

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


// ─── Existing Routes ──────────────────────────────────────────────────────────
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

// ─── New Payment Feature Routes ───────────────────────────────────────────────
import contractRouter from "./routes/contract.route.js"
// import invoiceRouter from "./routes/invoice.route.js"
// import reminderRouter from "./routes/reminder.route.js"

app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/contracts", contractRouter)
// app.use("/api/v1/invoices", invoiceRouter)
// app.use("/api/v1/reminders", reminderRouter)

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.send("Welcome to DeveloperTag Backend API")
})

// ─── Error Handlers ───────────────────────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

export { app }