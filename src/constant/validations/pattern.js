export const EMAIL = {
  regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  message: "Please provide a valid email address",
};

export const PASSWORD = {
  regex: /^(?=.*[A-Z])(?=.*\d).{8,}$/,
  message: "Password must contain at least 8 characters, one number, and one uppercase letter",
};