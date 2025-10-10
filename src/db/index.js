import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const url = process.env.MONGODB_URL || process.env.MONGODB_URI;
        
        if (!url) {
            console.log("❌ No MongoDB URL found in environment variables");
            return;
        }
        
        const masked = typeof url === "string" ? url.replace(/:\w+@/, ":****@") : "";
        console.log("Connecting to MongoDB:", masked);

        const connections = await mongoose.connect(url, {
            dbName: DB_NAME,
            serverSelectionTimeoutMS: 10000, // Reduced timeout for Vercel
            connectTimeoutMS: 10000, // Reduced timeout for Vercel
            socketTimeoutMS: 20000, // Reduced timeout for Vercel
            family: 4,
            retryWrites: true,
            w: 'majority'
        });
        console.log(`MongoDb connected Successfully!!`)
        return connections;
    } catch (error) {
        console.log("Mongodb connection failed :", error.message);
        // Don't exit process in serverless environment
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
        throw error;
    }
}
export { connectDB }