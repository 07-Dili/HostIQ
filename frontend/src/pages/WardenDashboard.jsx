import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaBed, FaCheck, FaTimes, FaSearch, FaLightbulb } from 'react-icons/fa';

const WardenDashboard = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('addStudent'); 
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [roomAvailability, setRoomAvailability] = useState({}); 
  
  const [matchedRooms, setMatchedRooms] = useState(null); 
  const [matchingLoading, setMatchingLoading] = useState(false);

  const wardenGender = user?.gender || 'Male'; 
  
  const [studentData, setStudentData] = useState({
    firstName: '', lastName: '', email: '', password: '', year: '', 
    department: 'CSE', phoneNumber: '', 
    gender: wardenGender, 
    hobbies: [], 
    roomNumber: '', blockName: user?.blockName || '' 
  });
  
  const [roomAssignment, setRoomAssignment] = useState({}); 

  const departments = ['CSE', 'EEE', 'ECE', 'MECH', 'CIVIL', 'IT', 'AIML', 'AIDS'];
  const years = [1, 2, 3, 4];
  const hobbyOptions = ['Reading', 'Sports', 'Music', 'Coding', 'Gaming', 'Photography', 'Travel', 'Cooking', 'Art', 'Fitness'];

  if (!isAuthenticated || user.role !== 'warden') {
    navigate('/'); 
    return null;
  }
  
  useEffect(() => {
      if (user?.blockName && user?.gender) {
          setStudentData(prev => ({ 
              ...prev, 
              blockName: user.blockName,
              gender: user.gender
          }));
      }
  }, [user?.blockName, user?.gender]);


  const fetchUnassignedData = async () => {
    setLoading(true);
    try {
      const token = user.token;
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      const { data: dbData } = await axios.get(`http://localhost:5000/api/users/database?blockName=${user.blockName}`, config);
      
      const allRelevantStudents = Object.values(dbData.rooms).flat();
      
      const assignedStudents = allRelevantStudents.filter(s => s.roomNumber && s.roomNumber !== 0);
      
      const unassignedFromBackend = dbData.rooms['Unassigned'] || [];
      
      const roomCounts = assignedStudents.reduce((acc, student) => {
        if (student.roomNumber) {
          acc[student.roomNumber] = (acc[student.roomNumber] || 0) + 1;
        }
        return acc;
      }, {});
      
      setUnassignedStudents(unassignedFromBackend);
      setRoomAvailability(roomCounts);

    } catch (err) {
      setStatusMessage({ type: 'error', message: err.response?.data?.message || 'Failed to fetch unassigned students.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.blockName && activeTab === 'assignRoom') {
      fetchUnassignedData();
    }
  }, [user.blockName, activeTab]); 

  const handleStudentChange = (e) => {
      const { name, value } = e.target;
      let newValue = value;
      
      if (name === 'roomNumber' || name === 'year') {
          newValue = parseInt(value) || '';
      }
      
      setStudentData({ ...studentData, [name]: newValue });
  };
  
  const handleHobbyChange = (e) => {
    const { value, checked } = e.target;
    setStudentData(prev => {
      const newHobbies = checked
        ? [...prev.hobbies, value]
        : prev.hobbies.filter(h => h !== value);
      return { ...prev, hobbies: newHobbies };
    });
  };

  const handleHobbyMatch = async () => {
      if (studentData.hobbies.length === 0) {
          setMatchedRooms(null);
          setStatusMessage({ type: 'error', message: 'Please select at least one hobby to find matches.' });
          return;
      }
      
      setMatchingLoading(true);
      setStatusMessage({ type: '', message: '' });
      setMatchedRooms(null);

      try {
          const token = user.token;
          const config = { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } };
          
          const matchData = {
              blockName: user.blockName,
              proposedHobbies: studentData.hobbies
          };

          const { data } = await axios.post('http://localhost:5000/api/users/hobby-match', matchData, config);
          
          setMatchedRooms(data.matchedRooms);

      } catch (err) {
          setStatusMessage({ type: 'error', message: err.response?.data?.message || 'Matching failed.' });
          setMatchedRooms([]);
      } finally {
          setMatchingLoading(false);
      }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', message: '' });
    setLoading(true);

    if (!studentData.roomNumber || studentData.roomNumber <= 0 || !studentData.blockName) {
         setStatusMessage({ type: 'error', message: 'Room number and Block Name must be validly specified.' });
         setLoading(false);
         return;
    }
    
    if ((roomAvailability[studentData.roomNumber] || 0) >= 4) {
         setStatusMessage({ type: 'error', message: `Room ${studentData.roomNumber} is full (max 4 students).` });
         setLoading(false);
         return;
    }
    
    const finalStudentData = {
        ...studentData,
        blockName: user.blockName,
        gender: user.gender
    };

    try {
      const token = user.token;
      const config = { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } };

      await axios.post('http://localhost:5000/api/users/student', finalStudentData, config);
      
      setStatusMessage({ type: 'success', message: `Student ${studentData.firstName} added and assigned to Room ${studentData.roomNumber}!` });
      
      setStudentData(prev => ({ 
          ...prev, 
          firstName: '', lastName: '', email: '', password: '', phoneNumber: '', 
          roomNumber: '', year: '', hobbies: [] 
      }));
      setMatchedRooms(null);
      
      fetchUnassignedData(); 

    } catch (err) {
      setStatusMessage({ type: 'error', message: err.response?.data?.message || 'Failed to add student.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRoomInput = (studentId, roomNumber) => {
      setRoomAssignment(prev => ({ ...prev, [studentId]: parseInt(roomNumber) || '' }));
  };

  const isRoomValid = (roomNumber) => {
      const currentCount = roomAvailability[roomNumber] || 0;
      const pendingAssignments = Object.values(roomAssignment).filter(r => r === roomNumber).length;
      
      return (currentCount + pendingAssignments) < 5; 
  }

  const handleConfirmAssignment = async (student) => {
      const roomNumber = roomAssignment[student._id];
      
      if (!roomNumber) {
          setStatusMessage({ type: 'error', message: `Please enter a room number for ${student.firstName}.` });
          return;
      }
      
      if (!isRoomValid(roomNumber)) {
          setStatusMessage({ type: 'error', message: `Room ${roomNumber} is full. Max 4 students.` });
          return;
      }
      
      setLoading(true);
      try {
          const token = user.token;
          const config = { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } };
          
          const updateData = {
            roomNumber: roomNumber,
            blockName: user.blockName 
          };
          
          await axios.put(`http://localhost:5000/api/users/student/${student._id}/room`, updateData, config);
          
          setStatusMessage({ type: 'success', message: `${student.firstName} assigned to Room ${roomNumber}!` });
          setRoomAssignment(prev => { delete prev[student._id]; return {...prev}; });
          fetchUnassignedData();

      } catch (err) {
          setStatusMessage({ type: 'error', message: err.response?.data?.message || 'Room assignment failed.' });
      } finally {
          setLoading(false);
      }
  };

  const inputClass = "w-full p-3 border border-gray-300 rounded-md focus:ring-[#FFB600] focus:border-[#FFB600]";
  const buttonClass = "w-full bg-[#001740] text-white p-3 rounded-md font-semibold hover:bg-[#FFB600] hover:text-[#001740] transition duration-150 disabled:opacity-50";

  return (
    <div className="p-4">
      <h1 className="text-4xl font-extrabold text-[#001740] mb-6">Warden Dashboard - {user.blockName} Block</h1>
      
      {statusMessage.message && (
        <div className={`p-3 mb-4 rounded-md font-semibold ${statusMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {statusMessage.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-300 mb-6">
        <button
          onClick={() => setActiveTab('addStudent')}
          className={`px-4 py-2 text-lg font-medium transition-colors ${activeTab === 'addStudent' ? 'text-[#001740] border-b-2 border-[#FFB600]' : 'text-gray-500 hover:text-[#FFB600]'}`}
        >
          <FaUserPlus className="inline mr-2" /> Add New Student
        </button>
        <button
          onClick={() => setActiveTab('assignRoom')}
          className={`px-4 py-2 text-lg font-medium transition-colors ${activeTab === 'assignRoom' ? 'text-[#001740] border-b-2 border-[#FFB600]' : 'text-gray-500 hover:text-[#FFB600]'}`}
        >
          <FaBed className="inline mr-2" /> Assign Rooms
        </button>
      </div>
      
      {/* 1. Add New Student Tab */}
      {activeTab === 'addStudent' && (
        <div className="max-w-3xl bg-white p-8 rounded-xl shadow-lg flex space-x-6">
          
          {/* Student Form Section */}
          <div className="w-2/3">
            <h2 className="text-2xl font-bold text-[#001740] mb-4">Add Student to {user.blockName} Block</h2>
            <p className="text-sm text-gray-500 mb-4">Block: <span className="font-semibold text-[#FFB600]">{user.blockName}</span>. Gender: <span className="font-semibold text-[#FFB600]">{user.gender}</span>.</p>
            <form className="space-y-4" onSubmit={handleAddStudent}>
              
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4">
                  <input name="firstName" type="text" required value={studentData.firstName} onChange={handleStudentChange} className={inputClass} placeholder="First Name" />
                  <input name="lastName" type="text" required value={studentData.lastName} onChange={handleStudentChange} className={inputClass} placeholder="Last Name" />
              </div>
              
              <input name="email" type="email" required value={studentData.email} onChange={handleStudentChange} className={inputClass} placeholder="Email address" />
              <input name="password" type="password" required value={studentData.password} onChange={handleStudentChange} className={inputClass} placeholder="Temporary Password" />
              <input name="phoneNumber" type="tel" required value={studentData.phoneNumber} onChange={handleStudentChange} className={inputClass} placeholder="Phone Number" />
              
              <div className="grid grid-cols-3 gap-4">
                  <select name="year" required value={studentData.year} onChange={handleStudentChange} className={inputClass}>
                      <option value="">Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select name="department" required value={studentData.department} onChange={handleStudentChange} className={inputClass}>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input name="roomNumber" type="number" required value={studentData.roomNumber} onChange={handleStudentChange} className={inputClass} placeholder="Room No." />
              </div>

              {/* Hobbies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hobbies (Optional)</label>
                <div className="grid grid-cols-4 gap-2 p-3 border border-gray-300 rounded-md bg-gray-50">
                  {hobbyOptions.map(hobby => (
                    <label key={hobby} className="flex items-center space-x-2 text-sm text-gray-600">
                      <input type="checkbox" name="hobbies" value={hobby} checked={studentData.hobbies.includes(hobby)} onChange={handleHobbyChange} className="h-4 w-4 text-[#FFB600] border-gray-300 rounded focus:ring-[#FFB600]" />
                      <span>{hobby}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <button type="submit" className={buttonClass} disabled={loading}>
                {loading ? 'Adding...' : 'Add Student'}
              </button>
            </form>
          </div>
          
          {/* Hobby Match Section */}
          <div className="w-1/3 bg-[#f8f8f8] p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-[#001740] mb-3 flex items-center">
                  <FaLightbulb className="text-[#FFB600] mr-2" /> Room Suggestions
              </h3>

              <button 
                  onClick={handleHobbyMatch} 
                  disabled={studentData.hobbies.length === 0 || matchingLoading}
                  className="w-full bg-[#001740] text-white p-2 rounded-md text-sm hover:bg-[#FFB600] hover:text-[#001740] transition disabled:opacity-50 flex items-center justify-center mb-4"
              >
                  <FaSearch className="mr-2" /> {matchingLoading ? 'Searching...' : 'Find Compatible Rooms'}
              </button>

              {matchedRooms === null && <p className="text-sm text-gray-500">Select hobbies and click 'Find' for suggestions.</p>}
              
              {matchedRooms && matchedRooms.length > 0 ? (
                  <div className="space-y-2">
                      <p className="text-sm font-semibold text-green-700">Top Matches (Score: Avg Hobbies / Current Students):</p>
                      {matchedRooms.map(room => (
                          <div key={room.roomNumber} 
                               onClick={() => setStudentData(prev => ({...prev, roomNumber: room.roomNumber}))}
                               className={`p-3 border rounded-lg cursor-pointer transition ${studentData.roomNumber == room.roomNumber ? 'bg-[#FFB600] border-[#001740] text-[#001740]' : 'bg-white hover:bg-[#FFF5E6]'}`}
                          >
                              <div className="flex justify-between items-center text-sm font-bold">
                                  <span>Room {room.roomNumber}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${room.currentStudents >= 3 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                                      {room.currentStudents} / 4
                                  </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                  Match Score: <span className="font-semibold text-[#001740]">{room.averageMatchScore.toFixed(1)}</span> (Total Hobbies Shared: {room.totalMatchScore})
                              </p>
                          </div>
                      ))}
                  </div>
              ) : matchedRooms && matchedRooms.length === 0 && !matchingLoading ? (
                  <p className="text-sm text-center text-gray-500 py-4">No available rooms matched your selected hobbies. Try different hobbies, or everyone got their friends already!</p>
              ) : null}
          </div>
        </div>
      )}

      {/* 2. Assign Rooms Tab */}
      {activeTab === 'assignRoom' && (
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-[#001740] mb-4">Assign Room to Unassigned Students ({user.blockName})</h2>
          
          {loading ? (
              <p className="text-center text-gray-500">Loading unassigned students...</p>
          ) : unassignedStudents.length === 0 ? (
              <p className="text-center text-gray-500">All students in {user.blockName} have been assigned a room.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#f8f8f8]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Year/Dept</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-32">Assign Room</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unassignedStudents.map(student => {
                    const roomNo = roomAssignment[student._id];
                    const isValid = roomNo && isRoomValid(roomNo);
                    
                    return (
                      <tr key={student._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#001740]">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.year} - {student.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <input 
                            type="number" 
                            placeholder="Room No"
                            value={roomNo || ''}
                            onChange={(e) => handleRoomInput(student._id, e.target.value)}
                            className={`p-2 border rounded text-sm w-24 ${!isValid && roomNo ? 'border-red-500' : 'border-gray-300 focus:ring-[#FFB600] focus:border-[#FFB600]'}`}
                          />
                          {!isValid && roomNo && <span className="text-red-500 text-xs ml-2">Full!</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button 
                            onClick={() => handleConfirmAssignment(student)}
                            disabled={!isValid || loading}
                            className={`px-3 py-1 rounded text-white text-xs font-semibold transition ${isValid ? 'bg-[#FFB600] hover:bg-[#001740] hover:text-white' : 'bg-gray-300 cursor-not-allowed'}`}
                          >
                            <FaCheck className="inline mr-1" /> Assign
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-gray-600">
                  <p className="font-semibold text-[#001740]">Current Room Availability in {user.blockName}:</p>
                  <ul className="mt-1 flex flex-wrap gap-x-4">
                      {Object.keys(roomAvailability).map(room => (
                          <li key={room} className={`font-medium ${roomAvailability[room] >= 4 ? 'text-red-600' : 'text-green-600'}`}>
                              Room {room}: {roomAvailability[room]} / 4
                          </li>
                      ))}
                  </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WardenDashboard;