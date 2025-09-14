// CSV Service for fetching data from Google Sheets CSV export
import Papa from 'papaparse';
import { Student } from '../types';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRNJrQjfavgCiKmjkfKCfb4Z91itVjn-5y5p8Gt7IDw7Sc1VEe73cUzAewiz7uQVAv-K-_HtxsljLAo/pub?output=csv';

export interface CSVStudent {
  Name: string;
  Mobile: string;
  Email?: string;
  'Parent Name': string;
  'Parent Mobile': string;
  'Registration Date': string;
  'Fee Expiry Date': string;
  Status: string;
  'Seat Number'?: string;
  'Total Fees Paid': string;
}

export const fetchStudentsFromCSV = async (): Promise<Student[]> => {
  try {
    const response = await fetch(CSV_URL);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const students: Student[] = results.data.map((row: any, index: number) => {
              // Handle different possible column names
              const name = row.Name || row.name || row.NAME || '';
              const mobile = row.Mobile || row.mobile || row.MOBILE || '';
              const email = row.Email || row.email || row.EMAIL || '';
              const parentName = row['Parent Name'] || row['parent name'] || row.PARENT_NAME || '';
              const parentMobile = row['Parent Mobile'] || row['parent mobile'] || row.PARENT_MOBILE || '';
              const registrationDate = row['Registration Date'] || row['registration date'] || row.REGISTRATION_DATE || new Date().toISOString().split('T')[0];
              const feeExpiryDate = row['Fee Expiry Date'] || row['fee expiry date'] || row.FEE_EXPIRY_DATE || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              const status = (row.Status || row.status || row.STATUS || 'active').toLowerCase();
              const seatNumber = row['Seat Number'] || row['seat number'] || row.SEAT_NUMBER || '';
              const totalFeesPaid = row['Total Fees Paid'] || row['total fees paid'] || row.TOTAL_FEES_PAID || '0';

              return {
                id: `csv-${index + 1}`,
                name: name.trim(),
                mobile: mobile.toString().trim(),
                email: email ? email.trim() : undefined,
                parentName: parentName.trim(),
                parentMobile: parentMobile.toString().trim(),
                registrationDate: formatDate(registrationDate),
                feeExpiryDate: formatDate(feeExpiryDate),
                status: ['active', 'inactive', 'expired'].includes(status) ? status as 'active' | 'inactive' | 'expired' : 'active',
                seatNumber: seatNumber ? parseInt(seatNumber.toString()) : undefined,
                totalFeesPaid: parseFloat(totalFeesPaid.toString()) || 0,
              };
            }).filter(student => student.name && student.mobile); // Filter out empty rows

            console.log(`Fetched ${students.length} students from CSV`);
            resolve(students);
          } catch (error) {
            console.error('Error parsing CSV data:', error);
            reject(error);
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching CSV:', error);
    throw error;
  }
};

const formatDate = (dateString: string): string => {
  if (!dateString) return new Date().toISOString().split('T')[0];
  
  try {
    // Try to parse the date and format it as YYYY-MM-DD
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

export const addStudentToCSV = async (student: Omit<Student, 'id'>): Promise<string> => {
  // Note: This is a simulation since we can't directly write to Google Sheets CSV
  // In a real implementation, you would need to use Google Sheets API
  console.log('Adding student to CSV (simulated):', student);
  return Promise.resolve(Date.now().toString());
};

export const updateStudentInCSV = async (id: string, updates: Partial<Student>): Promise<void> => {
  // Note: This is a simulation since we can't directly write to Google Sheets CSV
  // In a real implementation, you would need to use Google Sheets API
  console.log('Updating student in CSV (simulated):', id, updates);
  return Promise.resolve();
};