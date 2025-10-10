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

// For Vercel deployment
let isConnected = false;

const connectToDB = async () => {
    if (!isConnected) {
        try {
            await connectDB();
            isConnected = true;
            console.log("Database connected successfully");
        } catch (error) {
            console.error("Database connection failed:", error.message);
        }
    }
};

// Connect to database on cold start
connectToDB();

// For local development
if (process.env.NODE_ENV !== 'production') {
    connectDB()
        .then(() => {
            const port = process.env.PORT || 5000;
            app.listen(port, () => {
                console.log(`Server is running on port ${port}`);
            });
        })
        .catch((err) => {
            console.log("Error occurred in mongoDb connection ", err.message);
            process.exit(1);
        });
}

// Export for Vercel
export default app;
