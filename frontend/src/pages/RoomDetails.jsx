import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { FaUserCircle, FaEdit, FaTrashAlt, FaSave, FaCheck, FaTimes } from 'react-icons/fa';

const RoomDetails = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const { roomNumber } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  const [editingId, setEditingId] = useState(null);
  const [newRoomNumber, setNewRoomNumber] = useState('');

  const isWarden = user?.role === 'warden';

  const showStatus = (type, message) => {
      setStatusMessage({ type, message });
      setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
  };

  const fetchRoomData = async () => {
    setLoading(true);
    setError('');
    
    if (!isAuthenticated) return navigate('/login');
    if (!isWarden) { 
        setError("Access Denied: Only Wardens can access room details.");
        setLoading(false);
        return;
    }

    try {
      const token = user.token;
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: { blockName: user.blockName } 
      };
      
      const { data } = await axios.get('http://localhost:5000/api/users/database', config);
      
      const roomStudents = data.rooms[roomNumber] || [];
      setStudents(roomStudents);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch room data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomData();
  }, [isAuthenticated, navigate, user?.token, user?.blockName, roomNumber]);

  
  const handleStartEdit = (student) => {
      setEditingId(student._id);
      setNewRoomNumber(student.roomNumber || '');
  };
  
  const handleCancelEdit = () => {
      setEditingId(null);
      setNewRoomNumber('');
  };

  const handleUpdateRoom = async (studentId) => {
      if (!newRoomNumber || newRoomNumber === studentId.roomNumber) {
          showStatus('error', 'Please enter a valid, different room number.');
          return;
      }
      
      setLoading(true);
      try {
          const token = user.token;
          const config = { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } };
          
          const updateData = {
              roomNumber: parseInt(newRoomNumber),
              blockName: user.blockName 
          };
          
          await axios.put(`http://localhost:5000/api/users/student/${studentId}/room`, updateData, config);
          
          showStatus('success', `Student moved to Room ${newRoomNumber} successfully!`);
          setEditingId(null);
          setNewRoomNumber('');
          navigate(`/database/${newRoomNumber}`, { replace: true });

      } catch (err) {
          showStatus('error', err.response?.data?.message || 'Room update failed.');
      } finally {
          setLoading(false);
      }
  };

  const handleDeleteAssignment = async (studentId, studentName) => {
      if (!window.confirm(`Are you sure you want to un-assign ${studentName} from this room? This will set their Room/Block fields to empty in the database.`)) {
          return;
      }
      
      setLoading(true);
      try {
          const token = user.token;
          const config = { headers: { 'Authorization': `Bearer ${token}` } };
          
          await axios.delete(`http://localhost:5000/api/users/student/${studentId}`, config); 
          
          showStatus('success', `${studentName} un-assigned successfully.`);
          fetchRoomData();

      } catch (err) {
          showStatus('error', err.response?.data?.message || 'Deletion (Un-assign) failed.');
      } finally {
          setLoading(false);
      }
  };
  
  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading Room {roomNumber} Details...</div>;
  }
  
  if (error) {
    return <div className="text-red-600 text-center py-12 text-xl">{error}</div>;
  }
  
  return (
    <div className="p-4">
      <h1 className="text-4xl font-extrabold text-[#001740] mb-4">
        Room {roomNumber} - {user?.blockName} Block
      </h1>
      <p className="text-gray-600 mb-6">
          Warden Tools for Room Management (Total Members: {students.length} / 4)
      </p>

      {statusMessage.message && (
        <div className={`p-3 mb-4 rounded-md font-semibold ${statusMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {statusMessage.message}
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#f8f8f8]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Dept/Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-32">Room No. (Edit)</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map(student => (
              <tr key={student._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <FaUserCircle className="inline mr-2 text-gray-400" /> {student.firstName} {student.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department}/{student.year}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.phoneNumber}</td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {editingId === student._id ? (
                      <div className="flex items-center space-x-2">
                          <input 
                              type="number" 
                              value={newRoomNumber}
                              onChange={(e) => setNewRoomNumber(e.target.value)}
                              className="p-1 border rounded w-16 text-sm focus:ring-[#FFB600] focus:border-[#FFB600]"
                          />
                          <button onClick={() => handleUpdateRoom(student._id)} className="text-green-500 hover:text-green-700"><FaSave /></button>
                          <button onClick={handleCancelEdit} className="text-red-500 hover:text-red-700"><FaTimes /></button>
                      </div>
                  ) : (
                      <div className="flex items-center space-x-2">
                          <span className="font-bold">{student.roomNumber}</span>
                          <button onClick={() => handleStartEdit(student)} className="text-[#FFB600] hover:text-[#001740]"><FaEdit /></button>
                      </div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <button 
                    onClick={() => handleDeleteAssignment(student._id, student.firstName)}
                    className="text-red-500 hover:text-red-700"
                    title="Un-assign Room/Block"
                  >
                    <FaTrashAlt className="inline h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoomDetails;