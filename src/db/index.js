import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const url = process.env.MONGODB_URL || process.env.MONGODB_URI;
        const masked = typeof url === "string" ? url.replace(/:\w+@/, ":****@") : "";
        console.log("Connecting to MongoDB:", masked);

        const connections = await mongoose.connect(url, {
            dbName: DB_NAME,
            serverSelectionTimeoutMS: 30000, // Increased timeout
            connectTimeoutMS: 30000, // Added connection timeout
            socketTimeoutMS: 45000, // Added socket timeout
            family: 4,
            retryWrites: true,
            w: 'majority'
        });
        console.log(`MongoDb connected Successfully!!`)
    } catch (error) {
        console.log("Mongodb connection failed :", error.message);
        console.log("Full error:", error);
        process.exit(1);
    }
}
export { connectDB }