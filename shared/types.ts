/**
 * Pure TypeScript interfaces representing the core data structures common 
 * to both frontend and backend. These contain NO Zod schemas or logic 
 * to ensure maximum compatibility and zero build-time side effects.
 */

export interface User {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
    phoneNumber?: string | null;
    whatsappNumber?: string | null;
    password?: string | null;
    isVerified: boolean;
    familyConnectionCode?: string | null;
    emergencyMessage: string;
    isLocationSharingActive: boolean;
    theme: string;
    voiceActivationEnabled: boolean;
    shakeDetectionEnabled: boolean;
    communityAlertsEnabled: boolean;
    soundAlertsEnabled: boolean;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface EmergencyContact {
    id: number;
    userId: string;
    name: string;
    phoneNumber: string;
    email?: string | null;
    relationship?: string | null;
    priority: number;
    isPrimary: boolean;
    isActive: boolean;
    createdAt?: string | Date;
}

export interface EmergencyAlert {
    id: number;
    userId: string;
    triggerType: string;
    scenario?: string | null;
    confidenceScore?: number | null;
    transcription?: string | null;
    audioAnalysis?: any;
    latitude?: number | null;
    longitude?: number | null;
    address?: string | null;
    audioRecordingUrl?: string | null;
    videoRecordingUrl?: string | null;
    deviceInfo?: string | null;
    status: string;
    isResolved: boolean;
    notificationsSent: number;
    createdAt?: string | Date;
}

export interface CommunityAlert {
    id: number;
    userId?: string | null;
    type: string;
    description: string;
    latitude: number;
    longitude: number;
    severity: string;
    verified: boolean;
    reportedBy: string;
    createdAt?: string | Date;
}

export interface SafeZone {
    id: number;
    userId?: string | null;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    isActive: boolean;
    createdAt?: string | Date;
}

export interface LiveStream {
    id: number;
    userId: string;
    emergencyAlertId?: number | null;
    streamUrl: string;
    shareLink: string;
    isActive: boolean;
    createdAt?: string | Date;
    endedAt?: string | Date | null;
}

export interface Destination {
    id: number;
    userId: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    isFavorite: boolean;
    createdAt?: string | Date;
}

export interface HomeLocation {
    id: number;
    userId: string;
    latitude: number;
    longitude: number;
    address?: string | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface IotDevice {
    id: number;
    userId: string;
    deviceName: string;
    deviceType: string;
    macAddress?: string | null;
    bluetoothId?: string | null;
    isConnected: boolean;
    batteryLevel?: number | null;
    firmwareVersion?: string | null;
    lastConnected?: string | Date | null;
    connectionStatus: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface HealthMetric {
    id: number;
    userId: string;
    deviceId?: number | null;
    heartRate?: number | null;
    bloodPressureSystolic?: number | null;
    bloodPressureDiastolic?: number | null;
    oxygenSaturation?: number | null;
    skinTemperature?: number | null;
    stressLevel?: number | null;
    stepCount?: number | null;
    caloriesBurned?: number | null;
    sleepQuality?: number | null;
    activityLevel?: string | null;
    timestamp?: string | Date;
    createdAt?: string | Date;
}

export interface StressAnalysis {
    id: number;
    userId: string;
    overallStressScore: number;
    heartRateVariability?: number | null;
    skinConductance?: number | null;
    movementPattern?: string | null;
    voiceStressIndicators?: any;
    behaviorPattern?: string | null;
    riskLevel: string;
    recommendedActions?: string[] | null;
    triggerFactors?: string[] | null;
    analysisTimestamp?: string | Date;
    createdAt?: string | Date;
}

export interface FamilyConnection {
    id: number;
    parentUserId: string;
    childUserId: string;
    relationshipType: string;
    status: string;
    permissions: any;
    inviteCode?: string | null;
    inviteExpiry?: string | Date | null;
    acceptedAt?: string | Date | null;
    createdAt?: string | Date;
}

export interface ParentNotification {
    id: number;
    parentUserId: string;
    childUserId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    priority: string;
    createdAt?: string | Date;
    readAt?: string | Date | null;
}

export interface FamilySettings {
    id: number;
    familyId: string;
    parentUserId: string;
    childUserId: string;
    autoLocationSharing: boolean;
    emergencyAutoNotify: boolean;
    safeZoneNotifications: boolean;
    allowLiveTracking: boolean;
    allowEmergencyOverride: boolean;
    quietHours?: any;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface LocationTracking {
    id: number;
    userId: string;
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    altitude?: number | null;
    heading?: number | null;
    speed?: number | null;
    address?: string | null;
    isEmergency: boolean;
    emergencyAlertId?: number | null;
    batteryLevel?: number | null;
    timestamp?: string | Date;
}
