import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Shield, ChevronRight, AlertCircle, ShoppingBag } from 'lucide-react';
import { GlassCard, Badge } from './ui/Common';
import { api } from '../services/api';
import { cn } from '../lib/utils';

interface AuthProps {
  onLogin: (user: any) => void;
}

export function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [role, setRole] = useState<'customer' | 'seller' | 'admin'>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'customer'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (isForgot) {
        await api.auth.forgotPassword(formData.email);
        setSuccess('Reset sequence initiated. Check your encrypted mail.');
        setTimeout(() => setIsForgot(false), 3000);
      } else if (isLogin) {
        const res = await api.auth.login(formData.email, formData.password);
        onLogin(res.user);
      } else {
        const res = await api.auth.register({ ...formData, role });
        onLogin(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication sequence failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isForgot) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-6 relative overflow-hidden">
        <div className="w-full max-w-md relative z-10">
          <div className="flex flex-col items-center mb-10 text-center">
             <div className="w-20 h-20 rounded-[2.5rem] bg-white text-primary flex items-center justify-center mb-6 shadow-2xl">
                <Shield size={36} strokeWidth={2.5} />
             </div>
             <h1 className="text-4xl font-display font-bold text-white mb-2">Reset Sequence</h1>
             <p className="text-slate-500 text-sm">RECOVER ACCESS PROTOCOL</p>
          </div>
          <GlassCard variant="dark" className="p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Identity Vector (Email)</label>
                 <div className="relative group">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                   <input type="email" required placeholder="Email Address" className="input-glass pl-12 h-14" onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                 </div>
              </div>
              
              {error && <div className="p-4 rounded-xl bg-rose-500/10 text-rose-500 text-sm font-medium border border-rose-500/20">{error}</div>}
              {success && <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm font-medium border border-emerald-500/20">{success}</div>}

              <button type="submit" disabled={isLoading} className="btn-primary w-full h-16 py-0">
                {isLoading ? <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div> : 'INITIALIZE RECOVERY'}
              </button>
              <button type="button" onClick={() => setIsForgot(false)} className="w-full text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">Abort Sequence</button>
            </form>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Design */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600 filter blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
           <div className="w-20 h-20 rounded-[2.5rem] bg-white text-primary flex items-center justify-center mb-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
              <ShoppingBag size={36} strokeWidth={2.5} />
           </div>
           <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-white via-white to-slate-500 bg-clip-text text-transparent mb-2">Sauda</h1>
           <p className="text-slate-500 text-sm tracking-wider uppercase">Advanced Commerce Cluster v2.4</p>
        </div>

        <GlassCard variant="dark" className="p-8 md:p-10 border-white/5 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
          <div className="flex bg-white/5 p-1.5 rounded-2xl mb-10">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-3 rounded-xl transition-all font-bold text-sm tracking-wide",
                isLogin ? "bg-white text-primary shadow-xl" : "text-slate-400 hover:text-white"
              )}
            >LOGIN</button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-3 rounded-xl transition-all font-bold text-sm tracking-wide",
                !isLogin ? "bg-white text-primary shadow-xl" : "text-slate-400 hover:text-white"
              )}
            >REGISTER</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-4">
                 <div className="grid grid-cols-3 gap-2">
                    {['customer', 'seller', 'admin'].map((r) => (
                      <button 
                        key={r}
                        type="button" 
                        onClick={() => setRole(r as any)}
                        className={cn(
                          "py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                          role === r ? "bg-accent/20 border-accent text-accent" : "bg-white/5 border-transparent text-slate-500"
                        )}
                      >{r}</button>
                    ))}
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Legal Identity</label>
                   <div className="relative group">
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-white" size={18} />
                     <input 
                        type="text" 
                        required 
                        placeholder="Full Name"
                        className="input-glass pl-12 h-14"
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                     />
                   </div>
                 </div>
              </div>
            )}

            <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Access Protocol</label>
               <div className="relative group">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-white" size={18} />
                 <input 
                    type="email" 
                    required 
                    placeholder="Email Address"
                    className="input-glass pl-12 h-14"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                 />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Encrypted Phrase</label>
               <div className="relative group">
                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-white" size={18} />
                 <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    className="input-glass pl-12 h-14"
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                 />
               </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-500"
                >
                   <AlertCircle size={18} />
                   <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary w-full h-16 py-0 flex items-center justify-center gap-3 font-display relative group active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="text-lg font-bold tracking-wide">{isLogin ? 'INITIALIZE LOGIN' : 'ESTABLISH IDENTITY'}</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Shield size={14} className="text-emerald-500" />
                <span>Quantum encryption active</span>
             </div>
             {isLogin && (
                <button type="button" onClick={() => setIsForgot(true)} className="text-[10px] font-bold text-accent uppercase tracking-widest hover:text-white transition-colors">Forgot Sequence?</button>
             )}
          </div>
        </GlassCard>

        <p className="text-center mt-10 text-slate-500 text-xs flex items-center justify-center gap-4">
           <span>SYSTEM v2.4.9</span>
           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
           <span>UPTIME 99.99%</span>
        </p>
      </div>
    </div>
  );
}
