import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaSearch, FaFilter } from 'react-icons/fa'; 

const Database = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [database, setDatabase] = useState({ blockName: 'Undefined', rooms: {}, isWarden: false });
  const [studentsData, setStudentsData] = useState([]);
  
  const [filterDept, setFilterDept] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const isWarden = user?.role === 'warden';
  const isStudent = user?.role === 'student';
  const isAssigned = user?.blockName && user?.blockName !== 'Undefined';

  const departments = ['CSE', 'EEE', 'ECE', 'MECH', 'CIVIL', 'IT', 'AIML', 'AIDS'];
  const years = [1, 2, 3, 4];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (isWarden || isAssigned) {
        fetchDatabase();
    } else if (isStudent && !isAssigned) {
        setLoading(false); 
    }
  }, [isAuthenticated, isWarden, isStudent, isAssigned, navigate, user?.token, user?.blockName]);
  
  const fetchDatabase = async () => {
    setLoading(true);
    setError('');
    try {
      const token = user.token;
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: { blockName: user.blockName } 
      };
      const { data } = await axios.get('http://localhost:5000/api/users/database', config);
      
      const flatStudents = Object.values(data.rooms).flat();
      setStudentsData(flatStudents.filter(s => s.roomNumber && s.roomNumber !== 0));
      setDatabase(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to fetch student database.');
    }
  };

  const handleRoomClick = (roomNumber) => {
      if (isWarden && roomNumber !== 'Unassigned') {
          navigate(`/database/${roomNumber}`);
      }
  };

  const getFilteredData = () => {
    let filteredStudents = studentsData;

    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filteredStudents = filteredStudents.filter(student => 
        student.firstName.toLowerCase().includes(lowerCaseSearch) ||
        student.lastName.toLowerCase().includes(lowerCaseSearch) ||
        String(student.roomNumber).includes(lowerCaseSearch)
      );
    }

    if (filterDept) {
      filteredStudents = filteredStudents.filter(student => student.department === filterDept);
    }

    if (filterYear) {
      filteredStudents = filteredStudents.filter(student => student.year === parseInt(filterYear));
    }
    
    const filteredRooms = filteredStudents.reduce((acc, student) => {
        const roomKey = student.roomNumber;
        if (!acc[roomKey]) {
            acc[roomKey] = [];
        }
        acc[roomKey].push(student);
        return acc;
    }, {});
    
    return filteredRooms;
  };
  
  const filteredRooms = getFilteredData();
  const assignedRoomKeys = Object.keys(filteredRooms).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));


  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent border-solid rounded-full animate-spin inline-block"></div>
        <p className="mt-2 text-gray-600">Loading Student Database...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center py-12 text-xl">{error}</div>;
  }
  
  return (
    <div className="p-4">
      <div className="bg-amber-100 p-6 rounded-lg shadow-md mb-6 border-l-4 border-amber-600">
        <h1 className="text-3xl font-extrabold text-amber-800">Student Database</h1>
        <p className="text-lg text-amber-700 mt-1">
          Block: <span className="font-semibold">{database.blockName || 'N/A'}</span> | Date: <span className="font-semibold">{currentDate}</span>
        </p>
      </div>
      
      {isStudent && !isAssigned && !loading && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6" role="alert">
              <p className="font-bold">Access Restricted</p>
              <p>Your **Room and Block** have not been assigned yet. Once assigned by your Warden, you will have access to view the database for your block here.</p>
          </div>
      )}

      {(isWarden || isAssigned) && (
        <div className="bg-white p-4 mb-6 rounded-lg shadow-md flex flex-wrap gap-4 items-center">
            <FaFilter className="text-gray-500" />
            
            <select 
                value={filterDept} 
                onChange={(e) => setFilterDept(e.target.value)} 
                className="p-2 border border-gray-300 rounded text-sm"
            >
                <option value="">Filter by Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            
            <select 
                value={filterYear} 
                onChange={(e) => setFilterYear(e.target.value)} 
                className="p-2 border border-gray-300 rounded text-sm"
            >
                <option value="">Filter by Year</option>
                {years.map(y => <option key={y} value={y}>{y} Year</option>)}
            </select>
            
            <div className="relative flex items-center ml-auto w-full max-w-sm">
                <input 
                    type="text" 
                    placeholder="Search by Name or Room No..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 pl-10 border border-gray-300 rounded-lg w-full text-sm"
                />
                <FaSearch className="absolute left-3 text-gray-400 h-4 w-4" />
            </div>
            
            {(filterDept || filterYear || searchTerm) && (
                <button 
                    onClick={() => { setFilterDept(''); setFilterYear(''); setSearchTerm(''); }}
                    className="p-2 text-sm text-red-500 hover:text-red-700 font-medium"
                >
                    Reset Filters
                </button>
            )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {(assignedRoomKeys.length === 0 && (isWarden || isAssigned)) ? (
          <p className="col-span-full text-center text-gray-500">No students found matching the current filters.</p>
        ) : (
          (isWarden || isAssigned) && assignedRoomKeys.map(roomNumber => {
            const isClickable = roomNumber !== 'Unassigned';
            return (
              <div 
                key={roomNumber} 
                className={`bg-white p-4 rounded-lg shadow-lg border-t-4 border-amber-500 transition-all ${isWarden && isClickable ? 'hover:shadow-xl cursor-pointer' : ''}`}
                onClick={isWarden && isClickable ? () => handleRoomClick(roomNumber) : undefined}
              >
                
                <h2 className="text-xl font-bold mb-3 text-amber-700">Room No. {roomNumber}</h2>
                <div className="text-sm text-gray-500">
                    Students: {filteredRooms[roomNumber].length} / 4
                </div>
                
                <div className="space-y-1 mt-3">
                  {filteredRooms[roomNumber].slice(0, 4).map(student => (
                    <div key={student._id} className="flex items-center space-x-2">
                      <FaUserCircle className="text-gray-400 h-4 w-4 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-800 truncate">
                        {student.firstName} {student.lastName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Database;