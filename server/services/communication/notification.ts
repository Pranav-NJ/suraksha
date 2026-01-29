import smsService from './sms.js';
import whatsappService from './whatsapp.js';
import { type EmergencyContact } from '../../db/schema';

export interface NotificationResult {
  sms: { success: number; failed: number };
  whatsapp: { success: number; failed: number };
  totalSent: number;
  totalFailed: number;
}

export class NotificationService {
  /**
   * Send emergency notifications to all contacts
   */
  async sendEmergencyNotifications(
    contacts: EmergencyContact[],
    userName: string,
    location: { latitude: number; longitude: number; address?: string }
  ): Promise<NotificationResult> {
    console.log(`📢 Sending emergency notifications to ${contacts.length} contacts...`);

    const activeContacts = contacts.filter(c => c.isActive);
    const phoneNumbers = activeContacts.map(c => c.phoneNumber);

    // Send SMS to all contacts (parallel)
    const smsPromise = smsService.sendBulkSMS(
      phoneNumbers,
      this.formatEmergencyMessage(userName, location)
    );

    // Send WhatsApp to all contacts (parallel)
    const whatsappPromise = whatsappService.sendBulkMessages(
      phoneNumbers,
      this.formatEmergencyMessage(userName, location)
    );

    // Also send location via WhatsApp
    const locationPromises = phoneNumbers.map(phone =>
      whatsappService.sendLocation(phone, {
        ...location,
        name: `${userName}'s Emergency Location`,
      })
    );

    // Wait for all notifications
    const [smsResults, whatsappResults, locationResults] = await Promise.all([
      smsPromise,
      whatsappPromise,
      Promise.all(locationPromises),
    ]);

    // Make emergency calls to primary contacts
    const primaryContacts = activeContacts.filter(c => c.isPrimary);
    await Promise.all(
      primaryContacts.map(contact =>
        smsService.makeEmergencyCall(contact.phoneNumber, userName)
      )
    );

    const result: NotificationResult = {
      sms: {
        success: smsResults.success,
        failed: smsResults.failed,
      },
      whatsapp: {
        success: whatsappResults.success + locationResults.filter(r => r.success).length,
        failed: whatsappResults.failed + locationResults.filter(r => !r.success).length,
      },
      totalSent: smsResults.success + whatsappResults.success,
      totalFailed: smsResults.failed + whatsappResults.failed,
    };

    console.log('✅ Emergency notifications sent:', result);
    return result;
  }

  /**
   * Send location update to contacts
   */
  async sendLocationUpdate(
    contacts: EmergencyContact[],
    userName: string,
    location: { latitude: number; longitude: number }
  ): Promise<void> {
    const phoneNumbers = contacts.filter(c => c.isActive).map(c => c.phoneNumber);

    // Send SMS location updates
    await Promise.all(
      phoneNumbers.map(phone =>
        smsService.sendLocationUpdate(phone, userName, location)
      )
    );

    // Send WhatsApp location
    await Promise.all(
      phoneNumbers.map(phone =>
        whatsappService.sendLocation(phone, {
          ...location,
          name: `${userName}'s Current Location`,
        })
      )
    );
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    const result = await smsService.sendOTP(phoneNumber, otp);
    return result.success;
  }

  /**
   * Send emergency resolved notification
   */
  async sendEmergencyResolved(
    contacts: EmergencyContact[],
    userName: string
  ): Promise<void> {
    const message = `✅ Emergency resolved - ${userName} is now safe. Thank you for your response.`;
    const phoneNumbers = contacts.filter(c => c.isActive).map(c => c.phoneNumber);

    await Promise.all([
      smsService.sendBulkSMS(phoneNumbers, message),
      whatsappService.sendBulkMessages(phoneNumbers, message),
    ]);
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
}

export default new NotificationService();
