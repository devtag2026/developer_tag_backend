import dotenv from 'dotenv';
dotenv.config();

export const envConfig = {
    port: process.env.PORT,
    dbUrl: process.env.MONGODB_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiry: process.env.JWT_EXPIRY,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY,

    // cloudinary
    cloudinaryName: process.env.CLOUDINARY_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

    // resend
    resendApiKey: process.env.RESEND_API_KEY,

    // cors
    corsOrigin: process.env.CORS_ORIGIN,

    // admin email
    adminEmail: process.env.ADMIN_EMAIL,
    adminPassword: process.env.ADMIN_PASSWORD,
    adminName: process.env.ADMIN_NAME,

    // from email
    fromEmail: process.env.FROM_EMAIL,

    // max upload size
    maxUploadSize: process.env.MAX_UPLOAD_SIZE,

    // node env
    nodeEnv: process.env.NODE_ENV,

    // db name
    dbName: process.env.DB_NAME,

    // db url
    dbUrl: process.env.MONGODB_URL,

  

}