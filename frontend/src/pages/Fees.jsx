import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { FaSave } from 'react-icons/fa';

const Fees = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState({});
  const [feesChanges, setFeesChanges] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  
  const isWarden = user?.role === 'warden';
  const isStudent = user?.role === 'student';
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const isAssigned = user?.blockName && user?.blockName !== 'Undefined';


  useEffect(() => {
    if (!isAuthenticated || (!isWarden && !isStudent)) {
      navigate('/');
      return;
    }
    if (isWarden || isAssigned) {
        fetchStudentData();
    } else if (isStudent && !isAssigned) {
        setLoading(false); 
    }
  }, [isAuthenticated, isWarden, isStudent, isAssigned, navigate, user?.blockName, user?.role]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const token = user.token;
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { blockName: user.blockName } 
      };
      
      const { data } = await axios.get('http://localhost:5000/api/users/database', config);
      
      setStudents(data.rooms);
      
      const initialChanges = {};
      Object.values(data.rooms).flat().forEach(student => {
          initialChanges[student._id] = student.fees > 0 ? 1 : 0;
      });
      setFeesChanges(initialChanges);

    } catch (err) {
      setStatusMessage({ type: 'error', message: err.response?.data?.message || 'Failed to fetch student data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFeesChange = (studentId, status) => {
    if (!isWarden) return;
    setFeesChanges(prev => ({ ...prev, [studentId]: parseInt(status) }));
  };

  const handleBulkUpdate = async () => {
      if (!isWarden) return;
      setStatusMessage({ type: '', message: '' });
      setLoading(true);
      
      const updates = Object.keys(feesChanges).map(studentId => ({
          studentId,
          fees: feesChanges[studentId] 
      }));
      
      try {
          const token = user.token;
          const config = { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } };
          
          await axios.put('http://localhost:5000/api/users/fees', { updates }, config);
          
          setStatusMessage({ type: 'success', message: 'Fees status updated successfully!' });
          fetchStudentData(); 

      } catch (err) {
          setStatusMessage({ type: 'error', message: err.response?.data?.message || 'Bulk update failed.' });
      } finally {
          setLoading(false);
      }
  };
  
  const assignedRoomKeys = Object.keys(students).filter(key => key !== 'Unassigned').sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  return (
    <div className="p-4">
      <h1 className="text-4xl font-extrabold text-amber-600 mb-6">Fees Register</h1>
      <p className="text-lg text-gray-700 mb-4">Block: <span className="font-semibold">{user?.blockName || 'N/A'}</span> | Date: <span className="font-semibold">{currentDate}</span></p>

      {statusMessage.message && (
        <div className={`p-3 mb-4 rounded-md font-semibold ${statusMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {statusMessage.message}
        </div>
      )}

      {isStudent && !isAssigned && !loading && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6" role="alert">
              <p className="font-bold">Access Restricted</p>
              <p>Your **Room and Block** have not been assigned yet. Once assigned by your Warden, you will have access to view your specific fees status here.</p>
          </div>
      )}

      {isWarden && (
          <div className="mb-4">
              <button onClick={handleBulkUpdate} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-green-700 transition disabled:opacity-50">
                  <FaSave className="inline mr-2" /> {loading ? 'Saving...' : 'Save All Fees Status'}
              </button>
          </div>
      )}

      {loading && assignedRoomKeys.length === 0 ? (
          <p className="text-center text-gray-500">Loading student list...</p>
      ) : assignedRoomKeys.length === 0 && !loading && isWarden ? (
          <p className="text-center text-gray-500">No assigned students found in this block.</p>
      ) : (
          (isWarden || isAssigned) && assignedRoomKeys.map(roomNumber => (
              <div key={roomNumber} className="mb-8 bg-white p-6 rounded-lg shadow-md border-l-4 border-amber-500">
                  <h2 className="text-2xl font-bold mb-4 text-amber-700">Room No. {roomNumber}</h2>
                  <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Fees Status</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                              {students[roomNumber].map(student => (
                                  <tr key={student._id}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                                          <select 
                                              value={feesChanges[student._id]}
                                              onChange={(e) => handleFeesChange(student._id, e.target.value)}
                                              disabled={!isWarden}
                                              className={`p-2 border border-gray-300 rounded text-sm focus:ring-amber-500 ${!isWarden ? 'bg-gray-100 text-gray-700' : ''}`}
                                          >
                                              <option value={1}>Paid</option>
                                              <option value={0}>Pending</option>
                                          </select>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          ))
      )}
    </div>
  );
};

export default Fees;