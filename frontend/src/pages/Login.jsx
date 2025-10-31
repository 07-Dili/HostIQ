import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      login(res.data); 
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-3 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500";
  const buttonClass = "w-full bg-amber-600 text-white p-3 rounded-md font-semibold hover:bg-amber-700 transition duration-150 disabled:opacity-50";

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <h2 className="text-center text-3xl font-extrabold text-amber-600">
          Sign in to HostIQ
        </h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <input name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="Email address" />
            </div>
            <div>
              <input name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Password" />
            </div>
          </div>

          <div>
            <button type="submit" className={buttonClass} disabled={loading}>
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          Don't have an account? <Link to="/signup" className="font-medium text-amber-600 hover:text-amber-500">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;