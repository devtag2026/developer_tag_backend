import mongoose from "mongoose";
import { Testimonial } from "../models/testimonial.model.js";
import { connectDB } from "../db/index.js";

const seedTestimonials = async () => {
    try {
        // Connect to database
        await connectDB();

        // Delete all existing testimonials
        await Testimonial.deleteMany({});
        console.log("Deleted all existing testimonials.");

        // Define all testimonials
        const testimonials = [
            {
                content: "I was blown away by how effortlessly the team turned our complex ideas into a seamless SaaS product. They didn't just deliver software they delivered peace of mind.",
                name: "John Miller",
                category: "Software Engineering SaaS"
            },
            {
                content: "From day one, their passion for building something meaningful showed. Our SaaS platform is now the backbone of our business, and we couldn't be happier.",
                name: "Sophia Lee",
                category: "Software Engineering SaaS"
            },
            {
                content: "They took our vision seriously and brought it to life with precision and care. The launch went off without a hitch thanks to their incredible dedication.",
                name: "David Kim",
                category: "Software Engineering SaaS"
            },
            {
                content: "The desktop app they crafted feels like it was made just for us intuitive, fast, and reliable. It's rare to find a team that truly listens and delivers beyond expectations.",
                name: "Emma Johnson",
                category: "Desktop Development"
            },
            {
                content: "I'm impressed by their attention to detail and commitment to quality. Our new desktop software runs smoother than anything we've had before.",
                name: "Michael Brown",
                category: "Desktop Development"
            },
            {
                content: "They didn't just build software; they built trust. Every update improved efficiency within our teams noticeably.",
                name: "Olivia Davis",
                category: "Desktop Development"
            },
            {
                content: "Watching users engage with the app we created together has been thrilling beautiful design paired with flawless function. Couldn't ask for more!",
                name: "Liam Smith",
                category: "App Development"
            },
            {
                content: "The app's launch was nerve-wracking until this team took control fast delivery, smart solutions, and an app that customers love.",
                name: "Isabella Rodriguez",
                category: "App Development"
            },
            {
                content: "Their creativity turned my rough ideas into a polished app that feels alive every feature works smoothly and intuitively.",
                name: "Noah Wilson",
                category: "App Development"
            },
            {
                content: "Our sales team actually enjoys using the CRM now! It's tailored perfectly to how we work simple yet powerful.",
                name: "Mia Anderson",
                category: "CRM Development"
            },
            {
                content: "Integrating their CRM was the smartest move we made this year it connected all our tools seamlessly and boosted customer happiness too.",
                name: "James Thompson",
                category: "CRM Development"
            },
            {
                content: "What I appreciate most is their ongoing support — they treat your product like their own baby and keep making it better every day.",
                name: "Ava Robinson",
                category: "CRM Development"
            },
            {
                content: "The AI models they built didn't just crunch numbers; they told stories that helped us make smarter business moves overnight.",
                name: "Ethan Harris",
                category: "AI/ML Development"
            },
            {
                content: "Machine learning isn't easy to get right but these folks nailed it ROI showed up faster than expected!",
                name: "Charlotte Clark",
                category: "AI/ML Development"
            },
            {
                content: "Automating tedious tasks freed up my team's time so we could focus on innovation instead exactly what we needed.",
                name: "Benjamin Lewis",
                category: "AI/ML Development"
            },
            {
                content: "Our departments were all over the place until this custom ERP brought everything under one roof smooth operations have never felt so good.",
                name: "Amelia Walker",
                category: "ERP Development"
            },
            {
                content: "ERP rollout was surprisingly stress-free thanks to their clear communication and expert handling every step of the way.",
                name: "William Hall",
                category: "ERP Development"
            }
        ];

        // Insert all testimonials
        for (const testimonialData of testimonials) {
            const testimonial = await Testimonial.create(testimonialData);
            console.log(`✅ ${testimonialData.name}'s testimonial seeded successfully!`);
        }

        console.log(`\n🎉 Successfully seeded ${testimonials.length} testimonials!`);

        // Close database connection
        await mongoose.connection.close();
        console.log("Database connection closed.");

    } catch (error) {
        console.error("Error seeding testimonials:", error);
        process.exit(1);
    }
};

// Run the seed function
seedTestimonials();
