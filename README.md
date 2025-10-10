# DeveloperTag Backend API

A Node.js Express backend API for DeveloperTag with MongoDB integration.

## 🚀 Features

- **User Authentication** - JWT-based authentication with refresh tokens
- **File Upload** - Cloudinary integration for image uploads
- **Database** - MongoDB with Mongoose ODM
- **Security** - bcrypt password hashing, CORS, secure cookies
- **API Routes** - Users, Services, Portfolio, Testimonials, Forms

## 📋 API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - Login user
- `POST /api/v1/users/logout` - Logout user
- `GET /api/v1/users/current-user` - Get current user
- `POST /api/v1/users/refresh-token` - Refresh access token

### Services
- `GET /api/v1/services` - Get all services
- `POST /api/v1/services` - Create service (admin only)
- `PUT /api/v1/services/:id` - Update service (admin only)
- `DELETE /api/v1/services/:id` - Delete service (admin only)

### Portfolio
- `GET /api/v1/portfolio` - Get all portfolio items
- `POST /api/v1/portfolio` - Create portfolio item (admin only)
- `PUT /api/v1/portfolio/:id` - Update portfolio item (admin only)
- `DELETE /api/v1/portfolio/:id` - Delete portfolio item (admin only)

### Testimonials
- `GET /api/v1/testimonials` - Get all testimonials
- `POST /api/v1/testimonials` - Create testimonial (admin only)
- `PUT /api/v1/testimonials/:id` - Update testimonial (admin only)
- `DELETE /api/v1/testimonials/:id` - Delete testimonial (admin only)

### Forms
- `POST /api/v1/forms/service-request` - Submit service request
- `POST /api/v1/forms/question` - Submit question

## 🛠️ Environment Variables

Create a `.env` file with the following variables:

```env
# Database
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/developertag

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=7d

# Server
PORT=8000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Resend (Email)
RESEND_API_KEY=your_resend_api_key
```

## 🚀 Deployment on Vercel

### Prerequisites
1. Vercel account
2. MongoDB Atlas database
3. Environment variables configured

### Steps
1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add all environment variables from your `.env` file

### Manual Deployment
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

## 🏃‍♂️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT tokens
- **cloudinary** - Image upload service
- **multer** - File upload middleware
- **cors** - Cross-origin resource sharing
- **cookie-parser** - Cookie parsing
- **dotenv** - Environment variables

## 🔐 Security Features

- Password hashing with bcrypt
- JWT authentication with refresh tokens
- CORS configuration
- Secure cookie settings
- Input validation and sanitization
- Rate limiting (can be added)

## 📝 License

ISC License
