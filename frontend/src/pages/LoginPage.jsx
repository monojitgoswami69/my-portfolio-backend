import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

// Import images from public folder
const loginBackground = '/assets/login_background.webp';
const loginLeftCard = '/assets/login_leftcard.webp';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(username, password, rememberMe);

      if (result && result.success) {
        addToast({
          action: 'Success',
          message: 'Welcome back!',
          status: 'complete',
        });
        navigate(from, { replace: true });
      } else {
        setError(result?.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page min-h-screen flex items-center justify-center p-4 md:p-8 transition-colors duration-300">
      {/* Background */}
      <div className="mountain-bg">
        <img
          alt="Scenic mountain landscape at dawn"
          className="scenic-image mix-blend-overlay"
          src={loginBackground}
        />
      </div>

      {/* Main Glass Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl glass-card rounded-[32px] flex flex-col md:flex-row overflow-hidden min-h-[600px] transition-all duration-300"
      >
        {/* Left Panel Wrapper */}
        <div className="md:w-[45%] p-3 md:p-4 flex flex-col">
          {/* Floating Inner Card */}
          <div className="relative rounded-[24px] w-full h-full flex flex-col justify-end text-white overflow-hidden shadow-2xl bg-white/10 backdrop-blur-2xl min-h-[300px] md:min-h-0">
            {/* Background Image */}
            <img
              src={loginLeftCard}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105 opacity-85"
              alt="Login Visual"
            />

            {/* Soft Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

            <div className="relative z-10 p-8 md:p-12 mb-4">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight drop-shadow-sm font-display">
                Welcome to <span className="text-amber-300 font-black tracking-normal">Portfolio Manager</span>
              </h1>
              <p className="mt-6 text-white/90 text-lg font-light leading-relaxed">
                Your all-in-one dashboard for managing projects, knowledge base, and system settings.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="md:w-[55%] p-8 md:p-16 flex flex-col justify-center relative">
          <div className="max-w-md mx-auto w-full">
            {/* Header */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2 font-display">Welcome back</h2>
              <p className="text-slate-500 text-base">
                Enter your details to access the dashboard
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  className="block text-sm font-semibold text-slate-700 mb-2 ml-1"
                  htmlFor="username"
                >
                  Username
                </label>
                <input
                  className="w-full px-4 py-3.5 rounded-xl input-glass text-slate-900 focus:ring-0 transition-all outline-none placeholder-slate-500"
                  id="username"
                  name="username"
                  placeholder="Enter your username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label
                    className="block text-sm font-semibold text-slate-700"
                    htmlFor="password"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3.5 rounded-xl input-glass text-slate-900 focus:ring-0 transition-all outline-none placeholder-slate-500 pr-12"
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2 mb-2 ml-1">
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 bg-white/20 text-primary focus:ring-0 outline-none transition-colors cursor-pointer"
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium text-slate-600 cursor-pointer select-none"
                >
                  Remember me
                </label>
              </div>

              <button
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </form>


          </div>
        </div>
      </motion.div>

      {/* Inline styles for glassmorphism */}
      <style>{`
        .login-page {
          font-family: 'Plus Jakarta Sans', 'Arvo', sans-serif;
        }
        
        .mountain-bg {
          background: linear-gradient(to bottom, #dbeafe, #93c5fd);
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
        }
        
        .scenic-image {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.9;
          transition: opacity 0.5s ease;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(50px);
          -webkit-backdrop-filter: blur(50px);
          border: none;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05), inset 0 0 30px rgba(255, 255, 255, 0.2);
        }
        
        .input-glass {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: #1e293b;
          transition: all 0.2s ease;
          box-shadow: none !important;
        }
        
        .input-glass:focus {
          background-color: rgba(255, 255, 255, 0.25) !important;
          border-color: #4F46E5 !important;
          box-shadow: 0 0 0 1px #4F46E5 !important;
          outline: none !important;
        }
        
        .input-glass::placeholder {
          color: rgba(30, 41, 59, 0.6);
        }
        
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px rgba(255, 255, 255, 0.05) inset !important;
          -webkit-text-fill-color: #1e293b !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
}
