import path from "path";
import crypto from "crypto";
import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

export const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        console.log("Multer fileFilter - file:", file);
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});
