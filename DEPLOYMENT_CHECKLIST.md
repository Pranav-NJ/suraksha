# 🚀 Sakhi Suraksha Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Repository Preparation
- [ ] All code committed to GitHub
- [ ] Configuration files updated:
  - [ ] `drizzle.config.json` uses `${DATABASE_URL}`
  - [ ] `client/vite.config.ts` builds to `dist`
  - [ ] `package.json` has correct build scripts
  - [ ] CORS configured for production URLs

### 2. Database Setup
- [ ] PostgreSQL database created on Render
- [ ] Database URL copied
- [ ] Test database connection locally (optional)

### 3. Environment Variables
- [ ] Backend environment variables ready:
  ```
  NODE_ENV=production
  PORT=10000
  DATABASE_URL=your_render_db_url
  JWT_SECRET=32_character_secret
  SESSION_SECRET=session_secret
  CORS_ORIGIN=https://your-app-name.onrender.com
  ```

- [ ] Frontend environment variables ready:
  ```
  VITE_API_URL=https://your-backend-name.onrender.com
  VITE_WS_URL=wss://your-backend-name.onrender.com
  VITE_APP_NAME=Sakhi Suraksha
  VITE_APP_VERSION=1.0.0
  ```

## 🚀 Deployment Steps

### Phase 1: Database
1. [ ] Login to Render Dashboard
2. [ ] Create PostgreSQL database
3. [ ] Copy External Database URL
4. [ ] Save database URL for environment variables

### Phase 2: Backend
1. [ ] Create New Web Service
2. [ ] Connect GitHub repository
3. [ ] Configure:
   - Name: `sakhi-suraksha-api`
   - Runtime: Node 18
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. [ ] Add environment variables
5. [ ] Deploy and wait for build

### Phase 3: Frontend
1. [ ] Create New Static Site
2. [ ] Connect same repository
3. [ ] Configure:
   - Name: `sakhi-suraksha-web`
   - Root Directory: `./client`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. [ ] Add frontend environment variables
5. [ ] Deploy and wait for build

## ✅ Post-Deployment Checklist

### 1. Backend Testing
- [ ] Visit `https://your-backend-name.onrender.com/api/health`
- [ ] Should return: `{"status":"ok","timestamp":"...","uptime":...,"environment":"production"}`
- [ ] Check logs for any errors

### 2. Frontend Testing
- [ ] Visit `https://your-frontend-name.onrender.com`
- [ ] Page loads without errors
- [ ] Check browser console for errors
- [ ] Test navigation between pages

### 3. Integration Testing
- [ ] Test emergency alert system
- [ ] Test WebSocket connection
- [ ] Test file uploads
- [ ] Test parent dashboard
- [ ] Test mobile responsiveness

### 4. Final Checks
- [ ] All features working
- [ ] No console errors
- [ ] WebSocket connected
- [ ] Database operations working
- [ ] File uploads working

## 🚨 Common Issues & Solutions

### Database Connection Issues
- **Problem**: Can't connect to database
- **Solution**: Verify DATABASE_URL is correct and database is accessible

### CORS Issues
- **Problem**: Frontend can't access backend
- **Solution**: Check CORS_ORIGIN matches frontend URL exactly

### WebSocket Issues
- **Problem**: WebSocket not connecting
- **Solution**: Ensure using `wss://` for production URLs

### Build Failures
- **Problem**: Build fails during deployment
- **Solution**: Check Node.js version and all dependencies

## 📞 Support

If you encounter issues:
1. Check Render logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure your repository has all the latest changes
4. Test locally with production environment variables first

## 🎉 Success!

Once all checklist items are complete, your Sakhi Suraksha application is successfully deployed on Render!
