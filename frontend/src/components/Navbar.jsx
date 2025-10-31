import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx'; 
import { FaUserCircle, FaTachometerAlt, FaShieldAlt, FaCalendarCheck, FaMoneyBillAlt } from 'react-icons/fa';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  
  const isAdmin = user?.role === 'admin';
  const isWarden = user?.role === 'warden';
  const isStudent = user?.role === 'student';
  
  const showDatabaseLink = isAuthenticated && (isStudent || isWarden);
  const showAttendanceFeesLinks = isAuthenticated && (isStudent || isWarden);


  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/login');
  };

  const handleEditProfile = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  return (
    <nav className="sticky top-0 z-10 bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24"> 
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className='group relative'>
                <h1 className="text-4xl font-extrabold text-amber-600 transition duration-300 ease-in-out hover:text-amber-800 transform hover:scale-105">
                  HostIQ
                </h1>
                <span className="absolute left-0 bottom-0 w-full h-0.5 bg-amber-600 origin-left transform scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            
            {isAdmin && (
              <Link
                to="/admin"
                className="text-gray-600 hover:text-red-600 transition duration-150 font-bold text-lg flex items-center"
              >
                <FaTachometerAlt className="mr-1" /> Admin Dashboard
              </Link>
            )}

            {isWarden && (
              <Link
                to="/warden"
                className="text-gray-600 hover:text-blue-600 transition duration-150 font-bold text-lg flex items-center"
              >
                <FaShieldAlt className="mr-1" /> Warden Tools
              </Link>
            )}

            {showAttendanceFeesLinks && (
              <Link
                to="/attendance"
                className="text-gray-600 hover:text-purple-600 transition duration-150 font-medium text-lg flex items-center"
              >
                <FaCalendarCheck className="mr-1" /> Attendance
              </Link>
            )}

            {showAttendanceFeesLinks && (
              <Link
                to="/fees"
                className="text-gray-600 hover:text-orange-600 transition duration-150 font-medium text-lg flex items-center"
              >
                <FaMoneyBillAlt className="mr-1" /> Fees
              </Link>
            )}

            {showDatabaseLink && (
              <Link
                to="/database"
                className="text-gray-600 hover:text-amber-600 transition duration-150 font-medium text-lg"
              >
                Database
              </Link>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="p-2 rounded-full text-amber-600 hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition duration-150"
                  aria-expanded={isDropdownOpen}
                >
                  <FaUserCircle className="h-10 w-10" /> 
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b truncate">
                         Hi, {user.firstName} ({user.role})
                      </div>
                      <button
                        onClick={handleEditProfile}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-6 py-3 border border-transparent text-lg font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 transition duration-150"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;