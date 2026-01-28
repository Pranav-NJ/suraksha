declare module "./whatsappService" {
  export function generateOTP(): string;
  export function sendWhatsAppOTP(phoneNumber: string, otp: string): Promise<boolean>;
  export function sendEmailOTP(email: string, otp: string): Promise<boolean>;
  export function sendWhatsAppEmergency(phoneNumber: string, message: string): Promise<boolean>;
  export function sendEmailAlert(email: string, message: string): Promise<boolean>;
}