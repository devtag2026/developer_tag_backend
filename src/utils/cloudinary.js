import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { envConfig } from "../config/env.config.js";

// Log Cloudinary configuration on module load
console.log("☁️  [CLOUDINARY INIT] Initializing Cloudinary configuration...");
console.log("☁️  [CLOUDINARY INIT] Environment variables:", {
    cloudinaryName: envConfig.cloudinaryName ? `${envConfig.cloudinaryName.substring(0, 4)}...` : "MISSING",
    cloudinaryApiKey: envConfig.cloudinaryApiKey ? `${envConfig.cloudinaryApiKey.substring(0, 4)}...` : "MISSING",
    cloudinaryApiSecret: envConfig.cloudinaryApiSecret ? "SET" : "MISSING"
});

cloudinary.config({
    cloud_name: envConfig.cloudinaryName,
    api_key: envConfig.cloudinaryApiKey,
    api_secret: envConfig.cloudinaryApiSecret
});

// Verify configuration after setting
const config = cloudinary.config();
if (config.cloud_name && config.api_key && config.api_secret) {
    console.log("✅ [CLOUDINARY INIT] Configuration loaded successfully");
} else {
    console.error("❌ [CLOUDINARY INIT] Configuration incomplete - check environment variables");
    console.error("❌ [CLOUDINARY INIT] Missing:", {
        cloud_name: !config.cloud_name,
        api_key: !config.api_key,
        api_secret: !config.api_secret
    });
}

const uploadOnCloudinary = async (filePath) => {
    console.log("☁️  [CLOUDINARY] Starting upload process");
    console.log("☁️  [CLOUDINARY] File path:", filePath);
    
    try {
        // Check Cloudinary configuration
        const cloudName = cloudinary.config().cloud_name;
        const apiKey = cloudinary.config().api_key;
        const hasApiSecret = !!cloudinary.config().api_secret;
        
        console.log("☁️  [CLOUDINARY] Configuration check:", {
            cloudName: cloudName || "MISSING",
            apiKey: apiKey ? `${apiKey.substring(0, 4)}...` : "MISSING",
            hasApiSecret: hasApiSecret ? "SET" : "MISSING"
        });
        
        if (!filePath) {
            console.error("❌ [CLOUDINARY] File path is null or undefined");
            return null;
        }

        console.log("☁️  [CLOUDINARY] Checking if file exists...");
        if (!fs.existsSync(filePath)) {
            console.error("❌ [CLOUDINARY] File does not exist at path:", filePath);
            console.error("❌ [CLOUDINARY] Current working directory:", process.cwd());
            return null;
        }
        
        // Get file stats
        const fileStats = fs.statSync(filePath);
        console.log("☁️  [CLOUDINARY] File stats:", {
            size: fileStats.size,
            sizeKB: (fileStats.size / 1024).toFixed(2),
            sizeMB: (fileStats.size / (1024 * 1024)).toFixed(2),
            isFile: fileStats.isFile(),
            isDirectory: fileStats.isDirectory()
        });
        
        console.log("☁️  [CLOUDINARY] Uploading to Cloudinary...");
        const uploadStartTime = Date.now();
        
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto"
        });
        
        const uploadDuration = Date.now() - uploadStartTime;
        console.log("✅ [CLOUDINARY] Upload successful");
        console.log("✅ [CLOUDINARY] Upload duration:", uploadDuration + "ms");
        console.log("✅ [CLOUDINARY] Response:", {
            public_id: response.public_id,
            url: response.url?.substring(0, 100) + "...",
            secure_url: response.secure_url?.substring(0, 100) + "...",
            format: response.format,
            width: response.width,
            height: response.height,
            bytes: response.bytes,
            resource_type: response.resource_type
        });
        
        console.log("🗑️  [CLOUDINARY] Deleting temporary file...");
        try {
            fs.unlinkSync(filePath);
            console.log("✅ [CLOUDINARY] Temporary file deleted successfully");
        } catch (unlinkError) {
            console.warn("⚠️  [CLOUDINARY] Failed to delete temporary file:", unlinkError.message);
        }
        
        return response;

    } catch (error) {
        console.error("❌ [CLOUDINARY] Upload error occurred");
        console.error("❌ [CLOUDINARY] Error details:", {
            name: error.name,
            message: error.message,
            http_code: error.http_code,
            http_code_text: error.http_code_text,
            error: error.error,
            stack: error.stack
        });
        
        // Try to clean up file
        try {
            if (fs.existsSync(filePath)) {
                console.log("🗑️  [CLOUDINARY] Attempting to delete temporary file after error...");
                fs.unlinkSync(filePath);
                console.log("✅ [CLOUDINARY] Temporary file deleted after error");
            }
        } catch (unlinkError) {
            console.warn("⚠️  [CLOUDINARY] Failed to delete temporary file after error:", unlinkError.message);
        }
        
        return null;
    }
}

export { uploadOnCloudinary }
