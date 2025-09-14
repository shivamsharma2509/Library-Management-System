import React, { useState, useEffect } from 'react';
import { Bell, Send, MessageSquare, Mail, Phone, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Student } from '../types';
import { sendSMS, sendWhatsApp, getWelcomeMessage, getFeeConfirmationMessage, getFeeReminderMessage, getGoodbyeMessage } from '../services/notifications';

interface NotificationSystemProps {
  students: Student[];
}

interface NotificationLog {
  id: string;
  studentId: string;
  studentName: string;
  mobile: string;
  type: 'welcome' | 'fee_confirmation' | 'fee_reminder' | 'goodbye';
  message: string;
  status: 'sent' | 'pending' | 'failed';
  sentAt: string;
  channel: 'sms' | 'whatsapp';
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ students }) => {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [messageType, setMessageType] = useState<'welcome' | 'fee_confirmation' | 'fee_reminder' | 'goodbye'>('fee_reminder');
  const [channel, setChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Auto-send welcome messages for new students
  useEffect(() => {
    const checkForNewStudents = () => {
      students.forEach(student => {
        const hasWelcomeNotification = notifications.some(
          n => n.studentId === student.id && n.type === 'welcome'
        );
        
        if (!hasWelcomeNotification && student.status === 'active') {
          sendWelcomeMessage(student);
        }
      });
    };

    checkForNewStudents();
  }, [students]);

  // Check for fee reminders (3 days before expiry)
  useEffect(() => {
    const checkFeeReminders = () => {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const reminderDate = threeDaysFromNow.toISOString().split('T')[0];

      students.forEach(student => {
        if (student.feeExpiryDate === reminderDate && student.status === 'active') {
          const hasRecentReminder = notifications.some(
            n => n.studentId === student.id && 
                n.type === 'fee_reminder' && 
                new Date(n.sentAt).toDateString() === new Date().toDateString()
          );

          if (!hasRecentReminder) {
            sendFeeReminder(student);
          }
        }
      });
    };

    checkFeeReminders();
  }, [students]);

  const sendWelcomeMessage = async (student: Student) => {
    const message = getWelcomeMessage(student.name, student.seatNumber);
    await sendNotification(student, 'welcome', message, 'sms');
  };

  const sendFeeReminder = async (student: Student) => {
    const message = getFeeReminderMessage(student.name, new Date(student.feeExpiryDate).toLocaleDateString('en-IN'));
    await sendNotification(student, 'fee_reminder', message, 'sms');
  };

  const sendNotification = async (
    student: Student, 
    type: 'welcome' | 'fee_confirmation' | 'fee_reminder' | 'goodbye',
    message: string,
    selectedChannel: 'sms' | 'whatsapp'
  ) => {
    const notificationId = Date.now().toString();
    
    // Add pending notification
    const pendingNotification: NotificationLog = {
      id: notificationId,
      studentId: student.id,
      studentName: student.name,
      mobile: student.mobile,
      type,
      message,
      status: 'pending',
      sentAt: new Date().toISOString(),
      channel: selectedChannel,
    };

    setNotifications(prev => [pendingNotification, ...prev]);

    try {
      let success = false;
      if (selectedChannel === 'sms') {
        success = await sendSMS({ mobile: student.mobile, message, type });
      } else {
        success = await sendWhatsApp({ mobile: student.mobile, message, type });
      }

      // Update notification status
      setNotifications(prev => prev.map(n => 
        n.id === notificationId 
          ? { ...n, status: success ? 'sent' : 'failed' }
          : n
      ));
    } catch (error) {
      setNotifications(prev => prev.map(n => 
        n.id === notificationId 
          ? { ...n, status: 'failed' }
          : n
      ));
    }
  };

  const handleBulkSend = async () => {
    if (selectedStudents.length === 0) return;

    setIsSending(true);
    
    for (const studentId of selectedStudents) {
      const student = students.find(s => s.id === studentId);
      if (!student) continue;

      let message = customMessage;
      if (!customMessage) {
        switch (messageType) {
          case 'welcome':
            message = getWelcomeMessage(student.name, student.seatNumber);
            break;
          case 'fee_confirmation':
            message = getFeeConfirmationMessage(student.name, student.totalFeesPaid, student.feeExpiryDate);
            break;
          case 'fee_reminder':
            message = getFeeReminderMessage(student.name, new Date(student.feeExpiryDate).toLocaleDateString('en-IN'));
            break;
          case 'goodbye':
            message = getGoodbyeMessage(student.name);
            break;
        }
      }

      await sendNotification(student, messageType, message, channel);
      
      // Add delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsSending(false);
    setSelectedStudents([]);
    setCustomMessage('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'welcome':
        return 'bg-green-100 text-green-800';
      case 'fee_confirmation':
        return 'bg-blue-100 text-blue-800';
      case 'fee_reminder':
        return 'bg-orange-100 text-orange-800';
      case 'goodbye':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">Notification System</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Bell className="w-4 h-4" />
          <span>{notifications.filter(n => n.status === 'sent').length} sent today</span>
        </div>
      </div>

      {/* Bulk Send Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Bulk Notifications</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Students</label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedStudents.length === students.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStudents(students.map(s => s.id));
                    } else {
                      setSelectedStudents([]);
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium">Select All</span>
              </label>
              {students.map(student => (
                <label key={student.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents(prev => [...prev, student.id]);
                      } else {
                        setSelectedStudents(prev => prev.filter(id => id !== student.id));
                      }
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm">{student.name} - {student.mobile}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Message Configuration */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="welcome">Welcome Message</option>
                <option value="fee_confirmation">Fee Confirmation</option>
                <option value="fee_reminder">Fee Reminder</option>
                <option value="goodbye">Goodbye Message</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as 'sms' | 'whatsapp')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Message (Optional)</label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Leave empty to use default template"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleBulkSend}
              disabled={selectedStudents.length === 0 || isSending}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Sending...' : `Send to ${selectedStudents.length} students`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Log */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Notification History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notifications.slice(0, 50).map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{notification.studentName}</div>
                    <div className="text-sm text-gray-500">{notification.mobile}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                      {notification.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {notification.channel === 'sms' ? (
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Phone className="w-4 h-4 text-green-500" />
                      )}
                      <span className="text-sm text-gray-900 capitalize">{notification.channel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(notification.status)}
                      <span className="text-sm text-gray-900 capitalize">{notification.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(notification.sentAt).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={notification.message}>
                      {notification.message}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NotificationSystem;