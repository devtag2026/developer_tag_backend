import path from "path";
import crypto from "crypto";
import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const destPath = "./public/temp";
        console.log("📁 [MULTER] Setting destination:", destPath);
        console.log("📁 [MULTER] File fieldname:", file.fieldname);
        console.log("📁 [MULTER] File originalname:", file.originalname);
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
        next(err);
    }
});


