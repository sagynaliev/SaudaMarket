/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar, TopNav } from './components/Navigation';
import { AdminDashboard } from './components/AdminPanel';
import { SellerDashboard, SellerOrders } from './components/SellerPanel';
import { CustomerPortal } from './components/CustomerPortal';
import { Checkout } from './components/Checkout';
import { Auth } from './components/Auth';
import { UserRole, Product, CartItem, PaymentProvider } from './types';
import { api } from './services/api';
import { Badge, GlassCard } from './components/ui/Common';
import { X, CheckCircle, Info, AlertTriangle, ShoppingCart as CartIcon, Bell, User as UserIcon, Settings, ChevronLeft } from 'lucide-react';
import { cn } from './lib/utils';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole>('customer');
  const [currentUser, setCurrentUser] = useState<{username: string, email: string} | null>(null);
  const [activeTab, setActiveTab] = useState('catalogue');
  const [collapsed, setCollapsed] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileView, setProfileView] = useState<'info' | 'settings' | 'preferences'>('info');
  const [notifications, setNotifications] = useState<any[]>([]);

  // Observer Pattern Simulation: Toasts
  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.notifications.list().catch(() => []);
      setNotifications(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Polling for demo
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const markNotificationRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      username: formData.get('username') as string,
      password: (formData.get('password') as string) || undefined
    };
    try {
      await api.auth.updateProfile(data);
      setCurrentUser(prev => prev ? { ...prev, username: data.username } : null);
      addToast('Profile records synchronized', 'success');
      setProfileView('info');
    } catch (err) {
      addToast('Failed to update profile', 'warning');
    }
  };

  const handleLogin = (selectedRole: UserRole, email: string, username?: string) => {
    setRole(selectedRole);
    setIsAuthenticated(true);
    setCurrentUser({ username: username || email.split('@')[0], email });
    // Role based entry point
    if (selectedRole === 'admin') setActiveTab('dashboard');
    else if (selectedRole === 'seller') setActiveTab('dashboard');
    else setActiveTab('catalogue');
    
    addToast(`Successfully authenticated as ${selectedRole.toUpperCase()}`, 'success');
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCart([]);
      addToast('Session terminated successfully', 'info');
    } catch (err) {
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    addToast(`Added ${product.name} to cart`, 'success');
  };

  const handleCheckoutComplete = (method: PaymentProvider) => {
    addToast(`Payment processed via ${method.toUpperCase()} — order confirmed!`, 'success');
    setActiveTab('orders');
    setCart([]);
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex bg-primary overflow-x-hidden">
      <Sidebar 
        role={role} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onLogout={handleLogout}
      />

      <main className={cn(
        "flex-1 flex flex-col transition-all duration-500",
        collapsed ? "ml-20" : "ml-72"
      )}>
        <TopNav 
          username={currentUser?.username || 'User'} 
          role={role} 
          onProfileClick={() => setShowProfile(!showProfile)} 
          onNotificationsClick={() => setShowNotifications(!showNotifications)}
          onSearch={setSearchTerm}
          hasUnreadNotifications={Array.isArray(notifications) && notifications.some(n => !n.read)}
        />
        
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
           <AnimatePresence mode="wait">
              {role === 'admin' && (activeTab === 'dashboard' || activeTab === 'users' || activeTab === 'approvals' || activeTab === 'settings') && (
                <div key={`admin-${activeTab}`}><AdminDashboard activeTab={activeTab} /></div>
              )}
              {role === 'seller' && (activeTab === 'dashboard' || activeTab === 'inventory') && (
                <div key={`seller-${activeTab}`}><SellerDashboard activeTab={activeTab} /></div>
              )}
              {role === 'seller' && activeTab === 'orders' && (
                <div key="seller-orders"><SellerOrders /></div>
              )}
              {role === 'customer' && activeTab === 'catalogue' && <div key="customer-cat"><CustomerPortal onAddToCart={addToCart} searchTerm={searchTerm} /></div>}
              {role === 'customer' && activeTab === 'orders' && <div key="customer-ord"><CustomerPortal onAddToCart={addToCart} activeTab="orders" searchTerm={searchTerm} /></div>}
              {role === 'customer' && activeTab === 'wishlist' && <div key="customer-wish"><CustomerPortal onAddToCart={addToCart} activeTab="wishlist" searchTerm={searchTerm} /></div>}
              {role === 'customer' && activeTab === 'cart' && (
                <div key="checkout"><Checkout items={cart} onComplete={handleCheckoutComplete} /></div>
              )}
           </AnimatePresence>
        </div>
      </main>

      {/* Profile Backdrop Modal */}
      <AnimatePresence>
        {showProfile && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowProfile(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm glass-card-dark z-[101] shadow-2xl p-8 border-l border-white/10"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                  {profileView !== 'info' && (
                    <button onClick={() => setProfileView('info')} className="p-2 hover:bg-white/5 rounded-xl text-slate-500">
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  <h2 className="text-2xl font-bold font-display">
                    {profileView === 'info' ? 'User Profile' : 
                     profileView === 'settings' ? 'Account Settings' : 'Preferences'}
                  </h2>
                </div>
                <button onClick={() => { setShowProfile(false); setProfileView('info'); }} className="p-2 hover:bg-white/5 rounded-xl text-slate-500"><X /></button>
              </div>

              <AnimatePresence mode="wait">
                {profileView === 'info' && (
                  <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <div className="flex flex-col items-center text-center mb-12">
                       <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent to-indigo-700 flex items-center justify-center text-4xl font-display font-bold text-white shadow-2xl shadow-accent/20 mb-4 border-2 border-white/10 relative">
                         {(currentUser?.username || 'U').charAt(0)}
                         <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-xl border-4 border-[#0F172A]">
                            <CheckCircle size={16} className="text-white" />
                         </div>
                       </div>
                       <h3 className="text-xl font-bold">{currentUser?.username || 'User'}</h3>
                       <p className="text-slate-400 text-sm mt-1">{currentUser?.email || 'user@sauda.io'}</p>
                       <Badge variant="info" className="mt-4">{role.toUpperCase()} ACCOUNT</Badge>
                    </div>

                    <div className="space-y-4">
                      <button 
                        onClick={() => setProfileView('settings')}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                      >
                         <UserIcon size={20} className="text-slate-500 group-hover:text-accent" />
                         <div className="text-left">
                           <p className="font-bold text-sm">Account Settings</p>
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest">Security and PII</p>
                         </div>
                      </button>
                      <button 
                         onClick={() => setProfileView('preferences')}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                      >
                         <Settings size={20} className="text-slate-500 group-hover:text-accent" />
                         <div className="text-left">
                           <p className="font-bold text-sm">Preferences</p>
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest">Interface and Region</p>
                         </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {profileView === 'settings' && (
                  <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Public Identifier</label>
                        <input name="username" defaultValue={currentUser?.username} required className="input-glass" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Security Phrase (New)</label>
                         <input name="password" type="password" placeholder="Leave blank to keep current" className="input-glass" />
                      </div>
                      <button type="submit" className="btn-primary w-full py-4 mt-4">Synchronize Security</button>
                    </form>
                  </motion.div>
                )}

                {profileView === 'preferences' && (
                  <motion.div key="preferences" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Language</label>
                        <select className="input-glass appearance-none cursor-pointer">
                           <option>Kazakh (KZ)</option>
                           <option>English (US)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Display Currency</label>
                        <select className="input-glass appearance-none cursor-pointer">
                           <option>USD ($)</option>
                           <option>KZT (₸)</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute bottom-8 left-8 right-8">
                 <button onClick={handleLogout} className="btn-primary w-full py-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white">Sign Out</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notifications Backdrop Modal */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm glass-card-dark z-[101] shadow-2xl p-8 border-l border-white/10"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold font-display">Alerts</h2>
                <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500"><X /></button>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500 opacity-20">
                     <Bell size={40} className="mb-4" />
                     <p>Silence remains.</p>
                  </div>
                ) : notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => markNotificationRead(notif.id)}
                    className={cn(
                      "p-4 rounded-2xl border flex gap-4 transition-all group cursor-pointer",
                      notif.read ? "bg-white/20 border-white/5 opacity-60" : "bg-white/10 border-accent/20 hover:bg-white/20"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-xl bg-white/5 self-start group-hover:scale-110 transition-transform",
                      notif.type === 'order' ? 'text-emerald-400' : notif.type === 'auth' ? 'text-amber-400' : 'text-accent'
                    )}>
                      {notif.type === 'order' ? <CheckCircle size={18} /> : notif.type === 'auth' ? <AlertTriangle size={18} /> : <Info size={18} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-white">{notif.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{notif.message}</p>
                      <p className="text-[10px] text-slate-600 uppercase font-mono mt-2">{new Date(notif.createdAt).toLocaleTimeString()}</p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 bg-accent rounded-full shrink-0 animate-pulse mt-2" />}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Quick View */}
      {role === 'customer' && cart.length > 0 && activeTab !== 'cart' && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-8 bottom-8 z-50"
        >
          <button 
            onClick={() => setActiveTab('cart')}
            className="flex items-center gap-3 bg-white text-primary px-6 py-4 rounded-2xl font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all border-4 border-accent/20"
          >
            <CartIcon size={20} />
            <span>View Cart ({cart.length})</span>
            <div className="h-4 w-[1px] bg-primary/20"></div>
            <span>${cart.reduce((a, b) => a + (b.price * b.quantity), 0).toFixed(2)}</span>
          </button>
        </motion.div>
      )}

      {/* Toast Notification Container */}
      <div className="fixed top-24 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              className="pointer-events-auto"
            >
              <div className={cn(
                "min-w-64 glass-card-dark p-4 border border-white/10 flex items-start gap-4 shadow-2xl",
                toast.type === 'success' && "border-emerald-500/20",
                toast.type === 'warning' && "border-amber-500/20"
              )}>
                {toast.type === 'success' ? <CheckCircle size={20} className="text-emerald-400 shrink-0 mt-0.5" /> : 
                 toast.type === 'warning' ? <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" /> :
                 <Info size={20} className="text-accent shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-100">{toast.message}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-mono">System event</p>
                </div>
                <button 
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="p-1 hover:bg-white/5 rounded-lg text-slate-600 hover:text-slate-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

