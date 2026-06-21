/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../hooks/useApp';
import { Button, Input, Card } from './ui';
import { UserRole } from '../types';
import { motion } from 'motion/react';
import { ShieldCheck, UserCircle, BriefcaseMedical, CheckCircle2, ArrowRight, LogOut, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export const AuthView = () => {
  const { login, loginWithEmail, signupWithEmail, signup, logout, firebaseUser, currentUser, resetDatabase, isAdmin } = useApp();
  const [role, setRole] = React.useState<UserRole>('RBT');
  const [isFinishing, setIsFinishing] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [authError, setAuthError] = React.useState('');
  const [authLoading, setAuthLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    certNumber: '',
  });

  // Automatically switch to "Finish Profile" if firebaseUser exists but no profile yet
  React.useEffect(() => {
    if (firebaseUser && !currentUser) {
      setIsFinishing(true);
      const displayName = firebaseUser.displayName || '';
      const parts = displayName.trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      setFormData(prev => ({ 
        ...prev, 
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
        email: prev.email || firebaseUser.email || ''
      }));
    } else {
      setIsFinishing(false);
    }
  }, [firebaseUser, currentUser]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
    await signup({
      name: fullName,
      email: formData.email,
      role: role,
      certificationNumber: formData.certNumber,
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'signin') {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      let msg = 'Failed to authenticate. Please check your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.message?.includes('INVALID_LOGIN_CREDENTIALS')) {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use' || err.message?.includes('EMAIL_EXISTS')) {
        msg = 'An account already exists with this email.';
      } else if (err.code === 'auth/weak-password' || err.message?.includes('WEAK_PASSWORD')) {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email' || err.message?.includes('INVALID_EMAIL')) {
        msg = 'Please enter a valid email address.';
      } else if (err.message) {
        msg = err.message;
      }
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <img 
            src="/abass-icon.png" 
            alt="ABA SuperSync Logo" 
            className="w-16 h-16 mx-auto mb-4 object-contain filter drop-shadow-md"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">ABA SuperSync</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Clinical Supervision & Compliance Portal</p>
        </div>

        <Card className="p-8 relative overflow-hidden">
          {isFinishing ? (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold mb-4">
                  <CheckCircle2 className="w-3 h-3" />
                  Authenticated successfully
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Setup</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Logged in as {firebaseUser?.email}</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Identify Your Clinical Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('RBT')}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                        role === 'RBT' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <UserCircle className="w-8 h-8" />
                      <span className="text-sm font-bold">RBT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('BCBA')}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                        role === 'BCBA' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <BriefcaseMedical className="w-8 h-8" />
                      <span className="text-sm font-bold">BCBA / BCBA-D</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                    <Input 
                      type="text" 
                      required 
                      placeholder="Jane"
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                    <Input 
                      type="text" 
                      required 
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <Input 
                    type="email" 
                    required 
                    placeholder="clinical.email@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">This will be used for professional invitations</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Certification # (Optional)</label>
                  <Input 
                    type="text" 
                    placeholder={role === 'RBT' ? "e.g. RBT-00-00000" : "e.g. 0-00-00000"}
                    value={formData.certNumber}
                    onChange={e => setFormData({ ...formData, certNumber: e.target.value })}
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full py-6 text-base bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none group">
                    <span>Complete Account Setup</span>
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </form>

              <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-800">
                <button 
                  onClick={() => logout()}
                  className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  Sign out and use a different account
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-1">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Provider Login</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Welcome to your clinical supervision dashboard.</p>
              </div>

              {/* Primary Google Login Option */}
              <Button 
                onClick={() => login()}
                className="w-full py-6 text-base font-bold flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-600 dark:hover:border-indigo-500 text-gray-900 dark:text-white transition-all shadow-sm hover:shadow group"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 animate-none group-hover:scale-105 transition-transform" alt="Google" />
                <span>Continue with Google</span>
              </Button>

              {/* Minimalist Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                <span className="flex-shrink mx-4 text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Or access via Email</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
              </div>

              {/* Email & Password Authentication Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authError && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="leading-normal font-medium">{authError}</span>
                  </div>
                )}

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <Input 
                        type="email" 
                        required 
                        placeholder="clinician@example.com"
                        className="pl-10"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Password</label>
                      {authMode === 'signup' && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">Min. 6 chars</span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-550" />
                      <Input 
                        type="password" 
                        required 
                        placeholder="••••••••"
                        className="pl-10"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full py-5 text-sm font-bold bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-sm"
                >
                  {authLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{authMode === 'signin' ? 'Signing In...' : 'Registering...'}</span>
                    </div>
                  ) : (
                    <span>{authMode === 'signin' ? 'Sign In with Email' : 'Register Email Account'}</span>
                  )}
                </Button>
              </form>

              {/* Mode Toggle Link */}
              <div className="text-center">
                <button 
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                    setAuthError('');
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  {authMode === 'signin' ? "Don't have an account? Sign up here" : "Already have an email password account? Sign In"}
                </button>
              </div>

              {/* Troubleshooting Footer */}
              {!currentUser && firebaseUser && isAdmin && (
                <div className="flex flex-col gap-4 items-center justify-center pt-2 border-t border-gray-100 dark:border-gray-850/60">
                  <button 
                    onClick={() => {
                      if (window.confirm("Perform hard system reset? This will wipe all data and allow a fresh bootstrap.")) {
                         resetDatabase();
                      }
                    }}
                    className="text-[9px] text-red-400 hover:text-red-500 font-bold uppercase tracking-tighter opacity-50 hover:opacity-100 transition-opacity"
                  >
                    Troubleshooting: Force Factory Reset
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Beta Disclaimer & Copyright Footer */}
        <div className="mt-6 space-y-4">
          <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-900/20 rounded-xl">
            <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
              <span className="font-bold block text-xs mb-0.5">⚠️ Beta Notice</span>
              ABA SuperSync is currently in beta testing. Please ensure that all logs and session data entered into this platform are backed up and stored in another secure secondary location as well.
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              © {new Date().getFullYear()} ABA SuperSync. Created by{" "}
              <a 
                href="mailto:anvil.aba.official@gmail.com" 
                className="font-bold underline text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
              >
                anvilABA, LLC
              </a>
              . All rights reserved.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};


