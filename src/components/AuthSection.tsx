/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogIn, UserPlus, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';

interface AuthSectionProps {
  onAuthSuccess: (user: User, token: string) => void;
}

export default function AuthSection({ onAuthSuccess }: AuthSectionProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password.trim() || (!isLogin && !displayName.trim())) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { username, password } 
      : { username, password, displayName };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please check your credentials.');
      }

      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col lg:flex-row items-center justify-center p-4 lg:p-12 bg-gray-100 dark:bg-gray-950 font-sans gap-8 max-w-6xl mx-auto">
      {/* Branding and welcome messaging */}
      <div className="w-full lg:w-1/2 text-center lg:text-left space-y-4">
        <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-blue-600 block">
          freebook
        </h1>
        <p className="text-xl lg:text-2xl text-gray-700 dark:text-gray-300 font-normal leading-relaxed max-w-md mx-auto lg:mx-0">
          Connect with friends and the world around you on Freebook. Share updates, photos, and messages.
        </p>
        <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-500 font-mono mt-8">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          <span>Secure server-side database active</span>
        </div>
      </div>

      {/* Auth Card container */}
      <div className="w-full max-w-md lg:w-1/2">
        <div className="bg-white dark:bg-gray-900 p-6 lg:p-8 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm flex items-start gap-2 animate-pulse">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-705 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Rachel Green"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-850 focus:bg-white dark:focus:bg-gray-800 transition-all text-sm placeholder-gray-400 dark:placeholder-gray-500"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-750 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                placeholder="rachel_g"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-805 dark:text-white bg-gray-50 dark:bg-gray-855 focus:bg-white dark:focus:bg-gray-800 transition-all text-sm placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-750 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-805 dark:text-white bg-gray-50 dark:bg-gray-855 focus:bg-white dark:focus:bg-gray-800 transition-all text-sm pr-10 placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-base shadow transition-all hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              ) : isLogin ? (
                <>
                  <LogIn className="w-5 h-5" />
                  Log In
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <hr className="my-6 border-gray-200 dark:border-gray-800" />

          <div className="text-center">
            {isLogin ? (
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
                className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-sm transition-all hover:scale-[1.02] shadow cursor-pointer"
              >
                Create New Account
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
                className="text-blue-605 dark:text-blue-400 hover:underline font-semibold text-sm cursor-pointer"
              >
                Already have an account? Sign In
              </button>
            )}
          </div>
        </div>
        <div className="text-center mt-4 text-xs text-gray-500 dark:text-gray-400">
          Demo User Credentials: <span className="font-semibold text-gray-650 dark:text-gray-300">sarah_j</span> | Password: <span className="font-semibold text-gray-650 dark:text-gray-300">password123</span>
        </div>
      </div>
    </div>
  );
}
