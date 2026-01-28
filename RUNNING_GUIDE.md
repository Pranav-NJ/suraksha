# 🚀 Running Sakhi Suraksha - Complete Guide

## Quick Start (Development Mode)

### Option 1: Run Both Servers Separately (Recommended)

#### Terminal 1 - Backend Server
```bash
# From project root
npm run dev
```
Backend will run at: **http://localhost:5000**

#### Terminal 2 - Frontend Client
```bash
# From project root
cd client
npm run dev
```
Frontend will run at: **http://localhost:5173**

The frontend automatically proxies API requests to backend (configured in vite.config.ts)

---

## 🎯 Access URLs

### Development Mode:
- **Main App**: http://localhost:5173
- **Parent Dashboard**: http://localhost:5173/parent-dashboard
- **API Server**: http://localhost:5000/api
- **API Health**: http://localhost:5000/api/health

### Production Mode (After Build):
- **Everything**: http://localhost:5000
  - Main App: http://localhost:5000
  - Parent Dashboard: http://localhost:5000/parent-dashboard
  - API: http://localhost:5000/api/*

---

## 📋 Available Routes

### Main App Routes (User Interface)
- `/` - Home (Emergency SOS Button)
- `/map` - Safe Route Finder
- `/contacts` - Emergency Contacts
- `/settings` - User Settings
- `/destinations` - Saved Destinations
- `/iot-devices` - IoT Device Manager
- `/profile-setup` - Profile Setup

### Parent Dashboard Routes
- `/parent-dashboard` - Parent monitoring dashboard
- `/emergency-alerts` - Emergency alerts page
- `/emergency-watch/:streamId` - Live emergency stream viewer

### API Routes (Backend)
- `/api/auth/send-otp` - Send authentication OTP
- `/api/auth/verify-otp` - Verify OTP and login
- `/api/user/profile` - Get user profile
- `/api/emergency-alerts` - Emergency alert management
- `/api/emergency-contacts` - Emergency contacts CRUD
- `/api/location/track` - Location tracking
- `/api/parent/connect` - Parent-child connection
- `/api/iot-devices` - IoT device management
- `/api/voice/process` - Voice AI processing

---

## 🔧 Setup Instructions

### First Time Setup

1. **Install Dependencies**
```bash
# Backend
npm install

# Frontend
cd client
npm install
cd ..
```

2. **Setup PostgreSQL Database**
- Ensure PostgreSQL 18 is running
- Database `sakhi_suraksha` should exist
- Run migrations if not already done:
```bash
npm run db:migrate
```

3. **Configure Environment**
- Backend `.env` is already configured
- Client `.env` is already configured
- Review settings if needed

4. **Start Servers**
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

---

## 🧪 Testing Voice AI Detection

### Test the "bachao" / "help me" Detection:

1. **Start Both Servers** (see above)

2. **Open Main App**: http://localhost:5173

3. **Test Voice Detection**:
   - The app has `VoiceIndicator` component active
   - Click the microphone button or use voice trigger
   - Say "bachao" or "help me"
   - System should detect distress and trigger emergency

4. **Monitor Parent Dashboard**: http://localhost:5173/parent-dashboard
   - Should show emergency alerts in real-time
   - View child's location on map
   - See emergency details

### Voice AI Mock Mode
Currently enabled in `.env`:
```
MOCK_VOICE_AI_ENABLED=true
```

This means:
- ✅ Voice detection works without real AI services
- ✅ No AssemblyAI/LLaMA API keys needed
- ✅ Simulates realistic detection behavior
- ✅ Perfect for testing and development

To use real AI services:
1. Set `MOCK_VOICE_AI_ENABLED=false`
2. Add real API keys to `.env`
3. Restart backend server

---

## 📱 Testing Emergency Flow

### Complete Emergency Test:

1. **Setup Parent Connection**:
   - Go to Settings → Family Connection
   - Generate QR code
   - Parent scans QR on `/parent-dashboard`

2. **Trigger Emergency**:
   - **Method 1**: Press SOS button on home screen
   - **Method 2**: Say "bachao" or "help me" (voice detection)
   - **Method 3**: Shake device (shake detection)
   - **Method 4**: Send SMS with keyword

3. **Verify Response**:
   - ✅ Emergency alert created in database
   - ✅ Parent receives notification
   - ✅ Location tracked and sent
   - ✅ SMS sent to emergency contacts
   - ✅ WebSocket updates parent dashboard
   - ✅ Emergency stream starts (if enabled)

4. **Monitor on Parent Dashboard**:
   - View real-time location
   - See emergency details
   - Respond to emergency
   - Mark as resolved

---

## 🗄️ Database Management

### View Database:
```bash
# Using pgAdmin 4
# Connect to: localhost:5432
# Database: sakhi_suraksha
# Username: postgres
# Password: your_password
```

### Reset Database:
```bash
npm run db:reset
```

### Generate New Migrations:
```bash
npm run db:generate
```

### Apply Migrations:
```bash
npm run db:migrate
```

---

## 🏗️ Production Build

### Build for Production:

1. **Build Frontend**:
```bash
cd client
npm run build
cd ..
```
This creates `client/dist/` directory

2. **Build Backend**:
```bash
npm run build
```
This creates `dist/` directory

3. **Run Production Server**:
```bash
npm start
```

4. **Access Application**:
- Everything at: http://localhost:5000
- Main app: http://localhost:5000
- Parent dashboard: http://localhost:5000/parent-dashboard
- API: http://localhost:5000/api/*

---

## 🐛 Troubleshooting

### Backend won't start:
- ✅ Check PostgreSQL is running
- ✅ Verify database exists: `sakhi_suraksha`
- ✅ Check `.env` configuration
- ✅ Run migrations: `npm run db:migrate`

### Frontend won't start:
- ✅ Check `node_modules` installed: `npm install`
- ✅ Verify `vite.config.ts` exists
- ✅ Check port 5173 is available

### Voice detection not working:
- ✅ Check microphone permissions in browser
- ✅ Ensure HTTPS or localhost (required for mic access)
- ✅ Verify `MOCK_VOICE_AI_ENABLED=true` in `.env`

### API requests failing:
- ✅ Ensure backend is running on port 5000
- ✅ Check vite.config.ts proxy settings
- ✅ Verify CORS settings in server/index.ts

### Database connection errors:
- ✅ PostgreSQL service running?
- ✅ Check DATABASE_URL in `.env`
- ✅ Verify credentials (user/password)

---

## 📊 Monitoring

### Backend Logs:
```bash
# Development mode logs automatically
# Shows all API requests and responses
```

### Database Queries:
```bash
# Enable Drizzle logging in server/config/db.ts
# Already enabled in development mode
```

### WebSocket Connections:
```bash
# Check terminal for WebSocket events
# Shows connections, disconnections, events
```

---

## 🔒 Security Notes

### Development Mode:
- ✅ Mock services enabled (no external API calls)
- ✅ CORS allows all origins
- ✅ Rate limiting disabled
- ✅ Detailed error messages

### Production Mode:
- ⚠️ Set `NODE_ENV=production`
- ⚠️ Configure CORS_ORIGIN in `.env`
- ⚠️ Use real API keys (no mock mode)
- ⚠️ Enable rate limiting
- ⚠️ Use HTTPS
- ⚠️ Secure session secrets

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review backend logs
3. Check browser console for errors
4. Verify all services are running
5. Test API endpoints using `test-api.rest`

**Happy Testing! 🎉**
