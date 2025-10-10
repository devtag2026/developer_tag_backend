import { app } from "./app.js";
import dotenv from "dotenv";
import { connectDB } from "./db/index.js";

dotenv.config();

// Process-level guards
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
});

// Connect to database
connectDB()
    .then(() => {
        // Only start server in development
        if (process.env.NODE_ENV !== 'production') {
            const port = process.env.PORT || 5000;
            app.listen(port, () => {
                console.log(`Server is running on port ${port}`);
            });
        }
    })
    .catch((err) => {
        console.log("Error occurred in mongoDb connection ", err.message);
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    });

// Export for Vercel
export default app;
