import { app } from "../src/app.js";
import { connectDB } from "../src/db/index.js";

// Connect to database
let isConnected = false;
let connectionPromise = null;

const connectToDB = async () => {
    if (!isConnected && !connectionPromise) {
        connectionPromise = connectDB()
            .then(() => {
                isConnected = true;
                console.log("Database connected successfully");
            })
            .catch((error) => {
                console.error("Database connection failed:", error.message);
                // Reset connection promise so it can be retried
                connectionPromise = null;
            });
    }
    return connectionPromise;
};

// Connect to database on cold start (don't await to avoid blocking)
connectToDB();

// Export the app for Vercel
export default app;
