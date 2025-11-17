import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { connectDB } from "../db/index.js";

const seedUsers = async () => {
    try {
        // Connect to database
        await connectDB();

        // Admin user credentials
        const adminEmail = process.env.ADMIN_EMAIL || "admin@developertag.com";
        const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
        const adminName = process.env.ADMIN_NAME || "Admin User";

        console.log("Creating admin user...");
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log(`Name: ${adminName}`);

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ 
            email: adminEmail,
            role: "admin"
        });

        if (existingAdmin) {
            console.log("Admin user already exists. Updating password...");
            existingAdmin.password = adminPassword; // Will be hashed by pre-save hook
            existingAdmin.fullName = adminName;
            await existingAdmin.save();
            console.log("✅ Admin user updated successfully!");
            console.log(`Email: ${adminEmail}`);
            console.log(`Password: ${adminPassword}`);
        } else {
            // Create new admin user
            const adminUser = await User.create({
                fullName: adminName,
                email: adminEmail,
                password: adminPassword, // Will be hashed by pre-save hook
                role: "admin"
            });

            console.log("✅ Admin user created successfully!");
            console.log(`Email: ${adminEmail}`);
            console.log(`Password: ${adminPassword}`);
            console.log(`User ID: ${adminUser._id}`);
        }

        // Display all admin users
        const allAdmins = await User.find({ role: "admin" }).select("-password -refreshToken");
        console.log("\n📋 All Admin Users:");
        allAdmins.forEach((admin, index) => {
            console.log(`${index + 1}. ${admin.fullName} (${admin.email}) - Created: ${admin.createdAt}`);
        });

        console.log("\n✅ User seeding completed!");

        // Close database connection
        await mongoose.connection.close();
        console.log("Database connection closed.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding users:", error);
        process.exit(1);
    }
};

// Run the seed function
seedUsers();

