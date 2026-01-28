import twilio from 'twilio';
import { config } from '../../config/env.js';

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SMSService {
  private client: any;
  private fromNumber: string | undefined;
  private isConfigured: boolean = false;

  constructor() {
    // Only initialize Twilio if not in mock mode and credentials are provided
    if (!config.mock.smsEnabled && config.twilio.accountSid && config.twilio.authToken) {
      this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
      this.fromNumber = config.twilio.phoneNumber;
      this.isConfigured = true;
      console.log('✅ Twilio SMS service initialized');
    } else if (config.mock.smsEnabled) {
      console.log('🔧 SMS service running in MOCK mode');
    } else {
      console.warn('⚠️  Twilio credentials not configured - SMS disabled');
    }
  }

  /**
   * Send emergency alert SMS
   */
  async sendEmergencyAlert(
    phoneNumber: string,
    userName: string,
    location: { latitude: number; longitude: number; address?: string }
  ): Promise<SMSResult> {
    const message = this.formatEmergencyMessage(userName, location);
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send OTP SMS
   */
  async sendOTP(phoneNumber: string, otp: string): Promise<SMSResult> {
    const message = `Your Sakhi Suraksha verification code is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send location update SMS
   */
  async sendLocationUpdate(
    phoneNumber: string,
    userName: string,
    location: { latitude: number; longitude: number }
  ): Promise<SMSResult> {
    const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    const message = `🚨 LOCATION UPDATE\n${userName} is at:\n${mapsUrl}\nTime: ${new Date().toLocaleString()}`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send generic SMS
   */
  async sendSMS(phoneNumber: string, message: string): Promise<SMSResult> {
    // Mock mode
    if (config.mock.smsEnabled || !this.isConfigured) {
      console.log('📱 [MOCK SMS]', { to: phoneNumber, message });
      return { success: true, messageId: 'mock_' + Date.now() };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber,
      });

      console.log('✅ SMS sent:', result.sid);
      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error: any) {
      console.error('❌ SMS sending failed:', error);
      return {
        success: false,
        error: error.message || 'SMS sending failed',
      };
    }
  }

  /**
   * Send bulk SMS to multiple contacts
   */
  async sendBulkSMS(
    phoneNumbers: string[],
    message: string
  ): Promise<{ success: number; failed: number; results: SMSResult[] }> {
    const results = await Promise.all(
      phoneNumbers.map(phone => this.sendSMS(phone, message))
    );

    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return { success, failed, results };
  }

  /**
   * Format emergency message
   */
  private formatEmergencyMessage(
    userName: string,
    location: { latitude: number; longitude: number; address?: string }
  ): string {
    const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    
    return `🚨 EMERGENCY ALERT from Sakhi Suraksha

${userName} needs IMMEDIATE HELP!

📍 Location: ${location.address || 'See map'}
🗺️  Map: ${mapsUrl}
🕒 Time: ${new Date().toLocaleString()}

This is an automated emergency alert. Please respond immediately.`;
  }

  /**
   * Make emergency voice call
   */
  async makeEmergencyCall(
    phoneNumber: string,
    userName: string
  ): Promise<SMSResult> {
    if (config.mock.smsEnabled || !this.isConfigured) {
      console.log('📞 [MOCK CALL]', { to: phoneNumber, user: userName });
      return { success: true, messageId: 'mock_call_' + Date.now() };
    }

    try {
      const call = await this.client.calls.create({
        url: 'http://demo.twilio.com/docs/voice.xml', // Replace with your TwiML endpoint
        to: phoneNumber,
        from: this.fromNumber,
      });

      console.log('✅ Emergency call initiated:', call.sid);
      return {
        success: true,
        messageId: call.sid,
      };
    } catch (error: any) {
      console.error('❌ Emergency call failed:', error);
      return {
        success: false,
        error: error.message || 'Call failed',
      };
    }
  }
}

export default new SMSService();
