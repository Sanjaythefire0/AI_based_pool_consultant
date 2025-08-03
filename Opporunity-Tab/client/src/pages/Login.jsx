import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://server-opportunity.onrender.com/login', { email, password });
      const { token, role } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('user-email', email);
      
      if (role === 'admin') {
        navigate('/admin-dashboard');
      } else if (role === 'consultant') {
        navigate('/consultant-dashboard');
      } else {
        alert('Unknown role');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 px-4">
      <form 
        onSubmit={handleLogin} 
        className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full"
      >
        <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">Login</h2>
        
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
          className="w-full p-3 mb-6 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded transition duration-300"
        >
          Login
        </button>
        
        <p className="mt-4 text-center text-gray-600">
          Don't have an account?{' '}
          <a href="/register" className="text-indigo-600 hover:underline">
            Register here
          </a>
        </p>
      </form>
    </div>
  );
}

export default Login;
