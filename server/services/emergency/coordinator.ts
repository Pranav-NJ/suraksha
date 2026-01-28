import db from '../../config/db.js';
import { emergencyAlerts, emergencyContacts, users, locationTracking } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import notificationService from '../communication/notification.js';
import { broadcastEmergencyAlert } from '../../websocket/events.js';
import { config } from '../../config/env.js';

export interface EmergencyTrigger {
  userId: string;
  triggerType: 'voice_ai' | 'manual' | 'sensor' | 'shake' | 'iot' | 'button' | 'voice_detection';
  latitude?: number;
  longitude?: number;
  address?: string;
  transcription?: string;
  audioAnalysis?: any;
  scenario?: string;
  confidence?: number;
}

export class EmergencyCoordinator {
  /**
   * Main emergency response orchestration
   */
  async triggerEmergency(trigger: EmergencyTrigger): Promise<any> {
    const startTime = Date.now();
    console.log('🚨 Emergency triggered:', trigger.triggerType);

    try {
      // Step 1: Create emergency alert in database
      const alert = await this.createEmergencyAlert(trigger);

      // Step 2: Get user information and emergency contacts
      const [user, contacts] = await Promise.all([
        this.getUserInfo(trigger.userId),
        this.getEmergencyContacts(trigger.userId),
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      // Step 3: Parallel execution for speed
      await Promise.all([
        // 3a: Send notifications to all contacts
        this.sendNotifications(user, contacts, trigger),
        
        // 3b: Start location tracking
        this.startLocationTracking(trigger.userId, alert.id),
        
        // 3c: Broadcast to family dashboard via WebSocket
        this.broadcastToFamily(trigger.userId, alert),
      ]);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Emergency response completed in ${processingTime}ms`);

      return {
        success: true,
        alertId: alert.id,
        notificationsSent: contacts.length * 2, // SMS + WhatsApp
        processingTime,
      };
    } catch (error) {
      console.error('❌ Emergency response failed:', error);
      throw error;
    }
  }

  /**
   * Create emergency alert record
   */
  private async createEmergencyAlert(trigger: EmergencyTrigger): Promise<any> {
    const [alert] = await db.insert(emergencyAlerts).values({
      userId: trigger.userId,
      triggerType: trigger.triggerType,
      scenario: trigger.scenario,
      confidenceScore: trigger.confidence,
      transcription: trigger.transcription,
      audioAnalysis: trigger.audioAnalysis,
      latitude: trigger.latitude,
      longitude: trigger.longitude,
      address: trigger.address,
      status: 'active',
      isResolved: false,
      notificationsSent: 0,
    }).returning();

    return alert;
  }

  /**
   * Get user information
   */
  private async getUserInfo(userId: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user;
  }

  /**
   * Get emergency contacts for user
   */
  private async getEmergencyContacts(userId: string): Promise<any[]> {
    return db.select()
      .from(emergencyContacts)
      .where(and(
        eq(emergencyContacts.userId, userId),
        eq(emergencyContacts.isActive, true)
      ))
      .orderBy(desc(emergencyContacts.isPrimary), desc(emergencyContacts.priority));
  }

  /**
   * Send notifications to all emergency contacts
   */
  private async sendNotifications(user: any, contacts: any[], trigger: EmergencyTrigger): Promise<void> {
    if (contacts.length === 0) {
      console.warn('⚠️  No emergency contacts found for user');
      return;
    }

    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
    const location = {
      latitude: trigger.latitude || 0,
      longitude: trigger.longitude || 0,
      address: trigger.address,
    };

    await notificationService.sendEmergencyNotifications(contacts, userName, location);
  }

  /**
   * Start real-time location tracking
   */
  private async startLocationTracking(userId: string, emergencyAlertId: number): Promise<void> {
    // Location tracking will be handled by WebSocket in real-time
    // This just initializes the tracking
    console.log('📍 Location tracking started for emergency:', emergencyAlertId);
  }

  /**
   * Broadcast emergency to family members via WebSocket
   */
  private async broadcastToFamily(userId: string, alert: any): Promise<void> {
    // Broadcast via WebSocket to connected family members
    broadcastEmergencyAlert(userId, alert);
  }

  /**
   * Update emergency alert status
   */
  async updateAlertStatus(alertId: number, status: string): Promise<void> {
    await db.update(emergencyAlerts)
      .set({
        status,
        updatedAt: new Date(),
        ...(status === 'resolved' ? { isResolved: true, resolvedAt: new Date() } : {}),
      })
      .where(eq(emergencyAlerts.id, alertId));

    console.log(`✅ Alert ${alertId} status updated to: ${status}`);
  }

  /**
   * Resolve emergency
   */
  async resolveEmergency(alertId: number, userId: string): Promise<void> {
    await this.updateAlertStatus(alertId, 'resolved');

    // Notify contacts that emergency is resolved
    const [user, contacts] = await Promise.all([
      this.getUserInfo(userId),
      this.getEmergencyContacts(userId),
    ]);

    if (user && contacts.length > 0) {
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      await notificationService.sendEmergencyResolved(contacts, userName);
    }
  }

  /**
   * Get active emergency for user
   */
  async getActiveEmergency(userId: string): Promise<any> {
    const [alert] = await db.select()
      .from(emergencyAlerts)
      .where(and(
        eq(emergencyAlerts.userId, userId),
        eq(emergencyAlerts.status, 'active')
      ))
      .orderBy(desc(emergencyAlerts.createdAt))
      .limit(1);

    return alert;
  }

  /**
   * Save location update during emergency
   */
  async saveLocationUpdate(
    userId: string,
    emergencyAlertId: number,
    location: { latitude: number; longitude: number; accuracy?: number }
  ): Promise<void> {
    await db.insert(locationTracking).values({
      userId,
      emergencyAlertId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      isEmergency: true,
      timestamp: new Date(),
    });

    // Broadcast location update to family
    broadcastEmergencyAlert(userId, {
      type: 'location_update',
      location,
      timestamp: new Date(),
    });
  }
}

export default new EmergencyCoordinator();
