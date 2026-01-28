declare module "./smsService" {
  export function sendSMS(phoneNumber: string, message: string): Promise<boolean>;
  export function sendSMSOTP(phoneNumber: string, otp: string): Promise<boolean>;
  export function sendSMSEmergency(phoneNumber: string, message: string): Promise<boolean>;
  export function sendSMSLiveLocation(phoneNumber: string, location: string): Promise<boolean>;
}