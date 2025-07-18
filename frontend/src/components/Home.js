import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceStatus, setAttendanceStatus] = useState('Ready');
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
  const [nearbyDevices, setNearbyDevices] = useState([]);
  const [showDevices, setShowDevices] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const navigate = useNavigate();

  // Mock data for demonstration
  const mockDevices = [
    { name: 'OnePlus Nord Buds 2', id: '84:0F:2A:BC:AB:98' },
    { name: 'Infinix Audio OPL5B6', id: '5B:6A:E2:36' },
    { name: 'OnePlus Buds Z2', id: 'F4:FF:63:DE:0D:EC' },
    { name: 'Boult Audio Probass', id: '41:42:33:E8:09:4F' },
    { name: 'OPPO Enco Air2 Pro', id: '84:D3:52:2E:F6:6D' },
    { name: 'Boult Audio ComBuds', id: '15:8B:2C:B6:F1:2B' },
    { name: 'Tribit XSound Go', id: 'F4:4E:FD:FB:C1:45' }
  ];

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userEmail = localStorage.getItem('userEmail');
    
    if (!isLoggedIn || !userEmail) {
      navigate('/login');
      return;
    }

    setUser({ email: userEmail });

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const handleMarkAttendance = async () => {
    try {
      setAttendanceStatus('Marking...');
      
      // Simulate face verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      setFaceVerified(true);
      
      // Simulate attendance marking
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAttendanceStatus('Marked Successfully');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setAttendanceStatus('Ready');
        setFaceVerified(false);
      }, 3000);
    } catch (error) {
      setAttendanceStatus('Error - Try Again');
      setTimeout(() => setAttendanceStatus('Ready'), 3000);
    }
  };

  const handleBiometricRegistration = () => {
    // TODO: Implement biometric registration
    alert('Biometric registration will be implemented with face recognition API');
  };

  const handleBluetoothScan = () => {
    if (!isBluetoothEnabled) {
      setIsBluetoothEnabled(true);
      setNearbyDevices(mockDevices);
      setShowDevices(true);
    } else {
      setShowDevices(!showDevices);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getUserId = () => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'cs23i1001';
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">IIITDM AttendanceSync</h1>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-blue-600 mb-2">
            {getGreeting()} {getUserId()}
          </h2>
          <div className="text-center mt-4">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {formatTime(currentTime)} am
            </div>
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium inline-block">
              [DEBUG] Attendance Window (for testing)
            </div>
          </div>
        </div>

        {/* Attendance Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Mark Attendance</h3>
            <p className="text-gray-600 text-sm mb-6">
              Use facial recognition to mark your attendance quickly and securely
            </p>
            
            {/* Attendance Status */}
            <div className="mb-4">
              <div className={`px-4 py-2 rounded-lg inline-block text-sm font-medium ${
                attendanceStatus === 'Ready' ? 'bg-green-100 text-green-800' :
                attendanceStatus === 'Marking...' ? 'bg-yellow-100 text-yellow-800' :
                attendanceStatus === 'Marked Successfully' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {attendanceStatus}
              </div>
              {faceVerified && (
                <div className="mt-2 text-sm text-green-600 flex items-center justify-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Face Verified
                </div>
              )}
            </div>

            <button
              onClick={handleMarkAttendance}
              disabled={attendanceStatus === 'Marking...'}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
            >
              {attendanceStatus === 'Marking...' ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Marking Attendance...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Mark Attendance
                </>
              )}
            </button>

            <button
              onClick={handleBiometricRegistration}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Biometric Registration
            </button>
          </div>
        </div>

        {/* Bluetooth Devices Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <button
            onClick={handleBluetoothScan}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors mb-4"
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            Show Nearby Bluetooth Addresses
          </button>

          {showDevices && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 mb-3">Nearby Bluetooth Devices:</h4>
              {nearbyDevices.map((device, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="font-medium text-gray-900">{device.name}</div>
                  <div className="text-gray-600 font-mono text-xs">({device.id})</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
          <div className="font-medium text-yellow-800 mb-2">Debug Information:</div>
          <div className="space-y-1 text-yellow-700">
            <div>isActive (DB): null</div>
            <div>start_time (IST): null</div>
            <div>end_time (IST): null</div>
            <div>serverNow (UTC): {currentTime.toISOString()}</div>
            <div>now (IST): {currentTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
            <div>Computed isActive (button enabled): false</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;