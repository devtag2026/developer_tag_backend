import { app } from "./app.js";
import dotenv from "dotenv";
import { connectDB } from "./db/index.js";

dotenv.config({
    path: "./env",
});

// Process-level guards
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
});

connectDB()
    .then(() => {
        const port = process.env.PORT || 5000

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`)
        })

        app.on("error", (err) => {
            console.error("Error occurred in app :", err.message)
        })
    })
    .catch((err) => {
        console.log("Error occurred in mongoDb connection ", err.message)
        process.exit(1)
    })
