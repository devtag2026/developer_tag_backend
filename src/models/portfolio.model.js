import mongoose, { Schema } from "mongoose";

const portfolioSchema = new Schema(
    {
        slug: {
            type: String,
            required: [true, "Slug is required"],
            unique: true,
            trim: true,
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        tagLine: {
            type: String,
            required: [true, "Tag line is required"],
            trim: true,
        },
        projectScopeDescription: {
            type: String,
            required: [true, "Project scope description is required"],
            trim: true,
        },
        // Modified techStack: each element is an object with a 'tech' field.
        techStack: [
            {
                tech: {
                    type: String,
                    required: [true, "At least one technology is required"],
                    trim: true,
                },
            },
        ],
        previewImage: {
            type: String,
            required: [true, "Preview image is required"],
            trim: true,
        },
        websiteDemo: {
            type: String,
            trim: true,
        },
        mobileDemo: {
            type: String,
            trim: true,
        },
        adminPanelImage: {
            type: String,
            trim: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Portfolio", portfolioSchema);
