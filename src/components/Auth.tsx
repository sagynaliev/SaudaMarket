import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard, Badge } from './ui/Common';
import { Lock, Mail, User, ArrowRight, Store, ShoppingBag, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { UserRole } from '../types';
import { cn } from '../lib/utils';
import { api } from '../services/api';

interface AuthProps {
  onLogin: (role: UserRole, email: string, username?: string) => void;
}

export function Auth({ onLogin }: AuthProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [role, setRole] = useState<UserRole>('customer');
  const [email, setEmail] = useState('user@sauda.io');
  const [password, setPassword] = useState('user123');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (view === 'login') {
        const data = await api.auth.login(email, password);
        onLogin(data.user.role, data.user.email, data.user.username);
      } else if (view === 'register') {
        const data = await api.auth.register({
          username: username || email.split('@')[0],
          email,
          password,
          role
        });
        onLogin(data.user.role, data.user.email, data.user.username);
      } else {
        const data = await api.auth.forgotPassword(email);
        setSuccess(data.message);
        setTimeout(() => setView('login'), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Operation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/30 blur-[120px] rounded-full"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black font-display uppercase tracking-[-0.05em] text-white">Sauda</h1>
          <p className="text-slate-400 mt-2 font-medium tracking-wide">Digital Commerce Infrastructure</p>
        </div>

        <GlassCard variant="dark" className="p-8 border-white/10 shadow-2xl overflow-hidden">
          {view !== 'forgot' && (
            <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/5">
              <button 
                onClick={() => { setView('login'); setError(null); }}
                className={cn(
                  "flex-1 py-3 text-sm font-bold rounded-xl transition-all uppercase tracking-widest",
                  view === 'login' ? "bg-accent text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >Login</button>
              <button 
                onClick={() => { setView('register'); setError(null); }}
                className={cn(
                  "flex-1 py-3 text-sm font-bold rounded-xl transition-all uppercase tracking-widest",
                  view === 'register' ? "bg-accent text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >Register</button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-3"
              >
                <AlertTriangle size={16} />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-3"
              >
                <CheckCircle size={16} />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {view === 'forgot' ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Email for Recovery</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input 
                      type="email" 
                      className="input-glass pl-12 py-4" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="btn-primary w-full py-4 font-bold uppercase tracking-widest">
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setView('login')}
                  className="w-full text-center text-xs text-slate-500 hover:text-accent font-bold"
                >
                  Back to Login
                </button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {view === 'register' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Account Role</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'customer', icon: ShoppingBag, label: 'Buyer' },
                          { id: 'seller', icon: Store, label: 'Seller' }
                        ].map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setRole(r.id as UserRole)}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border transition-all",
                              role === r.id ? "bg-accent/20 border-accent text-accent" : "bg-white/5 border-white/5 text-slate-500"
                            )}
                          >
                            <r.icon size={20} />
                            <span className="text-[10px] font-bold uppercase">{r.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Full Name</label>
                      <div className="relative">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input 
                          type="text" 
                          className="input-glass pl-12 py-4" 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Your Name"
                          required={view === 'register'} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input 
                      type="email" 
                      className="input-glass pl-12 py-4" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Security Key</label>
                    {view === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => setView('forgot')}
                        className="text-[11px] text-[#7171ff] hover:text-[#9494ff] hover:underline font-bold transition-colors"
                      >
                        Құпия сөзді ұмыттыңыз ба?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input 
                      type="password" 
                      className="input-glass pl-12 py-4" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <button 
                  disabled={isLoading}
                  className="btn-primary w-full py-5 flex items-center justify-center gap-3 group overflow-hidden relative shadow-2xl shadow-accent/20"
                >
                  <span className="font-bold uppercase tracking-widest text-sm">
                    {isLoading ? 'Processing...' : view === 'login' ? 'Initialize Session' : 'Create Global Account'}
                  </span>
                  {!isLoading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>
            )}
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
