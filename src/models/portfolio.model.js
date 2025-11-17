import mongoose, { Schema } from "mongoose";

const portfolioSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Project name is required"],
            trim: true,
            minlength: [3, "Name must be at least 3 characters"],
            maxlength: [100, "Name cannot exceed 100 characters"],
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            minlength: [10, "Description must be at least 10 characters"],
            maxlength: [500, "Description cannot exceed 500 characters"],
        },
        cost: {
            type: String,
            required: [true, "Cost is required"],
            trim: true,
        },
        image: {
            type: String,
            // required: [true, "Image URL is required"],
            trim: true,
        },
        url: {
            type: String,
            required: [true, "URL is required"],
            trim: true,
            validate: {
                validator: function(v) {
                    return /^https?:\/\/.+/.test(v);
                },
                message: "URL must be a valid HTTP or HTTPS URL",
            },
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            enum: [
                'custom-software-solutions',
                'web-development',
                'e-commerce',
                'app-development',
                'content-management-system',
                'desktop-applications',
                'software-as-a-service'
            ],
            trim: true,
        },
        featured: {
            type: Boolean,
            default: false,
        },
        displayOrder: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient querying
portfolioSchema.index({ category: 1 });
portfolioSchema.index({ featured: 1 });
portfolioSchema.index({ displayOrder: 1 });
portfolioSchema.index({ category: 1, displayOrder: 1 });

// Virtual for category display name
portfolioSchema.virtual('categoryDisplayName').get(function() {
    const categoryMap = {
        'custom-software-solutions': 'Custom Software Solutions',
        'web-development': 'Web Development',
        'e-commerce': 'E-commerce',
        'app-development': 'App Development',
        'content-management-system': 'Content Management System',
        'desktop-applications': 'Desktop Applications',
        'software-as-a-service': 'Software as a Service (SaaS)'
    };
    return categoryMap[this.category] || this.category;
});

export default mongoose.model("Portfolio", portfolioSchema);
