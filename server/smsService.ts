import fetch from 'node-fetch';

// Twilio SMS Service
export async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.error('Twilio credentials not configured');
      return false;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    // Format phone number to international format if needed
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber.replace(/[^\d]/g, '')}`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    console.log(`Sending SMS to ${formattedNumber} via Twilio...`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: formattedNumber,
        Body: message
      })
    });

    if (response.ok) {
      const result = await response.json() as any;
      console.log(`SMS sent successfully to ${formattedNumber}, SID: ${result.sid}`);
      return true;
    } else {
      const error = await response.text();
      console.error(`Twilio SMS error for ${formattedNumber}:`, error);
      return false;
    }
  } catch (error) {
    console.error(`Failed to send SMS to ${phoneNumber}:`, error);
    return false;
  }
}

// Send SMS OTP
export async function sendSMSOTP(phoneNumber: string, otp: string): Promise<boolean> {
  const message = `🔐 Sakhi Suraksha Verification

Your verification code is: ${otp}

This code will expire in 10 minutes.
Do not share this code with anyone.

Stay safe!`;

  return await sendSMS(phoneNumber, message);
}

// Send SMS Emergency Alert
export async function sendSMSEmergency(phoneNumber: string, location: string | { lat?: number; lng?: number; address?: string }, whatsappNumber?: string): Promise<boolean> {
  const locationText = typeof location === 'string'
    ? location
    : (location?.address || [location?.lat, location?.lng].filter(Boolean).join(', '));

  const normalizedWhatsApp = whatsappNumber && /^[+\d][\d\s-]+$/.test(whatsappNumber) ? whatsappNumber : '';
  const whatsappInfo = normalizedWhatsApp ? ` | WhatsApp: ${normalizedWhatsApp}` : '';

  const message = `🚨 SAKHI SURAKSHA EMERGENCY ALERT 🚨\n` +
    
    `Location: ${locationText || 'Location unavailable'}\n` +
    `Time: ${new Date().toLocaleString()}\n\n`;

  return await sendSMS(phoneNumber, message);
}

// Send SMS with Live Location Link
export async function sendSMSLiveLocation(phoneNumber: string, locationUrl: string, streamUrl?: string, whatsappNumber?: string): Promise<boolean> {
  const whatsappInfo = whatsappNumber ? ` | WhatsApp: ${whatsappNumber}` : '';
  const streamInfo = streamUrl ? ` | Stream: ${streamUrl}` : '';

  const message = `LIVE LOCATION:
${locationUrl}${streamInfo}${whatsappInfo}`;

  return await sendSMS(phoneNumber, message);
}