# Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Environment Variables
Make sure to set these environment variables in your Vercel dashboard:

```env
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/developertag
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=7d
CORS_ORIGIN=https://your-frontend-domain.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=your_resend_api_key
NODE_ENV=production
```

### 2. Deployment
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### 3. Test Deployment
After deployment, test these endpoints:

- **Health Check:** `GET https://your-app.vercel.app/api/health`
- **User Registration:** `POST https://your-app.vercel.app/api/v1/users/register`
- **User Login:** `POST https://your-app.vercel.app/api/v1/users/login`

## 🔧 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check MongoDB URL in environment variables
   - Verify IP whitelist in MongoDB Atlas
   - Check network connectivity

2. **Build Failed**
   - Check Node.js version (requires 18+)
   - Verify all dependencies are in package.json
   - Check for syntax errors

3. **Function Timeout**
   - Database queries might be taking too long
   - Check MongoDB Atlas performance
   - Optimize database queries

### Debug Steps:

1. Check Vercel function logs
2. Test health endpoint first
3. Verify environment variables
4. Check MongoDB Atlas logs

## 📋 API Endpoints

- `GET /api/health` - Health check
- `POST /api/v1/users/register` - Register user
- `POST /api/v1/users/login` - Login user
- `GET /api/v1/users/current-user` - Get current user
- `POST /api/v1/users/logout` - Logout user
- `GET /api/v1/services` - Get services
- `GET /api/v1/portfolio` - Get portfolio
- `GET /api/v1/testimonials` - Get testimonials
