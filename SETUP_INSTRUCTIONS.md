# 🚀 Setup Instructions - Sakhi Suraksha Backend

## Current Status: ✅ Dependencies Installed

npm packages have been successfully installed. Here's what you need to do next:

---

## 📋 Required Steps

### 1️⃣ Install PostgreSQL

**Option A: Using Official Installer (Recommended)**
1. Download PostgreSQL 16 from: https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation:
   - Set password for postgres user (remember this!)
   - Keep default port: 5432
   - Install pgAdmin 4 (GUI tool)
4. Add PostgreSQL to PATH:
   - Default location: `C:\Program Files\PostgreSQL\16\bin`
   - Add to System Environment Variables

**Option B: Using Chocolatey**
```powershell
choco install postgresql
```

**Option C: Using Docker**
```powershell
docker run --name sakhi-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:16
```

---

### 2️⃣ Create Database

After PostgreSQL is installed, run:

```powershell
# Option 1: Using psql command
psql -U postgres
CREATE DATABASE sakhi_suraksha;
\q

# Option 2: Using createdb command
createdb -U postgres sakhi_suraksha

# Option 3: Using pgAdmin GUI
# Open pgAdmin → Right-click Databases → Create → Database → Name: sakhi_suraksha
```

---

### 3️⃣ Update .env File (If Needed)

Your `.env` file is already configured with development defaults:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/sakhi_suraksha
```

**If you used a different password during PostgreSQL installation**, update this line:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/sakhi_suraksha
```

---

### 4️⃣ Generate & Run Database Migrations

```powershell
# Generate migration files from schema
npm run db:generate

# Apply migrations to create tables
npm run db:migrate
```

This will create all 11 tables:
- ✅ users
- ✅ emergency_alerts
- ✅ emergency_contacts
- ✅ family_connections
- ✅ location_tracking
- ✅ safe_zones
- ✅ voice_patterns
- ✅ iot_devices
- ✅ destinations
- ✅ home_locations
- ✅ sessions
- ✅ audit_logs

---

### 5️⃣ Start Development Server

```powershell
npm run dev
```

The server will start at: **http://localhost:5000**

You should see:
```
🚀 Server started successfully
✅ Database connected
✅ WebSocket server running on port 5000
✅ Persistence layer initialized
```

---

## 🎯 Development Mode Features

Your `.env` is configured with **mock services enabled**:

✅ **MOCK_SMS_ENABLED=true** - Simulated SMS sending (no Twilio needed)  
✅ **MOCK_WHATSAPP_ENABLED=true** - Simulated WhatsApp (no API key needed)  
✅ **MOCK_VOICE_AI_ENABLED=true** - Rule-based voice detection (no AssemblyAI needed)  

**This means you can develop without any external API keys!**

---

## 🧪 Test the API

Once the server is running, test it:

```powershell
# Health check
curl http://localhost:5000/health

# Should return:
# {"status":"ok","database":"connected","timestamp":"..."}
```

---

## 📦 Optional: Install pgAdmin (GUI Tool)

If you want a visual database management tool:
- Download: https://www.pgadmin.org/download/pgadmin-4-windows/
- Or install with PostgreSQL installer

---

## ❓ Troubleshooting

### PostgreSQL Connection Issues

**Error: "password authentication failed"**
```powershell
# Reset postgres password
psql -U postgres
ALTER USER postgres PASSWORD 'password';
\q
```

**Error: "could not connect to server"**
- Check if PostgreSQL service is running:
  - Windows Services → postgresql-x64-16 → Start

**Error: "database does not exist"**
```powershell
createdb -U postgres sakhi_suraksha
```

### Migration Issues

**Error: "Cannot find module 'drizzle-orm'"**
```powershell
npm install
```

**Error: Migration fails**
```powershell
# Drop and recreate database
psql -U postgres
DROP DATABASE IF EXISTS sakhi_suraksha;
CREATE DATABASE sakhi_suraksha;
\q

# Run migrations again
npm run db:migrate
```

---

## 🎊 Next Steps After Setup

1. ✅ Test API endpoints with the React client
2. ✅ Test WebSocket connections
3. ✅ Test emergency trigger flow
4. ✅ Test location tracking
5. ✅ Explore family dashboard features

---

## 📝 Summary

**Current Status:**
- ✅ npm dependencies installed (593 packages)
- ✅ .env file configured with development secrets
- ✅ Mock services enabled (no API keys needed)

**What You Need:**
- 🔲 Install PostgreSQL
- 🔲 Create sakhi_suraksha database
- 🔲 Run database migrations
- 🔲 Start dev server

**Total Time: ~10-15 minutes** ⏱️

---

## 🚀 Quick Command Reference

```powershell
# After PostgreSQL is installed:

# 1. Create database
createdb -U postgres sakhi_suraksha

# 2. Generate migrations
npm run db:generate

# 3. Run migrations
npm run db:migrate

# 4. Start server
npm run dev

# 5. Test
curl http://localhost:5000/health
```

---

Need help? Check [README_BACKEND.md](README_BACKEND.md) for full documentation!
