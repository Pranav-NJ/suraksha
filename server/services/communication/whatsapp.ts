import axios from 'axios';
import { config } from '../../config/env.js';

interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class WhatsAppService {
  private apiUrl = 'https://graph.facebook.com/v18.0';
  private accessToken: string | undefined;
  private phoneNumberId: string | undefined;
  private isConfigured: boolean = false;

  constructor() {
    // Only configure WhatsApp if not in mock mode
    if (!config.mock.whatsappEnabled) {
      this.accessToken = config.whatsapp.accessToken;
      this.phoneNumberId = config.whatsapp.phoneNumberId;
      this.isConfigured = !!(this.accessToken && this.phoneNumberId);

      if (this.isConfigured) {
        console.log('✅ WhatsApp Business API initialized');
      } else {
        console.warn('⚠️  WhatsApp credentials not configured - WhatsApp disabled');
      }
    } else {
      console.log('🔧 WhatsApp service running in MOCK mode');
    }
  }

  /**
   * Send emergency alert via WhatsApp
   */
  async sendEmergencyAlert(
    phoneNumber: string,
    userName: string,
    location: { latitude: number; longitude: number; address?: string }
  ): Promise<WhatsAppResult> {
    const message = this.formatEmergencyMessage(userName, location);
    return this.sendTextMessage(phoneNumber, message);
  }

  /**
   * Send location via WhatsApp
   */
  async sendLocation(
    phoneNumber: string,
    location: { latitude: number; longitude: number; name?: string; address?: string }
  ): Promise<WhatsAppResult> {
    if (config.mock.whatsappEnabled || !this.isConfigured) {
      console.log('📱 [MOCK WhatsApp Location]', { to: phoneNumber, location });
      return { success: true, messageId: 'mock_wa_' + Date.now() };
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'location',
          location: {
            latitude: location.latitude.toString(),
            longitude: location.longitude.toString(),
            name: location.name || 'Emergency Location',
            address: location.address || `${location.latitude}, ${location.longitude}`,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ WhatsApp location sent:', response.data.messages[0].id);
      return {
        success: true,
        messageId: response.data.messages[0].id,
      };
    } catch (error: any) {
      console.error('❌ WhatsApp location send failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'WhatsApp send failed',
      };
    }
  }

  /**
   * Send text message via WhatsApp
   */
  async sendTextMessage(phoneNumber: string, message: string): Promise<WhatsAppResult> {
    if (config.mock.whatsappEnabled || !this.isConfigured) {
      console.log('📱 [MOCK WhatsApp]', { to: phoneNumber, message });
      return { success: true, messageId: 'mock_wa_' + Date.now() };
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ WhatsApp message sent:', response.data.messages[0].id);
      return {
        success: true,
        messageId: response.data.messages[0].id,
      };
    } catch (error: any) {
      console.error('❌ WhatsApp message failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'WhatsApp send failed',
      };
    }
  }

  /**
   * Send template message (for pre-approved templates)
   */
  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    parameters: string[]
  ): Promise<WhatsAppResult> {
    if (config.mock.whatsappEnabled || !this.isConfigured) {
      console.log('📱 [MOCK WhatsApp Template]', { to: phoneNumber, template: templateName });
      return { success: true, messageId: 'mock_wa_' + Date.now() };
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: parameters.map(p => ({ type: 'text', text: p })),
              },
            ],
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ WhatsApp template sent:', response.data.messages[0].id);
      return {
        success: true,
        messageId: response.data.messages[0].id,
      };
    } catch (error: any) {
      console.error('❌ WhatsApp template failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'WhatsApp template send failed',
      };
    }
  }

  /**
   * Send bulk WhatsApp messages
   */
  async sendBulkMessages(
    phoneNumbers: string[],
    message: string
  ): Promise<{ success: number; failed: number; results: WhatsAppResult[] }> {
    const results = await Promise.all(
      phoneNumbers.map(phone => this.sendTextMessage(phone, message))
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
    
    return `🚨 *EMERGENCY ALERT* from Sakhi Suraksha

*${userName}* needs *IMMEDIATE HELP!*

📍 *Location:* ${location.address || 'See map link'}
🗺️  *Map:* ${mapsUrl}
🕒 *Time:* ${new Date().toLocaleString()}

_This is an automated emergency alert. Please respond immediately._`;
  }
}

export default new WhatsAppService();
