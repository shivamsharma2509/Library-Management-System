import { useState, useEffect } from 'react';
import { Student, Seat, FeeTransaction, Notification, DashboardStats } from '../types';
import { fetchStudentsFromCSV, addStudentToCSV, updateStudentInCSV } from '../services/csvService';
import { sendSMS, getFeeConfirmationMessage } from '../services/notifications';

interface ActivityLog {
  id: string;
  type: 'registration' | 'fee_payment' | 'seat_assignment' | 'seat_release' | 'status_change';
  description: string;
  studentName: string;
  timestamp: string;
  details?: any;
}

// Generate sample data
const generateSampleData = () => {
  const seats: Seat[] = Array.from({ length: 102 }, (_, i) => {
    const seatNumber = i + 1;
    // We'll update this after loading students from sheets
    const occupiedStudent = null;
    
    return {
      number: seatNumber,
      isOccupied: !!occupiedStudent,
      studentId: occupiedStudent?.id,
      studentName: occupiedStudent?.name,
      assignedDate: occupiedStudent ? occupiedStudent.registrationDate : undefined,
    };
  });

  const initialTransactions: FeeTransaction[] = [
    {
      id: '1',
      studentId: '1',
      studentName: 'Rahul Sharma',
      amount: 2000,
      paymentMode: 'online',
      paymentMethod: 'UPI',
      transactionDate: '2024-01-15',
      expiryDate: '2024-02-15',
      receiptNumber: 'RCP001',
    },
    {
      id: '2',
      studentId: '2',
      studentName: 'Priya Patel',
      amount: 1500,
      paymentMode: 'offline',
      paymentMethod: 'Cash',
      transactionDate: '2024-01-10',
      expiryDate: '2024-02-10',
      receiptNumber: 'RCP002',
    },
  ];

  return { seats, transactions: initialTransactions };
};

export const useLibraryData = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load students from CSV
        const studentsFromCSV = await fetchStudentsFromCSV();
        setStudents(studentsFromCSV);
        
        // Generate initial data
        const { seats: initialSeats, transactions: initialTransactions } = generateSampleData();
        
        // Update seats based on loaded students
        const updatedSeats = initialSeats.map(seat => {
          const occupiedStudent = studentsFromCSV.find(s => s.seatNumber === seat.number);
          return {
            ...seat,
            isOccupied: !!occupiedStudent,
            studentId: occupiedStudent?.id,
            studentName: occupiedStudent?.name,
            assignedDate: occupiedStudent ? occupiedStudent.registrationDate : undefined,
          };
        });
        
        setSeats(updatedSeats);
        setTransactions([]); // Start with empty transactions since CSV doesn't contain transaction data
        
        // Add initial activity log entries
        const initialActivities: ActivityLog[] = studentsFromCSV.map(student => ({
          id: `reg-${student.id}`,
          type: 'registration',
          description: 'New student registration',
          studentName: student.name,
          timestamp: student.registrationDate,
        }));
        
        setActivityLog(initialActivities);
      } catch (error) {
        console.error('Error loading data:', error);
        // Set empty data if CSV loading fails
        setStudents([]);
        setSeats(Array.from({ length: 102 }, (_, i) => ({
          number: i + 1,
          isOccupied: false,
        })));
        setTransactions([]);
        setActivityLog([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const addActivity = (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newActivity: ActivityLog = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setActivityLog(prev => [newActivity, ...prev.slice(0, 49)]); // Keep only last 50 activities
  };

  const addStudent = async (studentData: Omit<Student, 'id'>) => {
    try {
      // Add to CSV (simulated)
      const newId = await addStudentToCSV(studentData);
      
      const newStudent: Student = {
        ...studentData,
        id: newId,
      };
      
      setStudents(prev => [...prev, newStudent]);
      
      // Add to activity log
      addActivity({
        type: 'registration',
        description: 'New student registration',
        studentName: newStudent.name,
        details: { studentId: newId }
      });
      
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      // Update in CSV (simulated)
      await updateStudentInCSV(id, updates);
      
      const student = students.find(s => s.id === id);
      if (!student) return;
      
      setStudents(prev => prev.map(s => 
        s.id === id ? { ...s, ...updates } : s
      ));
      
      // Add to activity log if status changed
      if (updates.status && updates.status !== student.status) {
        addActivity({
          type: 'status_change',
          description: `Student status changed to ${updates.status}`,
          studentName: student.name,
          details: { oldStatus: student.status, newStatus: updates.status }
        });
      }
      
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  };

  const deleteStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    if (student?.seatNumber) {
      releaseSeat(student.seatNumber);
    }
    setStudents(prev => prev.filter(student => student.id !== id));
    
    if (student) {
      addActivity({
        type: 'status_change',
        description: 'Student removed from system',
        studentName: student.name,
      });
    }
  };

  const assignSeat = (seatNumber: number, studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    // Update seat
    setSeats(prev => prev.map(seat => 
      seat.number === seatNumber 
        ? { 
            ...seat, 
            isOccupied: true, 
            studentId, 
            studentName: student.name,
            assignedDate: new Date().toISOString().split('T')[0]
          }
        : seat
    ));

    // Update student
    updateStudent(studentId, { seatNumber });
    
    // Add to activity log
    addActivity({
      type: 'seat_assignment',
      description: `Seat ${seatNumber} assigned`,
      studentName: student.name,
    });
  };

  const releaseSeat = (seatNumber: number) => {
    const seat = seats.find(s => s.number === seatNumber);
    if (!seat?.studentId) return;

    // Update seat
    setSeats(prev => prev.map(s => 
      s.number === seatNumber 
        ? { 
            ...s, 
            isOccupied: false, 
            studentId: undefined, 
            studentName: undefined,
            assignedDate: undefined
          }
        : s
    ));

    // Update student
    updateStudent(seat.studentId, { seatNumber: undefined });
    
    // Add to activity log
    const student = students.find(s => s.id === seat.studentId);
    if (student) {
      addActivity({
        type: 'seat_release',
        description: `Seat ${seatNumber} released`,
        studentName: student.name,
      });
    }
  };

  const addTransaction = async (transactionData: Omit<FeeTransaction, 'id' | 'receiptNumber'>) => {
    const newTransaction: FeeTransaction = {
      ...transactionData,
      id: Date.now().toString(),
      receiptNumber: `RCP${String(transactions.length + 1).padStart(3, '0')}`,
    };
    
    setTransactions(prev => [...prev, newTransaction]);
    
    // Update student fee expiry and total paid
    const student = students.find(s => s.id === transactionData.studentId);
    const updatedTotalFees = (student?.totalFeesPaid || 0) + transactionData.amount;
    
    await updateStudent(transactionData.studentId, {
      feeExpiryDate: transactionData.expiryDate,
      lastFeePayment: transactionData.transactionDate,
      paymentMode: transactionData.paymentMode,
      totalFeesPaid: updatedTotalFees,
    });
    
    // Add to activity log
    addActivity({
      type: 'fee_payment',
      description: `Fee payment of ₹${transactionData.amount} received`,
      studentName: transactionData.studentName,
      details: { amount: transactionData.amount, paymentMode: transactionData.paymentMode }
    });
    
    // Send fee confirmation SMS
    if (student) {
      try {
        const message = getFeeConfirmationMessage(
          student.name, 
          transactionData.amount, 
          new Date(transactionData.expiryDate).toLocaleDateString('en-IN')
        );
        await sendSMS({ mobile: student.mobile, message, type: 'fee_confirmation' });
      } catch (error) {
        console.error('Error sending fee confirmation SMS:', error);
      }
    }
  };

  const getDashboardStats = (): DashboardStats => {
    const activeStudents = students.filter(s => s.status === 'active').length;
    const occupiedSeats = seats.filter(s => s.isOccupied).length;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyTransactions = transactions.filter(t => t.transactionDate.startsWith(currentMonth));
    const monthlyRevenue = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const expiringToday = students.filter(s => s.feeExpiryDate === today).length;
    const expiringThisWeek = students.filter(s => s.feeExpiryDate <= nextWeek && s.feeExpiryDate >= today).length;
    const pendingFees = students.filter(s => new Date(s.feeExpiryDate) < new Date()).length;

    return {
      totalStudents: students.length,
      activeStudents,
      occupiedSeats,
      availableSeats: 102 - occupiedSeats,
      monthlyRevenue,
      pendingFees,
      expiringToday,
      expiringThisWeek,
    };
  };

  const getRecentActivity = (limit: number = 10): ActivityLog[] => {
    return activityLog
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };

  return {
    students,
    seats,
    transactions,
    notifications,
    activityLog,
    isLoading,
    addStudent,
    updateStudent,
    deleteStudent,
    assignSeat,
    releaseSeat,
    addTransaction,
    getDashboardStats,
    getRecentActivity,
  };
};