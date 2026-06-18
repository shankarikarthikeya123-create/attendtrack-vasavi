import React, { createContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate session on app initialization
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('attendtrack_token');
      if (token) {
        try {
          const res = await axiosInstance.get('/auth/me');
          setUser(res.data.user);
        } catch (error) {
          console.error('Session validation failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await axiosInstance.post('/auth/login', { username, password });
      const { token, user: userData } = res.data;

      localStorage.setItem('attendtrack_token', token);
      localStorage.setItem('attendtrack_user', JSON.stringify(userData));
      setUser(userData);
      toast.success(`Welcome back, ${userData.fullName}!`);
      return userData;
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(errMsg);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('attendtrack_token');
    localStorage.removeItem('attendtrack_user');
    setUser(null);
    toast.success('Logged out successfully.');
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await axiosInstance.patch('/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success(res.data.message || 'Password updated successfully.');
      return res.data;
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to update password.';
      toast.error(errMsg);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};
