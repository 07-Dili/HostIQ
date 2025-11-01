import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaCalendarCheck } from 'react-icons/fa';

const Attendance = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState({});
  const [attendanceChanges, setAttendanceChanges] = useState({}); 
  const [summaryData, setSummaryData] = useState({}); 
  const [totalDays, setTotalDays] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  
  const isWarden = user?.role === 'warden';
  const isStudent = user?.role === 'student';
  const currentDateDisplay = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const isAssigned = user?.blockName && user?.blockName !== 'Undefined';
  
  const fetchSummaryData = async () => {
      if (!isWarden && !isStudent) return; 
      try {
          const token = user.token;
          const config = { headers: { 'Authorization': `Bearer ${token}` } };
          const { data } = await axios.get('http://localhost:5000/api/users/attendance/summary', config);
          
          const summaryMap = data.summary.reduce((acc, item) => {
              acc[item.studentId] = item;
              return acc;
          }, {});
          setSummaryData(summaryMap);
          setTotalDays(data.totalDays);
      } catch (err) {
      }
  };

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const token = user.token;
      
      const config = { headers: { 'Authorization': `Bearer ${token}` }, params: { blockName: user.blockName } };
      const { data: studentDBData } = await axios.get('http://localhost:5000/api/users/database', config);
      
      setStudents(studentDBData.rooms);
      
      const assignedStudents = Object.values(studentDBData.rooms).flat().filter(s => s.roomNumber && s.roomNumber !== 0);
      
      const statusConfig = {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { date: selectedDate, blockName: user.blockName }
      };
      
      const { data: dailyStatusData } = await axios.get('http://localhost:5000/api/users/attendance/daily-status', statusConfig);

      const dailyStatusMap = dailyStatusData.statuses.reduce((acc, rec) => {
          acc[rec.student] = rec.status;
          return acc;
      }, {});
      
      const initialChanges = {};
      assignedStudents.forEach(student => {
          initialChanges[student._id] = dailyStatusMap[student._id] || 'Absent';
      });
      setAttendanceChanges(initialChanges);

    } catch (err) {
      setStatusMessage({ type: 'error', message: err.response?.data?.message || 'Failed to fetch student data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || (!isWarden && !isStudent)) {
      navigate('/');
      return;
    }
    if (isWarden || isAssigned) {
        fetchStudentData();
        fetchSummaryData();
    } else if (isStudent && !isAssigned) {
        setLoading(false); 
    }
  }, [isAuthenticated, isWarden, isStudent, isAssigned, navigate, user?.blockName, user?.role, selectedDate]);

  const handleAttendanceChange = (studentId, status) => {
    if (!isWarden) return;
    setAttendanceChanges(prev => ({ ...prev, [studentId]: status }));
  };

  const handleBulkUpdate = async () => {
      if (!isWarden) return;
      setStatusMessage({ type: '', message: '' });
      setLoading(true);
      
      const updates = Object.keys(attendanceChanges).map(studentId => ({
          studentId,
          attendance: attendanceChanges[studentId]
      }));
      
      if (!selectedDate) {
          setStatusMessage({ type: 'error', message: 'Please select a date for the attendance record.' });
          setLoading(false);
          return;
      }
      
      try {
          const token = user.token;
          const config = { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } };
          
          await axios.put('http://localhost:5000/api/users/attendance', { updates, date: selectedDate }, config);
          
          setStatusMessage({ type: 'success', message: `Attendance updated successfully for ${selectedDate}` });
          
          fetchStudentData(); 
          fetchSummaryData(); 
          setAttendanceChanges({});

      } catch (err) {
          setStatusMessage({ type: 'error', message: err.response?.data?.message || 'Bulk update failed.' });
      } finally {
          setLoading(false);
      }
  };
  
  const getFilteredData = () => {
    const currentStudentsGrouped = {};
    const assignedStudents = Object.values(students).flat().filter(s => s.roomNumber && s.roomNumber !== 0);

    assignedStudents.forEach(student => {
        const roomKey = student.roomNumber;
        if (!currentStudentsGrouped[roomKey]) {
            currentStudentsGrouped[roomKey] = [];
        }
        currentStudentsGrouped[roomKey].push(student);
    });

    return currentStudentsGrouped;
  };
  
  const filteredRoomsData = getFilteredData();
  const assignedRoomKeys = Object.keys(filteredRoomsData).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));


  return (
    <div className="p-4">
      <h1 className="text-4xl font-extrabold text-[#001740] mb-6">Attendance Register</h1>
      <p className="text-lg text-gray-700 mb-4">Block: <span className="font-semibold">{user?.blockName || 'N/A'}</span> | Date: <span className="font-semibold">{currentDateDisplay}</span></p>

      {statusMessage.message && (
        <div className={`p-3 mb-4 rounded-md font-semibold ${statusMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {statusMessage.message}
        </div>
      )}

      {isStudent && !isAssigned && !loading && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6" role="alert">
              <p className="font-bold">Access Restricted</p>
              <p>Your **Room and Block** have not been assigned yet. Once assigned by your Warden, you will have access to view your specific attendance records here.</p>
          </div>
      )}

      {isWarden && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                  <label className="font-medium text-gray-700">Record Date:</label>
                  <input 
                      type="date" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="p-2 border rounded-md"
                  />
              </div>
              <button onClick={handleBulkUpdate} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-green-700 transition disabled:opacity-50">
                  <FaSave className="inline mr-2" /> {loading ? 'Saving...' : 'Save Attendance'}
              </button>
          </div>
      )}
      
      {totalDays > 0 && (isWarden || isAssigned) && (
          <div className="mb-4 text-sm font-medium text-gray-600">
              Overall Attendance calculated based on {totalDays} recorded day{totalDays > 1 ? 's' : ''}.
          </div>
      )}


      {loading && assignedRoomKeys.length === 0 ? (
          <p className="text-center text-gray-500">Loading student list...</p>
      ) : assignedRoomKeys.length === 0 && !loading && (isWarden || isAssigned) ? (
          <p className="text-center text-gray-500">No assigned students found in this block.</p>
      ) : (
          (isWarden || isAssigned) && assignedRoomKeys.map(roomNumber => (
              <div key={roomNumber} className="mb-8 bg-white p-6 rounded-lg shadow-md border-l-4 border-[#FFB600]">
                  <h2 className="text-2xl font-bold mb-4 text-[#001740]">Room No. {roomNumber}</h2>
                  <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Daily Status</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Overall Percentage</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                              {filteredRoomsData[roomNumber].map(student => {
                                  const summary = summaryData[student._id] || {};
                                  const percentage = summary.overallPercentage;
                                  
                                  return (
                                      <tr key={student._id}>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                                              <select 
                                                  value={attendanceChanges[student._id] || 'Absent'}
                                                  onChange={(e) => handleAttendanceChange(student._id, e.target.value)}
                                                  disabled={!isWarden}
                                                  className={`p-2 border border-gray-300 rounded text-sm focus:ring-[#FFB600] ${!isWarden ? 'bg-gray-100 text-gray-700' : ''}`}
                                              >
                                                  <option value="Present">P</option>
                                                  <option value="Absent">A</option>
                                                  <option value="Leave">L</option>
                                              </select>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#001740]">
                                              {percentage !== undefined ? `${percentage}%` : 'N/A'}
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </div>
          ))
      )}
    </div>
  );
};

export default Attendance;