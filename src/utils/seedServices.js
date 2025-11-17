import mongoose from "mongoose";
import { Service } from "../models/service.model.js";
import { connectDB } from "../db/index.js";

const seedServices = async () => {
    try {
        // Connect to database
        await connectDB();

        // Delete all existing services
        await Service.deleteMany({});
        console.log("Deleted all existing services.");

        // Define all services
        const services = [
            {
                title: "Web Development",
                slug: "web-development",
                description: "Transform your business with our cutting-edge web development solutions. We create custom, responsive websites and web applications that are fast, secure, and SEO-friendly. From elegant marketing sites to complex web portals, we ensure your online presence is modern, engaging, and scalable.",
                category: "web-development",
                heroImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=600&fit=crop",
                whyChooseSection: {
                    title: "Why Choose Our Web Development Services",
                    items: [
                        { title: "Responsive Design", content: "Ensuring a seamless experience across all screen sizes and devices." },
                        { title: "Modern Frameworks", content: "Building with React, Next.js, and cutting-edge technologies for superior performance." },
                        { title: "SEO Optimized", content: "Creating search-engine friendly websites that rank higher and drive traffic." },
                        { title: "Fast Performance", content: "Optimized code and infrastructure for lightning-fast load times." },
                        { title: "Secure & Scalable", content: "Implementing best security practices and architecture that scales with your business." },
                        { title: "24/7 Support", content: "Dedicated support team available to help you anytime, anywhere." }
                    ]
                }
            },
            {
                title: "Mobile App Development",
                slug: "app-development",
                description: "Build powerful iOS and Android applications that deliver exceptional user experiences. Our mobile app development services combine cutting-edge technology with innovative design to create apps that users love. From startup MVPs to enterprise solutions, we bring your mobile vision to life.",
                category: "mobile-development",
                heroImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=600&fit=crop",
                whyChooseSection: {
                    title: "Why Choose Our Mobile App Development Services",
                    items: [
                        { title: "Native & Cross-Platform", content: "Support for both native iOS/Android and React Native cross-platform solutions." },
                        { title: "User-Centric Design", content: "Creating intuitive interfaces that provide seamless user experiences across all devices." },
                        { title: "App Store Optimization", content: "Expert guidance in ASO to maximize visibility and downloads on app stores." },
                        { title: "Performance Optimization", content: "Lightning-fast apps with minimal battery consumption and optimized memory usage." },
                        { title: "Secure by Default", content: "Built-in security features to protect user data and maintain compliance standards." },
                        { title: "Continuous Updates", content: "Regular updates and maintenance to keep your app current and competitive." }
                    ]
                }
            },
            {
                title: "Desktop Software Development",
                slug: "desktop-software-development",
                description: "Create powerful desktop applications for Windows, Mac, and Linux platforms. Our desktop software development services deliver native performance, offline capabilities, and seamless integration with operating system features. Build robust applications that users can install and use without internet connectivity.",
                category: "desktop-development",
                heroImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop",
                whyChooseSection: {
                    title: "Why Choose Our Desktop Software Development",
                    items: [
                        { title: "Cross-Platform Support", content: "Native applications for Windows, macOS, and Linux using Electron or native frameworks." },
                        { title: "Offline Capabilities", content: "Full functionality without internet connectivity for productivity and reliability." },
                        { title: "Native Performance", content: "Leveraging system resources for optimal speed and responsiveness." },
                        { title: "System Integration", content: "Deep integration with operating system features and native APIs." },
                        { title: "Secure Installation", content: "Signed applications with secure distribution and update mechanisms." },
                        { title: "Enterprise Ready", content: "Scalable desktop solutions for enterprise deployment and management." }
                    ]
                }
            },
            {
                title: "CRM Solutions",
                slug: "crm-solutions",
                description: "Transform your customer relationships with powerful Customer Relationship Management solutions. Our CRM platforms help you manage interactions, track leads, automate sales processes, and deliver exceptional customer experiences that drive growth and loyalty.",
                category: "crm-solutions",
                heroImage: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=600&fit=crop",
                whyChooseSection: {
                    title: "Why Choose Our CRM Solutions",
                    items: [
                        { title: "360° Customer View", content: "Complete customer profiles with interaction history and preferences." },
                        { title: "Sales Automation", content: "Streamlined sales pipeline with automated follow-ups and task management." },
                        { title: "Marketing Integration", content: "Seamlessly connect marketing campaigns with CRM for better ROI tracking." },
                        { title: "Lead Management", content: "Efficient lead capture, qualification, and conversion tracking systems." },
                        { title: "Mobile Access", content: "Access your CRM on-the-go with responsive mobile applications." },
                        { title: "Analytics & Reporting", content: "Comprehensive dashboards and reports to measure performance and ROI." }
                    ]
                }
            },
            {
                title: "ERP Systems",
                slug: "erp-systems",
                description: "Streamline your business operations with comprehensive Enterprise Resource Planning solutions. Our ERP systems integrate all core business functions into a unified platform, enabling real-time data access, improved efficiency, and data-driven decision making.",
                category: "erp-solutions",
                heroImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop",
                whyChooseSection: {
                    title: "Why Choose Our ERP Systems",
                    items: [
                        { title: "Unified Platform", content: "Centralized system managing all business processes in one integrated platform." },
                        { title: "Real-Time Analytics", content: "Instant insights and comprehensive reports for data-driven decision making." },
                        { title: "Customizable Modules", content: "Flexible modules tailored to your industry-specific requirements and workflows." },
                        { title: "Cloud-Based Solutions", content: "Scalable cloud infrastructure with secure access from anywhere, anytime." },
                        { title: "Automated Workflows", content: "Reduce manual tasks with intelligent automation and workflow optimization." },
                        { title: "Data Security", content: "Enterprise-grade security measures to protect your critical business data." }
                    ]
                }
            },
            {
                title: "SaaS Platforms",
                slug: "saas-platforms",
                description: "Build scalable Software-as-a-Service platforms that grow with your business. Our SaaS development expertise covers multi-tenancy, subscription management, API integration, and cloud infrastructure to deliver reliable, cost-effective software solutions.",
                category: "saas-platforms",
                heroImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop",
                whyChooseSection: {
                    title: "Why Choose Our SaaS Platform Development",
                    items: [
                        { title: "Multi-Tenancy", content: "Secure, isolated environments for multiple customers on a single infrastructure." },
                        { title: "Subscription Management", content: "Flexible billing and subscription management with multiple pricing tiers." },
                        { title: "API-First Architecture", content: "RESTful APIs and integrations for seamless connectivity with third-party services." },
                        { title: "Auto-Scaling", content: "Automatically scale resources based on demand to maintain optimal performance." },
                        { title: "White-Label Ready", content: "Fully customizable branding for reseller and partner programs." },
                        { title: "99.9% Uptime", content: "Enterprise-grade infrastructure ensuring maximum availability and reliability." }
                    ]
                }
            },
            {
                title: "Blockchain Applications",
                slug: "blockchain-applications",
                description: "Leverage the power of blockchain technology to build decentralized applications, smart contracts, and secure token systems. Our blockchain development services help you create transparent, immutable, and trustworthy solutions for finance, supply chain, and digital assets.",
                category: "blockchain",
                heroImage: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=600&fit=crop",
                whyChooseSection: {
                    title: "Why Choose Our Blockchain Applications",
                    items: [
                        { title: "Smart Contracts", content: "Automated, self-executing contracts with transparent and secure operations." },
                        { title: "Decentralized Apps", content: "Build DApps on Ethereum, Polygon, and other leading blockchain networks." },
                        { title: "Token Development", content: "Create custom tokens, NFTs, and cryptocurrency solutions for your platform." },
                        { title: "Security First", content: "Comprehensive security audits and best practices for blockchain deployments." },
                        { title: "Multi-Chain Support", content: "Support for multiple blockchain networks including Ethereum, BSC, Polygon." },
                        { title: "Web3 Integration", content: "Seamless integration with wallets, DeFi protocols, and Web3 infrastructure." }
                    ]
                }
            }
        ];

        // Insert all services
        for (const serviceData of services) {
            const service = await Service.create(serviceData);
            console.log(`✅ ${serviceData.title} service seeded successfully!`);
            console.log(`   Slug: ${serviceData.slug}`);
        }

        console.log(`\n🎉 Successfully seeded ${services.length} services!`);

        // Close database connection
        await mongoose.connection.close();
        console.log("Database connection closed.");

    } catch (error) {
        console.error("Error seeding services:", error);
        process.exit(1);
    }
};

// Run the seed function
seedServices();
