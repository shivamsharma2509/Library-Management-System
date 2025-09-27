// CSV Service for fetching data from Google Sheets CSV export
import Papa from 'papaparse';
import { Student } from '../types';

// Your Google Sheets CSV URL
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTLuwG2m6ACFc_ChKtyAR16e_9BU1mM7W9FPZvJY9Oi4C5g_RNiNThVhVPTrdC1vGdADw0BeaEJ2_pV/pub?output=csv';

export interface CSVStudent {
  Name: string;
  email: string;
  'mobile number': string;
  'parents name': string;
  "parent's mobile number": string;
}

export const fetchStudentsFromCSV = async (): Promise<Student[]> => {
  try {
    console.log('Fetching data from CSV:', CSV_URL);
    
    // Add timestamp to prevent caching
    const urlWithTimestamp = `${CSV_URL}&t=${Date.now()}`;
    
    const response = await fetch(urlWithTimestamp, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log('CSV Response received, length:', csvText.length);
    console.log('First 200 characters:', csvText.substring(0, 200));
    
    if (!csvText || csvText.trim().length === 0) {
      console.warn('Empty CSV response');
      return [];
    }
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Clean up header names and handle variations
          return header.trim();
        },
        complete: (results) => {
          try {
            console.log('CSV parsing complete. Rows found:', results.data.length);
            console.log('Headers found:', results.meta.fields);
            console.log('Sample row:', results.data[0]);
            
            if (results.errors && results.errors.length > 0) {
              console.warn('CSV parsing errors:', results.errors);
            }
            
            const students: Student[] = results.data
              .map((row: any, index: number) => {
                try {
                  // Handle different possible column names (case-insensitive and flexible)
                  const getField = (fieldNames: string[]) => {
                    for (const fieldName of fieldNames) {
                      // Try exact match first
                      if (row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '') {
                        return String(row[fieldName]).trim();
                      }
                      
                      // Try case-insensitive match
                      const keys = Object.keys(row);
                      const matchingKey = keys.find(key => 
                        key.toLowerCase().includes(fieldName.toLowerCase()) ||
                        fieldName.toLowerCase().includes(key.toLowerCase())
                      );
                      
                      if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null && row[matchingKey] !== '') {
                        return String(row[matchingKey]).trim();
                      }
                    }
                    return '';
                  };

                  const name = getField(['Name', 'name', 'student name', 'Student Name']);
                  const email = getField(['email', 'Email', 'E-mail', 'e-mail']);
                  const mobile = getField(['mobile number', 'Mobile Number', 'mobile', 'Mobile', 'phone', 'Phone']);
                  const parentName = getField(['parents name', 'Parents Name', 'parent name', 'Parent Name', 'Guardian Name']);
                  const parentMobile = getField(["parent's mobile number", "Parent's Mobile Number", 'parent mobile', 'Parent Mobile', 'guardian mobile']);

                  // Skip rows with missing essential data
                  if (!name || !mobile) {
                    console.log(`Skipping row ${index + 1}: Missing name or mobile`, { name, mobile });
                    return null;
                  }

                  const student: Student = {
                    id: `csv-${index + 1}`,
                    name: name,
                    mobile: mobile,
                    email: email || undefined,
                    parentName: parentName || 'Not Provided',
                    parentMobile: parentMobile || mobile, // Use student mobile if parent mobile not provided
                    registrationDate: new Date().toISOString().split('T')[0], // Default to today
                    feeExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 30 days from now
                    status: 'active',
                    totalFeesPaid: 0, // Will be updated manually by owner
                  };

                  console.log(`Processed student ${index + 1}:`, student);
                  return student;
                } catch (error) {
                  console.error(`Error processing row ${index + 1}:`, error, row);
                  return null;
                }
              })
              .filter((student): student is Student => student !== null);

            console.log(`Successfully processed ${students.length} students from CSV`);
            
            if (students.length === 0) {
              console.warn('No valid students found in CSV data');
              console.log('Available fields in CSV:', results.meta.fields);
              console.log('Sample data row:', results.data[0]);
            }
            
            resolve(students);
          } catch (error) {
            console.error('Error processing CSV data:', error);
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
    throw new Error(`Failed to fetch student data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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