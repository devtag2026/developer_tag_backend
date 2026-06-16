import dotenv from "dotenv";
import { app } from "./app.js";
import { connectDB } from "./db/index.js";

dotenv.config();

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
});

connectDB()
    .then(() => {
        if (process.env.NODE_ENV !== "production") {
            const port = process.env.PORT || 8000;
            app.listen(port, () => {
                console.log(`Server is running on port ${port}`);
            });
        }
    })
    .catch((err) => {
        console.log("Error occurred in mongoDb connection ", err.message);
        if (process.env.NODE_ENV !== "production") {
            process.exit(1);
        }
    });

export default app;
