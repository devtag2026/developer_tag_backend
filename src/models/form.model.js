import mongoose, { Schema } from 'mongoose';

// Define enums for validation
export const SERVICE_TYPES = [
    'Web Development',
    'Video Editing',
    'AI Solutions',
    'Graphic Design',
    'Digital Marketing',
];


export const FORM_TYPES = [
    'Request a Service',
    'Ask a Question',
];


const formSubmissionSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: [2, 'Name must be at least 2 characters long'],
            maxlength: [50, 'Name cannot exceed 50 characters']
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: [10, 'Description must be at least 10 characters long'],
            maxlength: [1000, 'Description cannot exceed 1000 characters']
        },
        serviceType: {
            type: String,
            enum: {
                values: SERVICE_TYPES,
                message: 'Please select a valid service type'
            }
        },

        formType: {
            type: String,
            required: true,
            enum: {
                values: FORM_TYPES,
                message: 'Invalid form type'
            }
        },
    },
    {
        timestamps: true
    }
);

// Add indexes for better query performance
formSubmissionSchema.index({ formType: 1, createdAt: -1 });
formSubmissionSchema.index({ serviceType: 1 });
formSubmissionSchema.index({ email: 1 });

const FormSubmission = mongoose.model('FormSubmission', formSubmissionSchema);

export default FormSubmission;
