import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

const Home = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="container mx-auto p-8 bg-white rounded-lg shadow-lg mt-8">
      <h1 className="text-4xl font-extrabold text-amber-600 mb-4">
        Welcome to HostIQ!
      </h1>
      {user ? (
        <div className="space-y-2">
          <p className="text-xl text-gray-700">
            Hello, <span className="font-semibold">{user.firstName} {user.lastName}</span>.
          </p>
          <p className="text-lg text-gray-500">
            You are logged in with the role: <span className="font-medium capitalize text-amber-700">{user.role}</span>.
          </p>
          <p className="pt-4 text-gray-600">
            This is your main dashboard content.
          </p>
        </div>
      ) : (
        <p className="text-xl text-gray-500">
          Please log in or sign up to access your account features.
        </p>
      )}
    </div>
  );
};

export default Home;