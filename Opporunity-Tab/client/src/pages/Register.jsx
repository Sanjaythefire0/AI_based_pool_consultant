import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('consultant'); // default
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://server-opportunity.onrender.com/register', { email, password, role });
      alert('Registration successful!');
      navigate('/login'); // Redirect to login
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 px-4">
      <form 
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full"
      >
        <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">Register</h2>
        
        <label className="block mb-2 text-gray-700 font-medium">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full p-3 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        
        <label className="block mb-2 text-gray-700 font-medium">Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full p-3 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        
        <label className="block mb-2 text-gray-700 font-medium">Role</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          required
          className="w-full p-3 mb-6 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="consultant">Consultant</option>
          <option value="admin">Admin</option>
        </select>
        
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded transition duration-300"
        >
          Register
        </button>
        
        <p className="mt-4 text-center text-gray-600">
          Already registered?{' '}
          <a href="/login" className="text-indigo-600 hover:underline">
            Login here
          </a>
        </p>
      </form>
    </div>
  );
}

export default Register;
