import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EditProfile from './pages/EditProfile.jsx';
import Database from './pages/Database.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import WardenDashboard from './pages/WardenDashboard.jsx';
import RoomDetails from './pages/RoomDetails.jsx';
import Attendance from './pages/Attendance.jsx';
import Fees from './pages/Fees.jsx';           

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto p-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/profile" element={<EditProfile />} />
              
              <Route path="/attendance" element={<Attendance />} /> 
              <Route path="/fees" element={<Fees />} />                
              
              <Route path="/database" element={<Database />} />
              <Route path="/database/:roomNumber" element={<RoomDetails />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/warden" element={<WardenDashboard />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;