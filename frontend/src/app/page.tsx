'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If user is authenticated, show dashboard
  if (user) {
    return <Dashboard />;
  }

  // Show authentication forms
  return (
    <div className="min-h-screen bg-gray-50">
      {showRegister ? (
        <div>
          <RegisterForm />
          <div className="text-center mt-4">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => setShowRegister(false)}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      ) : (
        <div>
          <LoginForm />
          <div className="text-center mt-4">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => setShowRegister(true)}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
