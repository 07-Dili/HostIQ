import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaBuilding, FaSave } from 'react-icons/fa';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('warden');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });

  const [wardenData, setWardenData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    gender: 'Male',
    phoneNumber: '',
    blockName: '',
  });

  const [blockData, setBlockData] = useState({
    blockName: '',
    capacity: 0,
    gender: 'Male',
    wardenEmail: '',
  });

  const blockOptions = ['A', 'B', 'C', 'D'];
  const genderOptions = ['Male', 'Female', 'Other'];

  if (!isAuthenticated || user.role !== 'admin') {
    navigate('/');
    return null;
  }
  
  const handleWardenChange = (e) => {
    setWardenData({ ...wardenData, [e.target.name]: e.target.value });
  };

  const handleCreateWarden = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', message: '' });
    setLoading(true);

    try {
      const token = user.token;
      const config = { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } };
      await axios.post('http://localhost:5000/api/admin/warden', {...wardenData, blockName: wardenData.blockName.toUpperCase()}, config);
      
      setStatusMessage({ type: 'success', message: `Warden ${wardenData.firstName} added successfully!` });
      setWardenData({ firstName: '', lastName: '', email: '', password: '', gender: 'Male', phoneNumber: '', blockName: '' });

    } catch (err) {
      setStatusMessage({ type: 'error', message: err.response?.data?.message || 'Failed to create Warden.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleBlockChange = (e) => {
    const { name, value } = e.target;
    setBlockData(prev => ({ 
        ...prev, 
        [name]: name === 'capacity' ? parseInt(value) || 0 : value 
    }));
  };
  
  const handleCreateBlock = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', message: '' });
    setLoading(true);
    
    if (blockData.blockName.length !== 1) {
        setStatusMessage({ type: 'error', message: 'Block Name must be a single character.' });
        setLoading(false);
        return;
    }

    try {
      const token = user.token;
      const config = { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } };
      
      await axios.post('http://localhost:5000/api/admin/block', blockData, config);
      
      setStatusMessage({ type: 'success', message: `Block ${blockData.blockName.toUpperCase()} created and assigned!` });
      setBlockData({ blockName: '', capacity: 0, gender: 'Male', wardenEmail: '' });

    } catch (err) {
      setStatusMessage({ type: 'error', message: err.response?.data?.message || 'Failed to create Block.' });
    } finally {
      setLoading(false);
    }
  };


  const inputClass = "w-full p-3 border border-gray-300 rounded-md focus:ring-[#FFB600] focus:border-[#FFB600]";
  const buttonClass = "w-full bg-[#001740] text-white p-3 rounded-md font-semibold hover:bg-[#FFB600] hover:text-[#001740] transition duration-150 disabled:opacity-50";

  return (
    <div className="p-4">
      <h1 className="text-4xl font-extrabold text-[#001740] mb-6">Admin Dashboard</h1>
      
      {statusMessage.message && (
        <div className={`p-3 mb-4 rounded-md font-semibold ${statusMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {statusMessage.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-300 mb-6">
        <button
          onClick={() => setActiveTab('warden')}
          className={`px-4 py-2 text-lg font-medium transition-colors ${activeTab === 'warden' ? 'text-[#001740] border-b-2 border-[#FFB600]' : 'text-gray-500 hover:text-[#FFB600]'}`}
        >
          <FaUserPlus className="inline mr-2" /> Add Warden
        </button>
        <button
          onClick={() => setActiveTab('block')}
          className={`px-4 py-2 text-lg font-medium transition-colors ${activeTab === 'block' ? 'text-[#001740] border-b-2 border-[#FFB600]' : 'text-gray-500 hover:text-[#FFB600]'}`}
        >
          <FaBuilding className="inline mr-2" /> Add Block
        </button>
      </div>

      {/* 1. Warden Creation Tab */}
      {activeTab === 'warden' && (
        <div className="max-w-xl bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-[#001740] mb-4">Create New Warden Account</h2>
          <form className="space-y-4" onSubmit={handleCreateWarden}>
            
            <div className="grid grid-cols-2 gap-4">
              <input name="firstName" type="text" required value={wardenData.firstName} onChange={handleWardenChange} className={inputClass} placeholder="First Name" />
              <input name="lastName" type="text" required value={wardenData.lastName} onChange={handleWardenChange} className={inputClass} placeholder="Last Name" />
            </div>

            <input name="email" type="email" required value={wardenData.email} onChange={handleWardenChange} className={inputClass} placeholder="Email address" />
            <input name="password" type="password" required value={wardenData.password} onChange={handleWardenChange} className={inputClass} placeholder="Temporary Password" />
            <input name="phoneNumber" type="tel" required value={wardenData.phoneNumber} onChange={handleWardenChange} className={inputClass} placeholder="Phone Number" />
            
            <div className="grid grid-cols-2 gap-4">
              <select name="gender" required value={wardenData.gender} onChange={handleWardenChange} className={inputClass}>
                {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select name="blockName" required value={wardenData.blockName} onChange={handleWardenChange} className={inputClass}>
                <option value="">-- Select Block Name (e.g., A) --</option>
                {blockOptions.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            
            <button type="submit" className={buttonClass} disabled={loading}>
              {loading ? 'Creating...' : 'Create Warden'}
            </button>
          </form>
        </div>
      )}

      {/* 2. Block Creation Tab */}
      {activeTab === 'block' && (
        <div className="max-w-xl bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-[#001740] mb-4">Create New Hostel Block</h2>
          <form className="space-y-4" onSubmit={handleCreateBlock}>
            
            <div className="grid grid-cols-2 gap-4">
                <input name="blockName" type="text" required value={blockData.blockName} onChange={handleBlockChange} className={inputClass} placeholder="Block Name (e.g., A)" maxLength="1" />
                <input name="capacity" type="number" required value={blockData.capacity} onChange={handleBlockChange} className={inputClass} placeholder="Total Room Capacity" min="1" />
            </div>

            <select name="gender" required value={blockData.gender} onChange={handleBlockChange} className={inputClass}>
                <option value="">-- Select Gender --</option>
                {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            
            <input name="wardenEmail" type="email" required value={blockData.wardenEmail} onChange={handleBlockChange} className={inputClass} placeholder="Warden Email (must be an existing Warden)" />
            
            <button type="submit" className={buttonClass} disabled={loading}>
              <FaSave className="inline mr-2" /> {loading ? 'Saving Block...' : 'Create Block'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;