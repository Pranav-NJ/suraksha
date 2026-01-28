declare module "./storage" {
  import { User, UpsertUser, EmergencyContact } from "./storage";

  export const db: any;
  export const eq: any;
  export const and: any;
  export const or: any;
  export const users: any;
  export const emergencyContacts: any;
  export const emergencyAlerts: any;
  export const communityAlerts: any;
  export const safeZones: any;
  export const liveStreams: any;
  export const destinations: any;
  export const homeLocations: any;
  export const otpVerifications: any;
  export const iotDevices: any;
  export const healthMetrics: any;
  export const stressAnalysis: any;
  export const iotEmergencyTriggers: any;
  export const familyConnections: any;
  export type User = User;
  export type UpsertUser = UpsertUser;
  export type EmergencyContact = EmergencyContact;
}