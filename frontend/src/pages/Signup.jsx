import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const departments = ['CSE', 'EEE', 'ECE', 'MECH', 'CIVIL', 'IT', 'AIML', 'AIDS'];
  const years = [1, 2, 3, 4];
  const hobbyOptions = [
    'Reading', 'Sports', 'Music', 'Coding', 'Gaming', 
    'Photography', 'Travel', 'Cooking', 'Art', 'Fitness'
  ];
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    year: '',
    department: departments[0],
    phoneNumber: '',
    gender: 'Male',
    hobbies: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', formData);

      login(res.data); 
      navigate('/'); 
    } catch (err) {
      setError(err.response?.data?.details?.join(', ') || err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-3 border border-gray-300 rounded-md focus:ring-[#FFB600] focus:border-[#FFB600]";
  const buttonClass = "w-full bg-[#001740] text-white p-3 rounded-md font-semibold hover:bg-[#FFB600] hover:text-[#001740] transition duration-150 disabled:opacity-50";

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#f8f8f8]">
      <div className="max-w-xl w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <h2 className="text-center text-3xl font-extrabold text-[#001740]">
          Create a HostIQ Account
        </h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <input name="firstName" type="text" required value={formData.firstName} onChange={handleChange} className={inputClass} placeholder="First Name" />
            <input name="lastName" type="text" required value={formData.lastName} onChange={handleChange} className={inputClass} placeholder="Last Name" />
          </div>

          <div className="space-y-4">
            <input name="email" type="email" required value={formData.email} onChange={handleChange} className={inputClass} placeholder="Email address" />
            <input name="password" type="password" required value={formData.password} onChange={handleChange} className={inputClass} placeholder="Password (min 6 chars)" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <select name="year" required value={formData.year} onChange={handleChange} className={inputClass}>
              <option value="" disabled>Year</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select name="department" required value={formData.department} onChange={handleChange} className={inputClass}>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select name="gender" required value={formData.gender} onChange={handleChange} className={inputClass}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <input name="phoneNumber" type="tel" required value={formData.phoneNumber} onChange={handleChange} className={inputClass} placeholder="Phone Number" />
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
            <button type="submit" className={buttonClass} disabled={loading}>
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          Already have an account? <Link to="/login" className="font-medium text-[#FFB600] hover:text-[#001740]">Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;