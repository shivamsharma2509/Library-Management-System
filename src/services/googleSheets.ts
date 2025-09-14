// Google Sheets API service
export interface StudentData {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  parentName: string;
  parentMobile: string;
  registrationDate: string;
  feeExpiryDate: string;
  status: 'active' | 'inactive' | 'expired';
  seatNumber?: number;
  totalFeesPaid: number;
}

// For demo purposes, we'll simulate Google Sheets data
// In production, you'll need to set up Google Sheets API credentials
export const fetchStudentsFromSheet = async (): Promise<StudentData[]> => {
  // Simulated data that would come from your Google Sheet
  // Replace this with actual Google Sheets API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          name: 'Rahul Sharma',
          mobile: '9876543210',
          email: 'rahul@example.com',
          parentName: 'Suresh Sharma',
          parentMobile: '9876543211',
          registrationDate: '2024-01-15',
          feeExpiryDate: '2024-02-15',
          status: 'active',
          seatNumber: 1,
          totalFeesPaid: 2000,
        },
        {
          id: '2',
          name: 'Priya Patel',
          mobile: '9876543212',
          email: 'priya@example.com',
          parentName: 'Ramesh Patel',
          parentMobile: '9876543213',
          registrationDate: '2024-01-10',
          feeExpiryDate: '2024-02-10',
          status: 'active',
          seatNumber: 5,
          totalFeesPaid: 1500,
        },
        {
          id: '3',
          name: 'Amit Kumar',
          mobile: '9876543214',
          parentName: 'Vijay Kumar',
          parentMobile: '9876543215',
          registrationDate: '2024-01-20',
          feeExpiryDate: '2024-02-20',
          status: 'active',
          totalFeesPaid: 0,
        },
        {
          id: '4',
          name: 'Sneha Gupta',
          mobile: '9876543216',
          email: 'sneha@example.com',
          parentName: 'Rajesh Gupta',
          parentMobile: '9876543217',
          registrationDate: '2024-01-05',
          feeExpiryDate: '2024-02-05',
          status: 'active',
          seatNumber: 12,
          totalFeesPaid: 3000,
        },
        {
          id: '5',
          name: 'Vikash Singh',
          mobile: '9876543218',
          parentName: 'Manoj Singh',
          parentMobile: '9876543219',
          registrationDate: '2024-01-25',
          feeExpiryDate: '2024-02-25',
          status: 'active',
          seatNumber: 8,
          totalFeesPaid: 1000,
        }
      ]);
    }, 1000);
  });
};

// Function to add student to Google Sheet
export const addStudentToSheet = async (student: Omit<StudentData, 'id'>): Promise<string> => {
  // Simulate API call to add student to Google Sheet
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Date.now().toString());
    }, 500);
  });
};

// Function to update student in Google Sheet
export const updateStudentInSheet = async (id: string, updates: Partial<StudentData>): Promise<void> => {
  // Simulate API call to update student in Google Sheet
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
};