import db from '../../config/db.js';
import { locationTracking, safeZones } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { config } from '../../config/env.js';

export class LocationService {
  /**
   * Save location update
   */
  async saveLocation(
    userId: string,
    location: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      altitude?: number;
      heading?: number;
      speed?: number;
      address?: string;
      isEmergency?: boolean;
      emergencyAlertId?: number;
      batteryLevel?: number;
    }
  ): Promise<void> {
    await db.insert(locationTracking).values({
      userId,
      ...location,
      timestamp: new Date(),
    });
  }

  /**
   * Get latest location for user
   */
  async getLatestLocation(userId: string): Promise<any> {
    const [location] = await db.select()
      .from(locationTracking)
      .where(eq(locationTracking.userId, userId))
      .orderBy(desc(locationTracking.timestamp))
      .limit(1);

    return location;
  }

  /**
   * Get location history for user
   */
  async getLocationHistory(
    userId: string,
    limit: number = 100
  ): Promise<any[]> {
    return db.select()
      .from(locationTracking)
      .where(eq(locationTracking.userId, userId))
      .orderBy(desc(locationTracking.timestamp))
      .limit(limit);
  }

  /**
   * Get emergency location trail
   */
  async getEmergencyLocationTrail(emergencyAlertId: number): Promise<any[]> {
    return db.select()
      .from(locationTracking)
      .where(eq(locationTracking.emergencyAlertId, emergencyAlertId))
      .orderBy(desc(locationTracking.timestamp));
  }

  /**
   * Check if location is in safe zone
   */
  async checkSafeZones(
    userId: string,
    location: { latitude: number; longitude: number }
  ): Promise<{ inSafeZone: boolean; zone?: any }> {
    const zones = await db.select()
      .from(safeZones)
      .where(and(
        eq(safeZones.userId, userId),
        eq(safeZones.isActive, true)
      ));

    for (const zone of zones) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        zone.latitude!,
        zone.longitude!
      );

      if (distance <= (zone.radius || 200)) {
        return { inSafeZone: true, zone };
      }
    }

    return { inSafeZone: false };
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Start continuous location tracking (15s intervals during emergency)
   */
  startEmergencyTracking(
    userId: string,
    emergencyAlertId: number,
    onLocationUpdate: (location: any) => void
  ): NodeJS.Timeout {
    return setInterval(async () => {
      // Location will be pushed from client via WebSocket
      // This is just a placeholder for server-side interval
    }, config.emergency.locationUpdateInterval);
  }

  /**
   * Stop location tracking
   */
  stopTracking(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
  }
}

export default new LocationService();
