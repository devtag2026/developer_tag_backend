export const DB_NAME = "devTag";

export const PaymentStatus = {
    PENDING: "pending",
    SUCCEEDED: "succeeded",
    FAILED: "failed",
    REFUNDED: "refunded",
    CANCELLED: "cancelled",
};

export const PAYMENT_TERMS_LABEL = {
    milestone: "Milestone-Based",
    "final-payment": "Final Payment",
    upfront: "Upfront / Full Payment",
    installments: "Installments",
};

export const EMAIL = {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please provide a valid email address",
};

export const PASSWORD = {
    regex: /^(?=.*[A-Z])(?=.*\d).{8,}$/,
    message: "Password must contain at least 8 characters, one number, and one uppercase letter",
};
