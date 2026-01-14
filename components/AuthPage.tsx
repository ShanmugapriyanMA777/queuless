
import React, { useState } from 'react';
import { ViewType } from '../types';
import { supabase } from '../lib/supabase';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<ViewType | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Login Flow
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        // Signup Flow
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              role: role,
            },
          },
        });
        if (signUpError) throw signUpError;
        
        // If email confirmation is enabled in Supabase, the session will be null
        if (data.user && data.session === null) {
          setShowSuccess(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="w-full max-w-sm text-center relative">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-orange-100 rounded-full blur-[80px] opacity-60"></div>
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-indigo-100 rounded-full blur-[80px] opacity-60"></div>
          
          <div className="relative mb-12 flex justify-center">
            <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl transform rotate-12 transition-transform hover:rotate-0 cursor-default">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/></svg>
            </div>
          </div>
          <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">QueueLess</h1>
          <p className="text-slate-500 font-bold text-lg mb-16 tracking-tight">Digital Bookings. Zero Waiting.</p>
          
          <div className="space-y-6">
            <button 
              onClick={() => setRole(ViewType.CUSTOMER)}
              className="w-full group bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] flex items-center gap-8 hover:border-orange-500 hover:bg-orange-50 transition-all duration-500 shadow-sm hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Customer</h3>
                <p className="text-sm font-bold text-slate-400">Join remote queues</p>
              </div>
            </button>

            <button 
              onClick={() => setRole(ViewType.ADMIN)}
              className="w-full group bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] flex items-center gap-8 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-500 shadow-sm hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Business</h3>
                <p className="text-sm font-bold text-slate-400">Manage your counter</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const themeHex = role === ViewType.CUSTOMER ? '#f97316' : '#6366f1';
  const themeColor = role === ViewType.CUSTOMER ? 'orange' : 'indigo';

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className={`w-24 h-24 bg-${themeColor}-100 text-${themeColor}-600 rounded-[2rem] flex items-center justify-center mb-8`}>
           <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Verify your email</h2>
        <p className="text-slate-500 font-bold text-lg mb-10 max-w-sm">We've sent a magic link to <span className="text-slate-900">{email}</span>. Click it to activate your account.</p>
        <button 
          onClick={() => { setShowSuccess(false); setIsLogin(true); }}
          className={`px-12 py-5 bg-${themeColor}-500 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-${themeColor}-500/20`}
        >
          BACK TO LOGIN
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col p-8 md:p-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="mb-16 flex items-center justify-between max-w-7xl mx-auto w-full">
        <button 
          onClick={() => { setRole(null); setError(null); }}
          className="w-14 h-14 border-2 border-slate-50 flex items-center justify-center rounded-2xl hover:bg-slate-50 transition-colors"
        >
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className={`text-[10px] font-black uppercase tracking-[0.4em] text-${themeColor}-500 bg-${themeColor}-50 px-8 py-3 rounded-full shadow-sm`}>
           {role} PORTAL
        </div>
      </header>

      <div className="flex-grow max-w-md w-full mx-auto flex flex-col justify-center pb-20">
        <h1 className="text-6xl font-black text-slate-900 mb-3 tracking-tighter">
          {isLogin ? 'Hello again' : 'Join QueueLess'}
        </h1>
        <p className="text-slate-400 font-bold text-xl mb-12">
          {isLogin ? `Access your ${role.toLowerCase()} dashboard.` : `Register as a new ${role.toLowerCase()} partner.`}
        </p>

        {error && (
          <div className="mb-8 p-6 bg-red-50 text-red-600 rounded-3xl text-sm font-bold border-2 border-red-100 flex items-center gap-4 animate-in shake duration-500">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Display Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-8 py-6 rounded-[2.5rem] border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-${themeColor}-500 outline-none transition-all font-bold text-xl placeholder:text-slate-300`}
                placeholder="QueueLess Partner"
              />
            </div>
          )}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-8 py-6 rounded-[2.5rem] border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-${themeColor}-500 outline-none transition-all font-bold text-xl placeholder:text-slate-300`}
              placeholder="name@email.com"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Secure Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-8 py-6 rounded-[2.5rem] border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-${themeColor}-500 outline-none transition-all font-bold text-xl placeholder:text-slate-300`}
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            style={{ backgroundColor: themeHex }}
            className={`w-full text-white py-7 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-${themeColor}-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-4 mt-8 disabled:opacity-50 disabled:cursor-wait`}
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                VERIFYING...
              </>
            ) : (
              <>
                {isLogin ? 'LOG IN' : 'GET STARTED'}
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-xs font-black text-slate-300 hover:text-slate-900 transition-colors uppercase tracking-[0.3em] group"
          >
            {isLogin ? (
              <>NO ACCOUNT? <span className={`text-${themeColor}-500 group-hover:underline`}>SIGN UP</span></>
            ) : (
              <>GOT AN ACCOUNT? <span className={`text-${themeColor}-500 group-hover:underline`}>LOG IN</span></>
            )}
          </button>
        </div>
      </div>

      <footer className="mt-auto text-center py-8">
        <p className="text-[10px] text-slate-200 font-black tracking-[0.6em] uppercase">QueueLess Technology • Secure Authentication</p>
      </footer>
    </div>
  );
};

export default AuthPage;
