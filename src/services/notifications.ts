// Notification service for SMS/WhatsApp integration
export interface NotificationData {
  mobile: string;
  message: string;
  type: 'welcome' | 'fee_confirmation' | 'fee_reminder' | 'goodbye';
}

// Simulated notification service
// In production, integrate with SMS gateway like Twilio, MSG91, etc.
export const sendSMS = async (data: NotificationData): Promise<boolean> => {
  console.log(`Sending SMS to ${data.mobile}: ${data.message}`);
  
  // Simulate API call delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate 95% success rate
      resolve(Math.random() > 0.05);
    }, 1000);
  });
};

export const sendWhatsApp = async (data: NotificationData): Promise<boolean> => {
  console.log(`Sending WhatsApp to ${data.mobile}: ${data.message}`);
  
  // Simulate API call delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate 90% success rate
      resolve(Math.random() > 0.1);
    }, 1200);
  });
};

// Message templates
export const getWelcomeMessage = (studentName: string, seatNumber?: number): string => {
  return `Welcome to our library, ${studentName}! ${seatNumber ? `Your seat number is ${seatNumber}.` : ''} We're excited to have you with us. For any queries, contact us.`;
};

export const getFeeConfirmationMessage = (studentName: string, amount: number, expiryDate: string): string => {
  return `Dear ${studentName}, your fee payment of ₹${amount} has been received successfully. Your membership is valid till ${expiryDate}. Thank you!`;
};

export const getFeeReminderMessage = (studentName: string, expiryDate: string): string => {
  return `Dear ${studentName}, your library membership expires on ${expiryDate}. Please renew your fees to continue using our services. Thank you!`;
};

export const getGoodbyeMessage = (studentName: string): string => {
  return `Dear ${studentName}, thank you for being part of our library family. We hope to see you again soon. Best wishes for your future endeavors!`;
};