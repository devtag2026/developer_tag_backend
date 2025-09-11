import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: [3, "Title must be at least 3 characters"],
            maxlength: [100, "Title cannot exceed 100 characters"],
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: [10, "Description must be at least 10 characters"],
            maxlength: [1000, "Description cannot exceed 1000 characters"],
        },
        imageUrl: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Service = mongoose.model("Service", serviceSchema);


