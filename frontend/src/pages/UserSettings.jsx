import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, Shield, Construction } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cn } from '../utils/helpers';

export default function UserSettings() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const pageVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 25, scale: 0.97 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25
      }
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePasswordUpdate = async () => {
    const newErrors = {};

    if (!formData.currentPassword || formData.currentPassword.trim() === '') {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword || formData.newPassword.trim() === '') {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword || formData.confirmPassword.trim() === '') {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Password change would need a backend endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('Password updated successfully');

      setShowPasswordForm(false);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});

    } catch (error) {
      showError(error.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordForm(false);
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  return (
    <motion.div
      className="h-full flex flex-col gap-4 md:gap-6 overflow-y-auto overflow-x-hidden py-2 px-1"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      {/* Profile Information Section */}
      <motion.div
        className="bg-white rounded-lg sm:rounded-xl border-2 border-neutral-300/60 shadow-md overflow-hidden"
        variants={cardVariants}
      >
        <div className="p-3 sm:p-4 md:p-6 border-b border-neutral-200">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-neutral-900 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-600" />
            Profile Information
          </h3>
          <p className="hidden sm:block text-xs sm:text-sm text-neutral-600 mt-0.5 sm:mt-1">
            Your account details
          </p>
        </div>

        <div className="p-3 sm:p-4 md:p-6 space-y-5">
          {/* Username - Read Only */}
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs sm:text-sm font-bold text-neutral-900">
                Username
              </label>
              <span className="px-2 py-1 text-xs font-medium text-neutral-500 bg-neutral-100 rounded-md">
                Read-only
              </span>
            </div>
            <div className="px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 text-sm sm:text-base text-neutral-900 font-medium">
              {user?.username || 'admin'}
            </div>
          </div>

          {/* Role - Read Only */}
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs sm:text-sm font-bold text-neutral-900">
                Role
              </label>
              <span className="px-2 py-1 text-xs font-medium text-neutral-500 bg-neutral-100 rounded-md">
                Read-only
              </span>
            </div>
            <div className="px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-200 text-sm sm:text-base text-neutral-900 font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-600" />
              Administrator
            </div>
          </div>
        </div>
      </motion.div>

      {/* Security Section */}
      <motion.div
        className="bg-white rounded-lg sm:rounded-xl border-2 border-neutral-300/60 shadow-md overflow-hidden"
        variants={cardVariants}
      >
        <div className="p-3 sm:p-4 md:p-6 border-b border-neutral-200">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary-600" />
            Security
          </h3>
          <p className="hidden sm:block text-xs sm:text-sm text-neutral-600 mt-0.5 sm:mt-1">
            Manage your password and security settings
          </p>
        </div>

        <div className="p-3 sm:p-4 md:p-6 space-y-5">
          {!showPasswordForm ? (
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div>
                <h4 className="font-medium text-neutral-900">Password</h4>
                <p className="text-sm text-neutral-600">Change your account password</p>
              </div>
              <motion.button
                type="button"
                onClick={() => setShowPasswordForm(true)}
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Change Password
              </motion.button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Current Password */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-neutral-900 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={(e) => handleChange('currentPassword', e.target.value)}
                    placeholder="Enter current password"
                    disabled={isLoading}
                    className={cn(
                      "w-full px-4 py-2.5 pr-12 border-2 rounded-xl bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none transition-all",
                      errors.currentPassword ? "border-red-300 focus:border-red-500" : "border-neutral-300 focus:border-primary-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-primary-600 transition-colors"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-neutral-900 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => handleChange('newPassword', e.target.value)}
                    placeholder="Enter new password"
                    disabled={isLoading}
                    className={cn(
                      "w-full px-4 py-2.5 pr-12 border-2 rounded-xl bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none transition-all",
                      errors.newPassword ? "border-red-300 focus:border-red-500" : "border-neutral-300 focus:border-primary-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-primary-600 transition-colors"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-neutral-900 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                    disabled={isLoading}
                    className={cn(
                      "w-full px-4 py-2.5 pr-12 border-2 rounded-xl bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none transition-all",
                      errors.confirmPassword ? "border-red-300 focus:border-red-500" : "border-neutral-300 focus:border-primary-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-primary-600 transition-colors"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <motion.button
                  type="button"
                  onClick={handleCancelPasswordChange}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-red-700 bg-red-100 border-2 border-red-300 hover:bg-red-200 hover:border-red-500 rounded-lg transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handlePasswordUpdate}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    'Update Password'
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Coming Soon Section */}
      <motion.div
        className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg sm:rounded-xl border-2 border-amber-200 shadow-md overflow-hidden"
        variants={cardVariants}
      >
        <div className="p-4 sm:p-6 flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Construction className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-amber-900">More Features Coming Soon</h3>
            <p className="text-sm text-amber-700 mt-0.5">
              Additional settings and customization options are on the way!
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
