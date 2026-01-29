import { z } from "zod";

// --- Frontend Validation Schemas ---
// These are pure Zod schemas for form validation, safe for the browser.

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
    createdAt: z.string().or(z.date()).optional(),
    updatedAt: z.string().or(z.date()).optional(),
});

export const insertUserSchema = userSchema.omit({
    createdAt: true,
    updatedAt: true
});

export const upsertUserSchema = userSchema.omit({
    createdAt: true,
    updatedAt: true
});

export const emergencyContactSchema = z.object({
    id: z.number(),
    userId: z.string(),
    name: z.string().min(1, "Name is required"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
    email: z.string().email().nullable().optional().or(z.literal("")),
    relationship: z.string().nullable().optional(),
    priority: z.number().default(0),
    isPrimary: z.boolean().default(false),
    isActive: z.boolean().default(true),
    createdAt: z.string().or(z.date()).optional(),
});

export const insertEmergencyContactSchema = emergencyContactSchema.omit({
    id: true,
    createdAt: true
});

export const destinationSchema = z.object({
    id: z.number(),
    userId: z.string(),
    name: z.string().min(1, "Name is required"),
    address: z.string().min(1, "Address is required"),
    latitude: z.number(),
    longitude: z.number(),
    isFavorite: z.boolean().default(false),
    createdAt: z.string().or(z.date()).optional(),
});

export const insertDestinationSchema = destinationSchema.omit({
    id: true,
    createdAt: true
});

export const safeZoneSchema = z.object({
    id: z.number(),
    userId: z.string().nullable().optional(),
    name: z.string().min(1, "Name is required"),
    latitude: z.number(),
    longitude: z.number(),
    radius: z.number().min(10, "Radius must be at least 10 meters"),
    isActive: z.boolean().default(true),
    createdAt: z.string().or(z.date()).optional(),
});

export const insertSafeZoneSchema = safeZoneSchema.omit({
    id: true,
    createdAt: true
});

export const iotDeviceSchema = z.object({
    id: z.number(),
    userId: z.string(),
    deviceName: z.string().min(1, "Device name is required"),
    deviceType: z.string().min(1, "Device type is required"),
    macAddress: z.string().nullable().optional(),
    bluetoothId: z.string().nullable().optional(),
    isConnected: z.boolean().default(false),
    batteryLevel: z.number().nullable().optional(),
    firmwareVersion: z.string().nullable().optional(),
    lastConnected: z.string().or(z.date()).nullable().optional(),
    connectionStatus: z.string().default("disconnected"),
    createdAt: z.string().or(z.date()).optional(),
    updatedAt: z.string().or(z.date()).optional(),
});

export const insertIotDeviceSchema = iotDeviceSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});

export const communityAlertSchema = z.object({
    id: z.number(),
    userId: z.string().nullable().optional(),
    type: z.string(),
    description: z.string().min(1, "Description is required"),
    latitude: z.number(),
    longitude: z.number(),
    severity: z.string().default("medium"),
    verified: z.boolean().default(false),
    reportedBy: z.string().default("anonymous"),
    createdAt: z.string().or(z.date()).optional(),
});

export const insertCommunityAlertSchema = communityAlertSchema.omit({
    id: true,
    createdAt: true
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
    createdAt: z.string().or(z.date()).optional(),
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

export const homeLocationSchema = z.object({
    id: z.number(),
    userId: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().nullable().optional(),
    createdAt: z.string().or(z.date()).optional(),
    updatedAt: z.string().or(z.date()).optional(),
});

export const insertHomeLocationSchema = homeLocationSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});

export const familyConnectionSchema = z.object({
    id: z.number(),
    parentUserId: z.string(),
    childUserId: z.string(),
    relationshipType: z.string().default("parent-child"),
    status: z.string().default("active"),
    permissions: z.any().default({ location: true, emergency: true, monitoring: true }),
    inviteCode: z.string().nullable().optional(),
    inviteExpiry: z.string().or(z.date()).nullable().optional(),
    acceptedAt: z.string().or(z.date()).nullable().optional(),
    createdAt: z.string().or(z.date()).optional(),
});

export const insertFamilyConnectionSchemaV2 = familyConnectionSchema.omit({
    id: true,
    createdAt: true,
    acceptedAt: true,
});

// types from these schemas
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type EmergencyContact = z.infer<typeof emergencyContactSchema>;
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type Destination = z.infer<typeof destinationSchema>;
export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type SafeZone = z.infer<typeof safeZoneSchema>;
export type InsertSafeZone = z.infer<typeof insertSafeZoneSchema>;
export type IotDevice = z.infer<typeof iotDeviceSchema>;
export type InsertIotDevice = z.infer<typeof insertIotDeviceSchema>;
export type CommunityAlert = z.infer<typeof communityAlertSchema>;
export type InsertCommunityAlert = z.infer<typeof insertCommunityAlertSchema>;
export type EmergencyAlert = z.infer<typeof emergencyAlertSchema>;
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
export type HomeLocation = z.infer<typeof homeLocationSchema>;
export type InsertHomeLocation = z.infer<typeof insertHomeLocationSchema>;
export type FamilyConnection = z.infer<typeof familyConnectionSchema>;
export type InsertFamilyConnection = z.infer<typeof insertFamilyConnectionSchemaV2>;
