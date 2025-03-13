import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connections = await mongoose.connect(process.env.MONGODB_URL, {
            dbName: DB_NAME,
        }
        )
        console.log(`MongoDb connected Successfully!!`)
    } catch (error) {
        console.log("Mongodb connection failed :", error.message);
        process.exit(1);
    }
}

export { connectDB }