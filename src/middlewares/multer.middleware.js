import path from "path";
import crypto from "crypto";
import multer from "multer";
import fs from "fs";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const destPath = "./public/temp";
        console.log("📁 [MULTER] Setting destination:", destPath);
        console.log("📁 [MULTER] File fieldname:", file.fieldname);
        console.log("📁 [MULTER] File originalname:", file.originalname);
        
        // Ensure directory exists
        if (!fs.existsSync(destPath)) {
            console.log("📁 [MULTER] Creating directory:", destPath);
            fs.mkdirSync(destPath, { recursive: true });
        }
        
        cb(null, destPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
        const ext = path.extname(file.originalname);
        const filename = file.fieldname + '-' + uniqueSuffix + ext;
        console.log("📁 [MULTER] Generated filename:", filename);
        cb(null, filename);
    }
});

// Make max upload size configurable; default to 20MB
const maxFileSizeMb = Number(process.env.MAX_UPLOAD_MB) || 20;

export const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        console.log("📁 [MULTER] File filter called");
        console.log("📁 [MULTER] File details:", {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            encoding: file.encoding
        });
        cb(null, true);
    },
    limits: {
        fileSize: maxFileSizeMb * 1024 * 1024,
    },
    onError: function(err, next) {
        console.error("❌ [MULTER] Error occurred:", err.message);
        console.error("❌ [MULTER] Error stack:", err.stack);
        next(err);
    }
});

// Middleware to log after Multer processes the file
export const logMulterResult = (req, res, next) => {
    console.log("📁 [MULTER RESULT] Multer processing completed");
    console.log("📁 [MULTER RESULT] req.files:", req.files ? JSON.stringify(Object.keys(req.files)) : "undefined");
    
    if (req.files) {
        Object.keys(req.files).forEach(fieldname => {
            const files = req.files[fieldname];
            files.forEach((file, index) => {
                console.log(`📁 [MULTER RESULT] File ${index} in field '${fieldname}':`, {
                    fieldname: file.fieldname,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    path: file.path,
                    destination: file.destination,
                    filename: file.filename
                });
                
                // Verify file exists on disk
                if (file.path) {
                    const fileExists = fs.existsSync(file.path);
                    console.log(`📁 [MULTER RESULT] File exists on disk: ${fileExists}`);
                    if (fileExists) {
                        try {
                            const stats = fs.statSync(file.path);
                            console.log(`📁 [MULTER RESULT] File stats:`, {
                                size: stats.size,
                                sizeKB: (stats.size / 1024).toFixed(2),
                                isFile: stats.isFile()
                            });
                        } catch (statError) {
                            console.error(`❌ [MULTER RESULT] Error getting file stats:`, statError.message);
                        }
                    } else {
                        console.error(`❌ [MULTER RESULT] File does not exist at path: ${file.path}`);
                        console.error(`❌ [MULTER RESULT] Current working directory: ${process.cwd()}`);
                    }
                }
            });
        });
    }
    
    console.log("📁 [MULTER RESULT] req.body:", JSON.stringify(req.body));
    next();
};


