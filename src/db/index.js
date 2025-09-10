import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const url = process.env.MONGODB_URL;
        const masked = typeof url === "string" ? url.replace(/:\w+@/, ":****@") : "";
        console.log("Connecting to MongoDB:", masked);

        const connections = await mongoose.connect(url, {
            dbName: DB_NAME,
            serverSelectionTimeoutMS: 15000,
            family: 4,
        });
        console.log(`MongoDb connected Successfully!!`)
    } catch (error) {
        console.log("Mongodb connection failed :", error.message);
        process.exit(1);
    }
}
export { connectDB }