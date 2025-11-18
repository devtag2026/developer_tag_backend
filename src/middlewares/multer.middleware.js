import path from "path";
import crypto from "crypto";
import multer from "multer";
import fs from "fs";

// Determine the appropriate temp directory based on environment
// Vercel/serverless environments use /tmp, local uses ./public/temp
const getTempDirectory = () => {
    // Check if we're in a serverless environment (Vercel, AWS Lambda, etc.)
    // Vercel sets VERCEL=1, AWS Lambda sets AWS_LAMBDA_FUNCTION_NAME
    const isServerless = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    if (isServerless) {
        // Serverless environments have /tmp directory that's writable
        const tmpPath = '/tmp';
        console.log("📁 [MULTER] Using serverless temp directory:", tmpPath);
        return tmpPath;
    } else {
        // Local development uses ./public/temp
        const localPath = "./public/temp";
        console.log("📁 [MULTER] Using local temp directory:", localPath);
        return localPath;
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const destPath = getTempDirectory();
        console.log("📁 [MULTER] Setting destination:", destPath);
        console.log("📁 [MULTER] File fieldname:", file.fieldname);
        console.log("📁 [MULTER] File originalname:", file.originalname);
        console.log("📁 [MULTER] Environment check:", {
            VERCEL: !!process.env.VERCEL,
            AWS_LAMBDA: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
            NODE_ENV: process.env.NODE_ENV
        });
        
        // Ensure directory exists
        try {
            if (!fs.existsSync(destPath)) {
                console.log("📁 [MULTER] Creating directory:", destPath);
                fs.mkdirSync(destPath, { recursive: true });
                console.log("✅ [MULTER] Directory created successfully");
            } else {
                console.log("✅ [MULTER] Directory already exists");
            }
        } catch (mkdirError) {
            console.error("❌ [MULTER] Error creating directory:", {
                path: destPath,
                error: mkdirError.message,
                code: mkdirError.code
            });
            // Try to use /tmp as fallback if local directory fails
            if (destPath !== '/tmp') {
                console.log("📁 [MULTER] Falling back to /tmp directory");
                const fallbackPath = '/tmp';
                try {
                    if (!fs.existsSync(fallbackPath)) {
                        fs.mkdirSync(fallbackPath, { recursive: true });
                    }
                    cb(null, fallbackPath);
                    return;
                } catch (fallbackError) {
                    console.error("❌ [MULTER] Fallback directory also failed:", fallbackError.message);
                }
            }
            cb(mkdirError);
            return;
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


