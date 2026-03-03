import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema(
    {
        // Basic Info
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: [3, "Title must be at least 3 characters"],
            maxlength: [100, "Title cannot exceed 100 characters"],
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"],
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: [50, "Description must be at least 50 characters"],
            maxlength: [2000, "Description cannot exceed 2000 characters"],
        },

        // Images
        heroImage: {
            type: String,
            required: true,
        },

        // Why Choose Section
        whyChooseSection: {
            title: {
                type: String,
                trim: true,
                default: "Why Choose Us",
            },
            items: [{
                title: {
                    type: String,
                    required: true,
                    trim: true,
                },
                content: {
                    type: String,
                    required: true,
                    trim: true,
                },
            }],
        },

        // Metadata
        category: {
            type: String,
            required: true,
            enum: ['web-development', 'mobile-development', 'desktop-development', 'ui-ux-design', 'ai-development', 'erp-solutions', 'crm-solutions', 'saas-platforms', 'blockchain', 'other'],
        },
    },
    {
        timestamps: true,
    }
);

// slug index already created by unique: true above; only add category index
serviceSchema.index({ category: 1 });

// Virtual for full service URL
serviceSchema.virtual('fullUrl').get(function() {
    return `/service/${this.slug}`;
});

export const Service = mongoose.model("Service", serviceSchema);


