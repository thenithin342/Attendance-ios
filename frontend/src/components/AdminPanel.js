import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = () => {
  const [user, setUser] = useState(null);
  const [batches, setBatches] = useState([]);
  const [halls, setHalls] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedHall, setSelectedHall] = useState('');
  const [students, setStudents] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and is faculty
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'faculty') {
      navigate('/');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    setUser(userData);
    
    fetchBatches();
    fetchHalls();
    fetchTodayAttendance();
  }, [navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch(`${API}/admin/batches`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }
      
      const data = await response.json();
      setBatches(data);
    } catch (err) {
      setError('Failed to load batches');
      console.error(err);
    }
  };

  const fetchHalls = async () => {
    try {
      const response = await fetch(`${API}/admin/halls`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch halls');
      }
      
      const data = await response.json();
      setHalls(data);
    } catch (err) {
      setError('Failed to load halls');
      console.error(err);
    }
  };

  const fetchStudentsByBatch = async (batchId) => {
    if (!batchId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/students?batch_id=${batchId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError('Failed to load students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const response = await fetch(`${API}/admin/attendance/today`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance');
      }
      
      const data = await response.json();
      setTodayAttendance(data);
    } catch (err) {
      setError('Failed to load attendance data');
      console.error(err);
    }
  };

  const handleBatchChange = (e) => {
    const batchId = e.target.value;
    setSelectedBatch(batchId);
    fetchStudentsByBatch(batchId);
  };

  const handleHallChange = (e) => {
    setSelectedHall(e.target.value);
  };

  const createNewBatch = async () => {
    const batchName = prompt('Enter batch name (e.g., "Batch A"):');
    const batchCode = prompt('Enter batch code (e.g., "BA2025"):');
    
    if (batchName && batchCode) {
      try {
        const response = await fetch(`${API}/admin/batches`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: batchName,
            code: batchCode
          })
        });
        
        if (response.ok) {
          fetchBatches();
          alert('Batch created successfully!');
        } else {
          throw new Error('Failed to create batch');
        }
      } catch (err) {
        setError('Failed to create batch');
        console.error(err);
      }
    }
  };

  const createNewHall = async () => {
    const hallName = prompt('Enter hall name (e.g., "Hall 101"):');
    const hallCode = prompt('Enter hall code (e.g., "H101"):');
    const macAddress = prompt('Enter Bluetooth beacon MAC address:');
    const capacity = prompt('Enter hall capacity:');
    
    if (hallName && hallCode && macAddress && capacity) {
      try {
        const response = await fetch(`${API}/admin/halls`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: hallName,
            code: hallCode,
            mac_address: macAddress,
            capacity: parseInt(capacity)
          })
        });
        
        if (response.ok) {
          fetchHalls();
          alert('Hall created successfully!');
        } else {
          throw new Error('Failed to create hall');
        }
      } catch (err) {
        setError('Failed to create hall');
        console.error(err);
      }
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBatches(),
        fetchHalls(),
        fetchTodayAttendance()
      ]);
      if (selectedBatch) {
        await fetchStudentsByBatch(selectedBatch);
      }
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const selectedHallData = halls.find(h => h.id === selectedHall);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-600">Faculty: {user.full_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <button
                onClick={() => navigate('/home')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Batch Management */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Batch Management</h2>
              <button
                onClick={createNewBatch}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                + New Batch
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Batch
                </label>
                <select
                  value={selectedBatch}
                  onChange={handleBatchChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a batch...</option>
                  {batches.map(batch => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} ({batch.code})
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedBatch && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Students in Selected Batch ({students.length})
                  </h3>
                  <div className="max-h-64 overflow-y-auto">
                    {students.map((student, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">{student.full_name}</p>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                        <span className="text-sm text-blue-600">{student.batch}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hall Management */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Hall Management</h2>
              <button
                onClick={createNewHall}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                + New Hall
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Hall
                </label>
                <select
                  value={selectedHall}
                  onChange={handleHallChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a hall...</option>
                  {halls.map(hall => (
                    <option key={hall.id} value={hall.id}>
                      {hall.name} ({hall.code})
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedHallData && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Hall Details
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Name:</strong> {selectedHallData.name}</p>
                    <p className="text-sm"><strong>Code:</strong> {selectedHallData.code}</p>
                    <p className="text-sm"><strong>MAC Address:</strong> 
                      <span className="font-mono bg-gray-200 px-2 py-1 rounded ml-2">
                        {selectedHallData.mac_address}
                      </span>
                    </p>
                    <p className="text-sm"><strong>Capacity:</strong> {selectedHallData.capacity}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Today's Attendance</h2>
          
          {todayAttendance.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600">No attendance records for today</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Hall</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Method</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAttendance.map((record, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-900">{record.student_id}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(record.marked_at).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{record.hall_id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {record.verification_method}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Present
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;