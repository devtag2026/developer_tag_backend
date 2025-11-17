import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Portfolio from "../models/portfolio.model.js";
import { connectDB } from "../db/index.js";

const portfolioProjects = [
    // Custom Software Solutions
    {
        name: "Zirtue",
        description: "A relationship-based lending platform that enables users to lend and borrow money securely with friends and family, promoting transparency and accountability.",
        cost: "$15,000",
        image: "/assets/portfolio/zirtue.png",
        url: "https://www.zirtue.com",
        category: "custom-software-solutions",
        displayOrder: 1,
    },
    {
        name: "Future Farm",
        description: "A business transformation platform focused on corporate sustainability and innovation, helping organizations adapt to future challenges.",
        cost: "$11,000",
        image: "/assets/portfolio/futurefarm.png",
        url: "https://www.futurefarm.io",
        category: "custom-software-solutions",
        displayOrder: 2,
    },
    {
        name: "RevBits",
        description: "A cybersecurity company offering advanced security solutions to protect enterprises from evolving cyber threats.",
        cost: "$20,000",
        image: "/assets/portfolio/revbits.png",
        url: "https://www.revbits.com/",
        category: "custom-software-solutions",
        displayOrder: 3,
    },
    {
        name: "IgniteTech - FogBugz",
        description: "A software project management system designed for agile teams, providing tools for bug tracking, issue tracking, and project planning.",
        cost: "$17,000",
        image: "/assets/portfolio/fogBugs.png",
        url: "https://ignitetech.ai/software-library/fogbugz/",
        category: "custom-software-solutions",
        displayOrder: 4,
    },
    {
        name: "Ekentech",
        description: "A provider of investigative background check technology, offering solutions tailored to various industries to enhance hiring processes.",
        cost: "$19,900",
        image: "/assets/portfolio/ekentech.png",
        url: "https://www.ekentech.com/",
        category: "custom-software-solutions",
        displayOrder: 5,
    },
    // Web Development
    {
        name: "Africa Health",
        description: "A healthcare-focused platform delivering news and insights on medical advancements and health issues across Africa.",
        cost: "$12,000",
        image: "/assets/portfolio/africanHealth.png",
        url: "https://africa-health.com/",
        category: "web-development",
        displayOrder: 1,
    },
    {
        name: "MATW Project",
        description: "A charity organization dedicated to supporting humanitarian projects worldwide, focusing on sustainable development and aid.",
        cost: "$8,000",
        image: "/assets/portfolio/matw.png",
        url: "https://matwproject.org/",
        category: "web-development",
        displayOrder: 2,
    },
    // E-commerce
    {
        name: "Idillionaire",
        description: "An online store offering inspirational products, books, and merchandise aimed at personal development and enlightenment.",
        cost: "$5,000",
        image: "/assets/portfolio/idillionare.png",
        url: "https://idillionaire.com//",
        category: "e-commerce",
        displayOrder: 1,
    },
    {
        name: "Positively Vibe",
        description: "A lifestyle and wellness e-commerce brand providing a range of products to promote positive living and well-being.",
        cost: "$7,000",
        image: "/assets/portfolio/postivelyVibes.png",
        url: "https://www.positivelyvibe.com/",
        category: "e-commerce",
        displayOrder: 2,
    },
    // App Development
    {
        name: "Modomines",
        description: "A mining and quarry management app that streamlines operations, enhances productivity, and ensures compliance within the industry.",
        cost: "$35,000",
        image: "/assets/portfolio/Mobi.png",
        url: "https://play.google.com/store/apps/details?id=com.shreedhar_t.modomines&hl=en_US",
        category: "app-development",
        displayOrder: 1,
    },
    {
        name: "Smart Trainer",
        description: "An AI-powered platform that acts as a virtual manager and data analyst, providing real-time quality checks, sales forecasts, and operational insights for businesses.",
        cost: "$16,000",
        image: "/assets/portfolio/smartTrainer.png",
        url: "https://smarttrainerapp.com/",
        category: "app-development",
        displayOrder: 2,
    },
    {
        name: "Xplora",
        description: "A smartwatch and mobile app designed for children's safety, offering features like GPS tracking, safe zones, and communication tools to keep kids connected securely.",
        cost: "$21,000",
        image: "/assets/portfolio/Xplora.png",
        url: "https://xplora.co.uk/",
        category: "app-development",
        displayOrder: 3,
    },
    // Content Management System
    {
        name: "Join Reflect",
        description: "A platform that simplifies the process of finding the right therapist, offering personalized matches, dedicated concierge support, and quality assurance for mental health services.",
        cost: "$10,000",
        image: "/assets/portfolio/joinreflect.png",
        url: "https://joinreflect.com/",
        category: "content-management-system",
        displayOrder: 1,
    },
    {
        name: "HealthDesk AI",
        description: "An AI-powered CRM and chatbot solution for fitness and wellness businesses, providing lead generation, client engagement, and automated administrative support.",
        cost: "$18,700",
        image: "/assets/portfolio/healthdesk.png",
        url: "https://healthdesk.ai/",
        category: "content-management-system",
        displayOrder: 2,
    },
    // Desktop Applications
    {
        name: "FogBugz",
        description: "A comprehensive software project management tool offering features like time tracking, task management, and bug tracking to streamline development workflows.",
        cost: "$8,000",
        image: "/assets/portfolio/fogBugs.png",
        url: "https://ignitetech.ai/softwarelibrary/fogbugz/",
        category: "desktop-applications",
        displayOrder: 1,
    },
    // Software as a Service (SaaS)
    {
        name: "Fed",
        description: "A comprehensive SaaS platform designed to streamline business operations and enhance productivity.",
        cost: "$23,000",
        image: "/assets/portfolio/fed.png",
        url: "https://www.fed.com/",
        category: "software-as-a-service",
        displayOrder: 1,
    },
    {
        name: "Tudo",
        description: "A SaaS platform offering business management and automation tools, helping organizations optimize operations and improve efficiency.",
        cost: "$25,000",
        image: "/assets/portfolio/tudo.png",
        url: "https://tudo.app/",
        category: "software-as-a-service",
        displayOrder: 2,
    },
    {
        name: "WowInvest",
        description: "A financial investment and portfolio management platform providing tools for tracking investments, analyzing performance, and making informed financial decisions.",
        cost: "$19,000",
        image: "/assets/portfolio/wowinvest.png",
        url: "https://wowinvest.swehold.com",
        category: "software-as-a-service",
        displayOrder: 3,
    },
    {
        name: "WowBridge",
        description: "A platform focused on bridge investment and management, offering resources and tools for investors in bridge projects.",
        cost: "$6,800",
        image: "/assets/portfolio/wowbridge.png",
        url: "https://wowbridge.swehold.com/",
        category: "software-as-a-service",
        displayOrder: 4,
    },
];

async function seedPortfolios() {
    try {
           // Connect to database
        await connectDB();

        // Delete all existing portfolios
        await Portfolio.deleteMany({});
        console.log("🗑️  Deleted existing portfolios");

        // Insert new portfolios
        const insertedPortfolios = await Portfolio.insertMany(portfolioProjects);
        console.log(`✅ Successfully seeded ${insertedPortfolios.length} portfolio projects`);

        // Log categories summary
        const categoryCounts = {};
        insertedPortfolios.forEach(portfolio => {
            categoryCounts[portfolio.category] = (categoryCounts[portfolio.category] || 0) + 1;
        });
        
        console.log("\n📊 Portfolio Categories:");
        Object.entries(categoryCounts).forEach(([category, count]) => {
            console.log(`   ${category}: ${count} projects`);
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding portfolios:", error);
        process.exit(1);
    }
}

seedPortfolios();
