import { z } from "zod";

// --- Base Schemas ---
// These mirror the database structure but use pure Zod to be browser-safe

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  profileImageUrl: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  whatsappNumber: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
  isVerified: z.boolean().default(false),
  familyConnectionCode: z.string().nullable().optional(),
  emergencyMessage: z.string().default("Emergency! I need help. This is an automated message from Sakhi Suraksha."),
  isLocationSharingActive: z.boolean().default(false),
  theme: z.string().default("light"),
  voiceActivationEnabled: z.boolean().default(true),
  shakeDetectionEnabled: z.boolean().default(true),
  communityAlertsEnabled: z.boolean().default(true),
  soundAlertsEnabled: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const emergencyContactSchema = z.object({
  id: z.number(),
  userId: z.string(),
  name: z.string(),
  phoneNumber: z.string(),
  email: z.string().nullable().optional(),
  relationship: z.string().nullable().optional(),
  priority: z.number().default(0),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
});

export const emergencyAlertSchema = z.object({
  id: z.number(),
  userId: z.string(),
  triggerType: z.string(),
  scenario: z.string().nullable().optional(),
  confidenceScore: z.number().nullable().optional(),
  transcription: z.string().nullable().optional(),
  audioAnalysis: z.any().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
  audioRecordingUrl: z.string().nullable().optional(),
  videoRecordingUrl: z.string().nullable().optional(),
  deviceInfo: z.string().nullable().optional(),
  status: z.string().default("active"),
  isResolved: z.boolean().default(false),
  notificationsSent: z.number().default(0),
  createdAt: z.date().optional(),
});

export const communityAlertSchema = z.object({
  id: z.number(),
  userId: z.string().nullable().optional(),
  type: z.string(),
  description: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  severity: z.string().default("medium"),
  verified: z.boolean().default(false),
  reportedBy: z.string().default("anonymous"),
  createdAt: z.date().optional(),
});

export const safeZoneSchema = z.object({
  id: z.number(),
  userId: z.string().nullable().optional(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number(),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
});

export const liveStreamSchema = z.object({
  id: z.number(),
  userId: z.string(),
  emergencyAlertId: z.number().nullable().optional(),
  streamUrl: z.string(),
  shareLink: z.string(),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  endedAt: z.date().nullable().optional(),
});

export const destinationSchema = z.object({
  id: z.number(),
  userId: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  isFavorite: z.boolean().default(false),
  createdAt: z.date().optional(),
});

export const homeLocationSchema = z.object({
  id: z.number(),
  userId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const otpVerificationSchema = z.object({
  id: z.number(),
  identifier: z.string(),
  type: z.string(),
  otp: z.string(),
  isVerified: z.boolean().default(false),
  expiresAt: z.date(),
  createdAt: z.date().optional(),
});

export const iotDeviceSchema = z.object({
  id: z.number(),
  userId: z.string(),
  deviceName: z.string(),
  deviceType: z.string(),
  macAddress: z.string().nullable().optional(),
  bluetoothId: z.string().nullable().optional(),
  isConnected: z.boolean().default(false),
  batteryLevel: z.number().nullable().optional(),
  firmwareVersion: z.string().nullable().optional(),
  lastConnected: z.date().nullable().optional(),
  connectionStatus: z.string().default("disconnected"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const healthMetricSchema = z.object({
  id: z.number(),
  userId: z.string(),
  deviceId: z.number().nullable().optional(),
  heartRate: z.number().nullable().optional(),
  bloodPressureSystolic: z.number().nullable().optional(),
  bloodPressureDiastolic: z.number().nullable().optional(),
  oxygenSaturation: z.number().nullable().optional(),
  skinTemperature: z.number().nullable().optional(),
  stressLevel: z.number().nullable().optional(),
  stepCount: z.number().nullable().optional(),
  caloriesBurned: z.number().nullable().optional(),
  sleepQuality: z.number().nullable().optional(),
  activityLevel: z.string().nullable().optional(),
  timestamp: z.date().optional(),
  createdAt: z.date().optional(),
});

export const stressAnalysisSchema = z.object({
  id: z.number(),
  userId: z.string(),
  overallStressScore: z.number(),
  heartRateVariability: z.number().nullable().optional(),
  skinConductance: z.number().nullable().optional(),
  movementPattern: z.string().nullable().optional(),
  voiceStressIndicators: z.any().nullable().optional(),
  behaviorPattern: z.string().nullable().optional(),
  riskLevel: z.string(),
  recommendedActions: z.array(z.string()).nullable().optional(),
  triggerFactors: z.array(z.string()).nullable().optional(),
  analysisTimestamp: z.date().optional(),
  createdAt: z.date().optional(),
});

export const iotEmergencyTriggerSchema = z.object({
  id: z.number(),
  userId: z.string(),
  deviceId: z.number().nullable().optional(),
  triggerType: z.string(),
  severity: z.string(),
  sensorData: z.any().nullable().optional(),
  location: z.any().nullable().optional(),
  isResolved: z.boolean().default(false),
  responseTime: z.number().nullable().optional(),
  emergencyAlertId: z.number().nullable().optional(),
  timestamp: z.date().optional(),
  createdAt: z.date().optional(),
});

export const familyConnectionSchema = z.object({
  id: z.number(),
  parentUserId: z.string(),
  childUserId: z.string(),
  relationshipType: z.string().default("parent-child"),
  status: z.string().default("active"),
  permissions: z.any().default({ location: true, emergency: true, monitoring: true }),
  inviteCode: z.string().nullable().optional(),
  inviteExpiry: z.date().nullable().optional(),
  acceptedAt: z.date().nullable().optional(),
  createdAt: z.date().optional(),
});

export const alertHistorySchema = z.object({
  id: z.number(),
  originalAlertId: z.number().nullable().optional(),
  userId: z.string(),
  parentUserId: z.string().nullable().optional(),
  triggerType: z.string(),
  message: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
  status: z.string(),
  resolvedAt: z.date().nullable().optional(),
  resolvedBy: z.string().nullable().optional(),
  responseTime: z.number().nullable().optional(),
  audioRecordingUrl: z.string().nullable().optional(),
  videoRecordingUrl: z.string().nullable().optional(),
  liveStreamUrl: z.string().nullable().optional(),
  emergencyContactsNotified: z.any().nullable().optional(),
  isArchived: z.boolean().default(false),
  createdAt: z.date().optional(),
  archivedAt: z.date().nullable().optional(),
});

export const parentNotificationSchema = z.object({
  id: z.number(),
  parentUserId: z.string(),
  childUserId: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  data: z.any().nullable().optional(),
  isRead: z.boolean().default(false),
  priority: z.string().default("normal"),
  createdAt: z.date().optional(),
  readAt: z.date().nullable().optional(),
});

export const familySettingsSchema = z.object({
  id: z.number(),
  familyId: z.string(),
  parentUserId: z.string(),
  childUserId: z.string(),
  autoLocationSharing: z.boolean().default(true),
  emergencyAutoNotify: z.boolean().default(true),
  safeZoneNotifications: z.boolean().default(true),
  allowLiveTracking: z.boolean().default(false),
  allowEmergencyOverride: z.boolean().default(true),
  quietHours: z.any().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const voicePatternSchema = z.object({
  id: z.number(),
  pattern: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const locationTrackingSchema = z.object({
  id: z.number(),
  userId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().nullable().optional(),
  altitude: z.number().nullable().optional(),
  heading: z.number().nullable().optional(),
  speed: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
  isEmergency: z.boolean().default(false),
  emergencyAlertId: z.number().nullable().optional(),
  batteryLevel: z.number().nullable().optional(),
  timestamp: z.date().optional(),
});

// --- Insert Schemas ---

export const insertUserSchema = userSchema.omit({
  createdAt: true,
  updatedAt: true
});

export const upsertUserSchema = userSchema.omit({
  createdAt: true,
  updatedAt: true
});

export const insertEmergencyContactSchema = emergencyContactSchema.omit({
  id: true,
  createdAt: true
});

export const insertEmergencyAlertSchema = emergencyAlertSchema.omit({
  id: true,
  createdAt: true
}).extend({
  latitude: z.union([z.number(), z.string().transform(Number)]).optional(),
  longitude: z.union([z.number(), z.string().transform(Number)]).optional(),
  triggerType: z.string().optional().default('manual_button'),
  userId: z.string().optional().default('demo-user')
});

export const insertCommunityAlertSchema = communityAlertSchema.omit({
  id: true,
  createdAt: true
});

export const insertSafeZoneSchema = safeZoneSchema.omit({
  id: true,
  createdAt: true
});

export const insertLiveStreamSchema = liveStreamSchema.omit({
  id: true,
  createdAt: true
});

export const insertDestinationSchema = destinationSchema.omit({
  id: true,
  createdAt: true
});

export const insertHomeLocationSchema = homeLocationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertOtpVerificationSchema = otpVerificationSchema.omit({
  id: true,
  createdAt: true
});

export const insertIotDeviceSchema = iotDeviceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertHealthMetricSchema = healthMetricSchema.omit({
  id: true,
  createdAt: true,
  timestamp: true
});

export const insertStressAnalysisSchema = stressAnalysisSchema.omit({
  id: true,
  createdAt: true,
  analysisTimestamp: true
});

export const insertIotEmergencyTriggerSchema = iotEmergencyTriggerSchema.omit({
  id: true,
  createdAt: true,
  timestamp: true
});

export const insertFamilyConnectionSchemaV2 = familyConnectionSchema.omit({
  id: true,
  createdAt: true,
  acceptedAt: true,
});

export const insertParentNotificationSchema = parentNotificationSchema.omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertFamilySettingsSchema = familySettingsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// --- Types ---

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type EmergencyContact = z.infer<typeof emergencyContactSchema>;
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type EmergencyAlert = z.infer<typeof emergencyAlertSchema>;
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
export type CommunityAlert = z.infer<typeof communityAlertSchema>;
export type InsertCommunityAlert = z.infer<typeof insertCommunityAlertSchema>;
export type SafeZone = z.infer<typeof safeZoneSchema>;
export type InsertSafeZone = z.infer<typeof insertSafeZoneSchema>;
export type LiveStream = z.infer<typeof liveStreamSchema>;
export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
export type Destination = z.infer<typeof destinationSchema>;
export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type HomeLocation = z.infer<typeof homeLocationSchema>;
export type InsertHomeLocation = z.infer<typeof insertHomeLocationSchema>;
export type OtpVerification = z.infer<typeof otpVerificationSchema>;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;
export type IotDevice = z.infer<typeof iotDeviceSchema>;
export type InsertIotDevice = z.infer<typeof insertIotDeviceSchema>;
export type HealthMetric = z.infer<typeof healthMetricSchema>;
export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;
export type StressAnalysis = z.infer<typeof stressAnalysisSchema>;
export type InsertStressAnalysis = z.infer<typeof insertStressAnalysisSchema>;
export type IotEmergencyTrigger = z.infer<typeof iotEmergencyTriggerSchema>;
export type InsertIotEmergencyTrigger = z.infer<typeof insertIotEmergencyTriggerSchema>;
export type FamilyConnection = z.infer<typeof familyConnectionSchema>;
export type InsertFamilyConnection = z.infer<typeof insertFamilyConnectionSchemaV2>;
export type ParentNotification = z.infer<typeof parentNotificationSchema>;
export type InsertParentNotification = z.infer<typeof insertParentNotificationSchema>;
export type FamilySettings = z.infer<typeof familySettingsSchema>;
export type InsertFamilySettings = z.infer<typeof insertFamilySettingsSchema>;
export type VoicePattern = z.infer<typeof voicePatternSchema>;
export type LocationTracking = z.infer<typeof locationTrackingSchema>;
