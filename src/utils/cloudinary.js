import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { envConfig } from "../config/env.config.js";

cloudinary.config({
    cloud_name: envConfig.cloudinaryName,
    api_key: envConfig.cloudinaryApiKey,
    api_secret: envConfig.cloudinaryApiSecret
});

const uploadOnCloudinary = async (filePath) => {
    try {
        if (!filePath) {
            return null;
        }

        if (!fs.existsSync(filePath)) {
            return null;
        }
        
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto"
        });
        
        try {
            fs.unlinkSync(filePath);
        } catch (unlinkError) {
            // Silently handle file deletion errors
        }
        
        return response;

    } catch (error) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (unlinkError) {
            // Silently handle file deletion errors
        }
        
        return null;
    }
}

export { uploadOnCloudinary }
