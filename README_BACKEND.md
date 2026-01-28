# Sakhi Suraksha - Backend Documentation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your actual credentials
nano .env

# Generate database migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

### Production Deployment

```bash
# Build the project
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
server/
├── config/
│   ├── env.ts              # Environment configuration
│   ├── db.ts               # Database setup
│   └── security.ts         # Security utilities
├── middleware/
│   ├── auth.ts             # Authentication
│   ├── rateLimit.ts        # Rate limiting
│   └── errorHandler.ts     # Error handling
├── services/
│   ├── ai-voice/           # Voice AI detection
│   ├── communication/      # SMS, WhatsApp, Email
│   ├── emergency/          # Emergency coordinator
│   └── location/           # Location tracking
├── websocket/
│   ├── index.ts            # WebSocket server
│   └── events.ts           # Event broadcasting
├── persistence/
│   └── fileStore.ts        # Persistent data storage
├── routes.ts               # API routes
└── index.ts                # Express app

shared/
└── schema.ts               # Drizzle ORM schema
```

## 🔧 Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# AI Services (optional - has fallback)
ASSEMBLY_AI_API_KEY=your_key_here
STANFORD_NLP_API_KEY=your_key_here
LLAMA_MODEL_PATH=/path/to/model.bin

# Communication (optional - can use mock)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_id

# Security (required)
JWT_SECRET=your_secret_min_32_chars
SESSION_SECRET=your_secret_min_32_chars
ENCRYPTION_KEY=your_key_min_32_chars
```

### Mock Services (Development)

Enable mock services for development without real API keys:

```bash
MOCK_SMS_ENABLED=true
MOCK_WHATSAPP_ENABLED=true
MOCK_VOICE_AI_ENABLED=true
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP and login

### User Profile
- `GET /api/user/profile` - Get user profile
- `POST /api/user/profile` - Create profile
- `PATCH /api/user/profile` - Update profile

### Emergency Alerts
- `POST /api/emergency-alerts` - Trigger emergency
- `GET /api/emergency-alerts` - Get alerts
- `PATCH /api/emergency-alerts/:id/respond` - Mark responding
- `PATCH /api/emergency-alerts/:id/resolve` - Resolve emergency

### Emergency Contacts
- `GET /api/emergency-contacts` - List contacts
- `POST /api/emergency-contacts` - Add contact
- `PATCH /api/emergency-contacts/:id` - Update contact
- `DELETE /api/emergency-contacts/:id` - Delete contact

### Location
- `POST /api/location/update` - Update location
- `GET /api/location/latest` - Get latest location

### Family Dashboard
- `POST /api/parent/connect-child` - Connect to child
- `GET /api/parent/children` - List children
- `GET /api/parent/emergency-alerts` - Get children's alerts

### IoT Devices
- `GET /api/iot-devices` - List devices
- `POST /api/iot-devices` - Add device

### Destinations
- `GET /api/destinations` - List destinations
- `POST /api/destinations` - Add destination

### Home Location
- `GET /api/user/home-location` - Get home location
- `POST /api/user/home-location` - Set home location

### Voice AI
- `POST /api/voice/process` - Process audio for distress

### Health
- `GET /health` - Server health check

## 🔌 WebSocket Events

### Client → Server
- `location:update` - Send location update
- `emergency:trigger` - Trigger emergency
- `emergency:resolve` - Resolve emergency
- `family:subscribe` - Subscribe to child updates
- `voice:detection` - Voice AI detection result
- `webrtc:offer` - WebRTC offer
- `webrtc:answer` - WebRTC answer
- `webrtc:ice-candidate` - ICE candidate

### Server → Client
- `connected` - Connection confirmation
- `emergency:triggered` - Emergency triggered
- `emergency:resolved` - Emergency resolved
- `emergency:alert` - Emergency alert broadcast
- `location:update` - Location update broadcast
- `webrtc:offer` - WebRTC offer
- `webrtc:answer` - WebRTC answer
- `webrtc:ice-candidate` - ICE candidate

## 🧠 AI Voice Recognition Pipeline

1. **Speech-to-Text** (AssemblyAI)
   - Converts audio to text
   - Supports Hindi + English
   - Returns confidence scores

2. **Linguistic Analysis** (Stanford CoreNLP)
   - Sentence separation
   - POS tagging
   - Entity recognition

3. **Distress Detection** (Llama 2 / Rule-based)
   - Analyzes context
   - Detects distress keywords
   - Returns distress score (0-1)

4. **Emergency Trigger**
   - Triggers if score > threshold (0.85)
   - Sends notifications
   - Starts location tracking

## ✅ Service Checklists

**Twilio not working?**
- Verify your account SID and auth token
- Check that your phone number is verified
- Ensure sufficient account balance

**WhatsApp not working?**
- Verify your Business account is approved
- Check phone number ID is correct
- Ensure recipient numbers are in your test list

**Google APIs not working?**
- Enable the required APIs in Google Cloud Console
- Check API key restrictions and permissions
- Verify billing is enabled for your project

**Email not working?**
- Check SMTP credentials are correct
- Verify sender email is verified
- Check spam/junk folders for test emails

## 🆓 Free Tier Limits

- **Twilio**: $15.50 trial credit
- **WhatsApp**: Limited to verified numbers during testing
- **SendGrid**: 100 emails/day free
- **Google APIs**: $200 monthly credit for new accounts
- **Assembly AI**: 5 hours free transcription monthly
   - Broadcasts to family

## 🚨 Emergency Response Flow

1. Emergency triggered (voice/manual/IoT)
2. Create alert in database
3. Parallel execution:
   - Send SMS to contacts
   - Send WhatsApp messages
   - Make voice calls to primary contacts
   - Start location tracking
   - Broadcast to family dashboard
4. Complete in <2 seconds

## 📊 Database Schema

### Main Tables
- `users` - User profiles
- `emergency_alerts` - Emergency incidents
- `emergency_contacts` - Trusted contacts
- `family_connections` - Parent-child links
- `location_tracking` - Location history
- `safe_zones` - Geofenced areas
- `iot_devices` - Connected wearables
- `voice_patterns` - AI training data

## 🔒 Security

- JWT authentication
- AES-256-GCM encryption
- bcrypt password hashing
- Rate limiting
- CORS protection
- Security headers
- Session management

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
psql -U postgres

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

### Voice AI Not Working
```bash
# Enable mock mode for development
MOCK_VOICE_AI_ENABLED=true

# Or configure real services
ASSEMBLY_AI_API_KEY=your_key
```

### SMS/WhatsApp Not Sending
```bash
# Use mock mode
MOCK_SMS_ENABLED=true
MOCK_WHATSAPP_ENABLED=true

# Or configure Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
```

## 📝 License

Sakhi Suraksha - Women's Safety Platform
