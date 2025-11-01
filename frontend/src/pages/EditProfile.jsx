import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditProfile = () => {
  const { user, login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    year: '',
    department: '',
    hobbies: [],
    password: '',
    newPassword: '',
    role: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const hobbyOptions = [
    'Reading', 'Sports', 'Music', 'Coding', 'Gaming', 
    'Photography', 'Travel', 'Cooking', 'Art', 'Fitness'
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const token = user.token;
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        };
        const { data } = await axios.get('http://localhost:5000/api/users/profile', config);

        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          gender: data.gender || 'Male',
          year: data.year || '',
          department: data.department || '',
          hobbies: data.hobbies || [], 
          password: '',
          newPassword: '',
          role: data.role,
        });
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError(err.response?.data?.message || 'Failed to fetch profile data');
      }
    };

    fetchProfile();
  }, [isAuthenticated, navigate, user?.token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleHobbyChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const newHobbies = checked
        ? [...prev.hobbies, value]
        : prev.hobbies.filter(h => h !== value);
      return { ...prev, hobbies: newHobbies };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    
    if (formData.role !== 'student') {
      setError("Only students are authorized to use this edit page.");
      return;
    }

    const updateData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      gender: formData.gender,
      hobbies: formData.hobbies,
    };
    
    if (formData.newPassword) {
      updateData.password = formData.newPassword;
    }
    
    setLoading(true);
    try {
      const token = user.token;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };

      const { data } = await axios.put('http://localhost:5000/api/users/profile', updateData, config);
      
      const updatedUser = { ...data, token: user.token };
      login(updatedUser); 

      setSuccess('Profile updated successfully!');
      setFormData(prev => ({ ...prev, newPassword: '' })); 

    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-3 border border-gray-300 rounded-md focus:ring-[#FFB600] focus:border-[#FFB600] disabled:bg-gray-100 disabled:text-gray-500";
  const buttonClass = "w-full bg-[#001740] text-white p-3 rounded-md font-semibold hover:bg-[#FFB600] hover:text-[#001740] transition duration-150 disabled:opacity-50";

  if (loading && !formData.firstName) {
    return (
      <div className="text-center py-12">
        <div className="w-10 h-10 border-4 border-[#FFB600] border-t-transparent border-solid rounded-full animate-spin inline-block"></div>
        <p className="mt-2 text-gray-600">Loading Profile...</p>
      </div>
    );
  }
  
  if (formData.role && formData.role !== 'student') {
      return <div className="text-red-600 text-center py-12 text-xl">Access Denied: As a {formData.role.toUpperCase()}, you are not authorized to use this profile editor.</div>;
  }

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#f8f8f8]">
      <div className="max-w-xl w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <h2 className="text-center text-3xl font-extrabold text-[#001740]">
          Edit Student Profile
        </h2>
        {success && <p className="text-green-600 text-center p-3 bg-green-50 rounded-md">{success}</p>}
        {error && <p className="text-red-600 text-center p-3 bg-red-50 rounded-md">{error}</p>}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          <div className="grid grid-cols-2 gap-4">
            <input name="firstName" type="text" required value={formData.firstName} onChange={handleChange} className={inputClass} placeholder="First Name" />
            <input name="lastName" type="text" required value={formData.lastName} onChange={handleChange} className={inputClass} placeholder="Last Name" />
          </div>

          <div className="space-y-4">
            <input name="email" type="email" required value={formData.email} onChange={handleChange} className={inputClass} placeholder="Email address" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year (Read Only)</label>
              <input name="year" type="text" value={formData.year} disabled className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department (Read Only)</label>
              <input name="department" type="text" value={formData.department} disabled className={inputClass} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <input name="phoneNumber" type="tel" required value={formData.phoneNumber} onChange={handleChange} className={inputClass} placeholder="Phone Number" />
             <select name="gender" required value={formData.gender} onChange={handleChange} className={inputClass}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hobbies (Optional)</label>
            <div className="grid grid-cols-3 gap-2 p-3 border border-gray-300 rounded-md bg-gray-50">
              {hobbyOptions.map(hobby => (
                <label key={hobby} className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    name="hobbies"
                    value={hobby}
                    checked={formData.hobbies.includes(hobby)}
                    onChange={handleHobbyChange}
                    className="h-4 w-4 text-[#FFB600] border-gray-300 rounded focus:ring-[#FFB600]"
                  />
                  <span>{hobby}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Change Password (Leave blank to keep current)</label>
            <input name="newPassword" type="password" value={formData.newPassword} onChange={handleChange} className={inputClass} placeholder="New Password" />
          </div>

          <div>
            <button type="submit" className={buttonClass} disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;