import mongoose, { Schema } from "mongoose";

const careerSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Job title is required"],
            trim: true,
            minlength: [3, "Title must be at least 3 characters"],
            maxlength: [200, "Title cannot exceed 200 characters"],
        },
        location: {
            type: String,
            required: [true, "Location is required"],
            trim: true,
            maxlength: [200, "Location cannot exceed 200 characters"],
        },
        type: {
            type: String,
            required: [true, "Job type is required"],
            enum: ["Full-time", "Part-time", "Contract", "Internship", "Freelance"],
            trim: true,
        },
        experience: {
            type: String,
            required: [true, "Experience level is required"],
            trim: true,
            // Examples: "Intern", "6 months", "1 year", "2-3 years", "5+ years"
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            minlength: [20, "Description must be at least 20 characters"],
        },
        requirements: {
            type: [String],
            required: [true, "Requirements are required"],
            validate: {
                validator: function(v) {
                    return v && v.length > 0;
                },
                message: "At least one requirement is required",
            },
        },
        responsibilities: {
            type: [String],
            required: [true, "Responsibilities are required"],
            validate: {
                validator: function(v) {
                    return v && v.length > 0;
                },
                message: "At least one responsibility is required",
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient querying
careerSchema.index({ type: 1 });
careerSchema.index({ isActive: 1 });
careerSchema.index({ createdAt: -1 });

export default mongoose.model("Career", careerSchema);

