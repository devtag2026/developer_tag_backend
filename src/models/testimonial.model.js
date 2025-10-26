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
    // title: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },
    category: {
      type: String,
      required: false,
      trim: true, // ✅ New field for testimonial category (e.g., Client, Partner, Student, etc.)
    },
    // testimonialImg: {
    //   type: String,
    //   trim: true, // 🖼️ Optional image URL (commented out for now)
    // },
  },
  {
    timestamps: true,
  }
);

export const Testimonial = mongoose.model("Testimonial", testimonialSchema);
