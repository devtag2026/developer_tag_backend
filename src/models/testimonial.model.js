import mongoose, { Schema } from "mongoose";


const testimonialSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        testimonialImg: {
            type: String
        },
    },
    {
        timestamps: true
    }
);

export const Testimonial = mongoose.model("Testimonial", testimonialSchema);