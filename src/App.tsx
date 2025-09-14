import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import StudentManagement from './components/StudentManagement';
import SeatManagement from './components/SeatManagement';
import FeeManagement from './components/FeeManagement';
import NotificationSystem from './components/NotificationSystem';
import Reports from './components/Reports';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import { useLibraryData } from './hooks/useLibraryData';
import { isAuthenticated } from './services/authService';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  const {
    students,
    seats,
    transactions,
    isLoading,
    addStudent,
    updateStudent,
    deleteStudent,
    assignSeat,
    releaseSeat,
    addTransaction,
    getDashboardStats,
    getRecentActivity,
  } = useLibraryData();

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowRegister(false);
  };

  const handleRegister = () => {
    setIsLoggedIn(true);
    setShowRegister(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('dashboard');
  };

  const handleQuickAction = (action: 'add-student' | 'record-payment' | 'assign-seat' | 'send-reminders') => {
    switch (action) {
      case 'add-student':
        setActiveTab('students');
        break;
      case 'record-payment':
        setActiveTab('fees');
        break;
      case 'assign-seat':
        setActiveTab('seats');
        break;
      case 'send-reminders':
        setActiveTab('notifications');
        break;
    }
  };

  // Show authentication forms if not logged in
  if (!isLoggedIn) {
    if (showRegister) {
      return (
        <RegisterForm
          onRegister={handleRegister}
          onSwitchToLogin={() => setShowRegister(false)}
        />
      );
    }
    return (
      <LoginForm
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student data from CSV...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            stats={getDashboardStats()} 
            recentActivity={getRecentActivity()} 
            onQuickAction={handleQuickAction}
          />
        );
      case 'students':
        return (
          <StudentManagement
            students={students}
            onAddStudent={addStudent}
            onUpdateStudent={updateStudent}
            onDeleteStudent={deleteStudent}
          />
        );
      case 'seats':
        return (
          <SeatManagement
            seats={seats}
            students={students}
            onAssignSeat={assignSeat}
            onReleaseSeat={releaseSeat}
          />
        );
      case 'fees':
        return (
          <FeeManagement
            transactions={transactions}
            students={students}
            onAddTransaction={addTransaction}
          />
        );
      case 'notifications':
        return <NotificationSystem students={students} />;
      case 'reports':
        return <Reports students={students} transactions={transactions} />;
      default:
        return (
          <Dashboard 
            stats={getDashboardStats()} 
            recentActivity={getRecentActivity()} 
            onQuickAction={handleQuickAction}
          />
        );
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
}

export default App;