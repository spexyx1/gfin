import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, UserPlus, LogIn, AlertCircle, CheckCircle, AtSign } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { login, signup, isLoading } = useAuth();



  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
    });
    setError('');
    setSuccess('');
  };

  const handleModeSwitch = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (mode === 'signup') {
        // Validation
        if (!formData.username.trim()) {
          throw new Error('Username is required');
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        await signup(formData.username, formData.password);
        setSuccess('Account created successfully! Welcome to GHETTO FINANCE!');
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1500);
      } else {
        // Login validation
        if (!formData.username.trim()) {
          throw new Error('Username is required');
        }
        if (!formData.password) {
          throw new Error('Password is required');
        }

        await login(formData.username.trim(), formData.password);
        setSuccess('Login successful! Welcome back!');
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1000);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="luxe-glass-strong rounded-2xl border border-white/20 w-full max-w-md overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl luxe-title text-white text-center flex-1">
            {mode === 'login' ? 'Login' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:luxe-glass rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-sm font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field for both login and signup */}
            <div>
              <label className="block text-white luxe-subtitle mb-2 text-sm">Username</label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => {
                    const cleanUsername = e.target.value.startsWith('@') ? e.target.value.substring(1) : e.target.value;
                    setFormData({ ...formData, username: cleanUsername });
                  }}
                  className="w-full pl-12 pr-4 py-3 luxe-glass border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37]/50 text-white placeholder-gray-500 transition-all"
                  placeholder={mode === 'login' ? 'your_username' : 'choose_a_username'}
                  required
                />
              </div>
              <p className="text-gray-500 text-xs mt-1.5 font-light">
                {mode === 'signup' ? '3-20 characters, letters, numbers, and underscores only' : 'Enter your username (with or without @)'}
              </p>
            </div>

            <div>
              <label className="block text-white luxe-subtitle mb-2 text-sm">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3 luxe-glass border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37]/50 text-white placeholder-gray-500 transition-all"
                  placeholder={mode === 'signup' ? 'Create a password (min 6 chars)' : 'Enter your password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-white luxe-subtitle mb-2 text-sm">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 luxe-glass border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37]/50 text-white placeholder-gray-500 transition-all"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 luxe-btn-primary disabled:opacity-50 disabled:cursor-not-allowed luxe-title rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  <span>{mode === 'login' ? 'Login' : 'Create Account'}</span>
                </>
              )}
            </button>
          </form>


          {/* Mode Switch */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm matrix-font">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </p>
            <button
              onClick={() => handleModeSwitch(mode === 'login' ? 'signup' : 'login')}
              className="mt-2 text-red-400 hover:text-red-400 hover:shadow-neon-red matrix-font transition-all duration-300 neon-red-text"
            >
              {mode === 'login' ? 'CREATE ACCOUNT' : 'LOGIN'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}