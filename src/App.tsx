import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar, TopNav } from './components/Navigation';
import { AdminDashboard } from './components/AdminPanel';
import { SellerDashboard } from './components/SellerPanel';
import { CustomerPortal } from './components/CustomerPortal';
import { Checkout } from './components/Checkout';
import { Auth } from './components/Auth';
import { Messages } from './components/Messages';
import { GlobalSearch } from './components/GlobalSearch';
import { UserRole, Product, CartItem, PaymentProvider } from './types';
import { api } from './services/api';
import { Badge } from './components/ui/Common';
import { X, CheckCircle, Info, AlertTriangle, ShoppingCart as CartIcon, Bell, User as UserIcon, Settings, ChevronLeft } from 'lucide-react';
import { cn } from './lib/utils';
import { CartStore } from './server/patterns/creational/cart_singleton';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

const cartStore = CartStore.getInstance();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null means checking
  const [role, setRole] = useState<UserRole>('customer');
  const [currentUser, setCurrentUser] = useState<{id: string, username: string, email: string} | null>(null);
  const [activeTab, setActiveTab] = useState('catalogue');
  const [collapsed, setCollapsed] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(cartStore.getItems());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileView, setProfileView] = useState<'info' | 'settings' | 'preferences'>('info');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [preferences, setPreferences] = useState({
    notifications: true,
    newsletter: false,
    darkMode: true
  });

  // Subscribe to Singleton CartStore
  useEffect(() => {
    const unsubscribe = cartStore.subscribe(() => {
      setCart(cartStore.getItems());
    });
    return () => unsubscribe();
  }, []);

  // PERSISTENCE: CHECK LOCALSTORAGE ON MOUNT
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('sauda_jwt');
      localStorage.removeItem('sauda_user');
      setIsAuthenticated(false);
      setCurrentUser(null);
      addToast('Session expired. Please re-authenticate.', 'warning');
    };

    window.addEventListener('sauda-unauthorized', handleUnauthorized);

    const storedUser = localStorage.getItem('sauda_user');
    const storedToken = localStorage.getItem('sauda_jwt');
    
    if (storedUser && storedToken) {
      const user = JSON.parse(storedUser);
      setIsAuthenticated(true);
      setRole(user.role);
      setCurrentUser(user);
      // Auto-navigation based on role
      if (user.role === 'admin' || user.role === 'seller') setActiveTab('dashboard');
      else setActiveTab('catalogue');
    } else {
      setIsAuthenticated(false);
    }

    return () => window.removeEventListener('sauda-unauthorized', handleUnauthorized);
  }, []);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
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
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const markNotificationRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) { console.error(err); }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      username: formData.get('username') as string,
      password: (formData.get('password') as string) || undefined
    };
    try {
      const response = await api.auth.updateProfile(data);
      const updatedUser = response.user;
      setCurrentUser(updatedUser);
      localStorage.setItem('sauda_user', JSON.stringify(updatedUser));
      addToast('Profile records synchronized', 'success');
      setProfileView('info');
    } catch (err) {
      addToast('Failed to update profile', 'warning');
    }
  };

  const handleLoginSuccess = (user: any) => {
    setRole(user.role);
    setIsAuthenticated(true);
    setCurrentUser(user);
    if (user.role === 'admin' || user.role === 'seller') setActiveTab('dashboard');
    else setActiveTab('catalogue');
    addToast(`Successfully authenticated as ${user.role.toUpperCase()}`, 'success');
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    cartStore.clear();
    addToast('Session terminated successfully', 'info');
  };

  const addToCart = (product: Product) => {
    cartStore.addItem({ ...product, quantity: 1 });
    addToast(`Added ${product.name} to cart`, 'success');
  };

  const handleCheckoutComplete = () => {
    addToast(`Payment successful. Order synchronized.`, 'success');
    setActiveTab('orders'); // Go to orders page after checkout
    cartStore.clear();
  };

  if (isAuthenticated === null) return (
     <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
     </div>
  );

  if (!isAuthenticated) return <Auth onLogin={handleLoginSuccess} />;

  return (
    <div className="min-h-screen flex bg-primary overflow-x-hidden">
      <Sidebar role={role} activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setCollapsed={setCollapsed} onLogout={handleLogout} />
      <main className={cn("flex-1 flex flex-col transition-all duration-500", collapsed ? "ml-20" : "ml-72")}>
        <TopNav username={currentUser?.username || 'User'} role={role} onProfileClick={() => setShowProfile(!showProfile)} onNotificationsClick={() => setShowNotifications(!showNotifications)} onSearch={setSearchTerm} hasUnreadNotifications={notifications.some(n => !n.read)} />
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
           <AnimatePresence mode="wait">
              {searchTerm.trim().length >= 2 ? (
                <div key="global-search">
                  <GlobalSearch 
                    query={searchTerm} 
                    onClose={() => setSearchTerm('')} 
                    onProductClick={(p) => {
                       setActiveTab('catalogue');
                       // We can't easily open the modal here without passing state down, 
                       // but at least we can navigate to catalogue.
                    }} 
                    onUserClick={(u) => {
                       if (role === 'admin') setActiveTab('users');
                       else addToast(`Interacting with user ${u.username}`, 'info');
                    }}
                  />
                </div>
              ) : (
                <>
                  {role === 'admin' && (activeTab === 'dashboard' || activeTab === 'settings' || activeTab === 'users' || activeTab === 'approvals') && (
                    <div key="admin-panel"><AdminDashboard activeView={activeTab as any} onToast={addToast} /></div>
                  )}
                  {role === 'seller' && (activeTab === 'dashboard' || activeTab === 'inventory' || activeTab === 'orders') && (
                    <div key="seller-dash"><SellerDashboard activeTab={activeTab as any} onToast={addToast} /></div>
                  )}
                  {role === 'customer' && (
                    <>
                      {activeTab === 'catalogue' && <div key="cat"><CustomerPortal onAddToCart={addToCart} searchTerm={searchTerm} onTabChange={setActiveTab} onToast={addToast} /></div>}
                      {activeTab === 'orders' && <div key="ord"><CustomerPortal activeTab="orders" searchTerm={searchTerm} onTabChange={setActiveTab} onToast={addToast} /></div>}
                      {activeTab === 'wishlist' && <div key="wish"><CustomerPortal activeTab="wishlist" searchTerm={searchTerm} onTabChange={setActiveTab} onToast={addToast} /></div>}
                      {activeTab === 'cart' && <div key="checkout"><Checkout items={cart} onComplete={handleCheckoutComplete} /></div>}
                    </>
                  )}
                  {activeTab === 'messages' && <div key="messages"><Messages /></div>}
                </>
              )}
           </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {showProfile && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProfile(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-full max-w-sm glass-card-dark z-[101] shadow-2xl p-8 border-l border-white/10">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3 font-display">
                  {profileView !== 'info' && <button onClick={() => setProfileView('info')} className="p-2 hover:bg-white/5 rounded-xl text-slate-500"><ChevronLeft size={20} /></button>}
                  <h2 className="text-2xl font-bold">{profileView === 'info' ? 'User Profile' : profileView === 'settings' ? 'Account Settings' : 'Preferences'}</h2>
                </div>
                <button onClick={() => { setShowProfile(false); setProfileView('info'); }} className="p-2 hover:bg-white/5 rounded-xl text-slate-500"><X /></button>
              </div>

              <AnimatePresence mode="wait">
                {profileView === 'info' && (
                  <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <div className="flex flex-col items-center mb-12">
                       <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent to-indigo-700 flex items-center justify-center text-4xl font-display font-bold text-white shadow-2xl mb-4 border-2 border-white/10">
                         {(currentUser?.username || 'U').charAt(0)}
                       </div>
                       <h3 className="text-xl font-bold">{currentUser?.username || 'User'}</h3>
                       <h4 className="text-xs font-mono text-slate-500 tracking-tighter uppercase mb-4">Node ID: {currentUser?.id}</h4>
                       <p className="text-slate-400 text-sm">{currentUser?.email || 'user@sauda.io'}</p>
                       <Badge variant="info" className="mt-4">{role.toUpperCase()} ACCOUNT</Badge>
                    </div>
                    <div className="space-y-4">
                      <button onClick={() => setProfileView('settings')} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                         <UserIcon size={20} className="text-slate-500 group-hover:text-accent" />
                         <span className="font-bold text-sm">Account Settings</span>
                      </button>
                      <button onClick={() => setProfileView('preferences')} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                         <Settings size={20} className="text-slate-500 group-hover:text-accent" />
                         <span className="font-bold text-sm">Preferences</span>
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
                      <button type="submit" className="btn-primary w-full py-4 mt-4">Save Changes</button>
                    </form>
                  </motion.div>
                )}

                {profileView === 'preferences' && (
                  <motion.div key="preferences" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-4">
                      {Object.entries(preferences).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                          <span className="text-sm font-bold capitalize">{key}</span>
                          <button 
                            onClick={() => setPreferences(prev => ({ ...prev, [key]: !val }))}
                            className={cn(
                              "w-12 h-6 rounded-full transition-colors relative",
                              val ? "bg-accent" : "bg-white/10"
                            )}
                          >
                            <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", val ? "left-7" : "left-1")} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => { addToast('Preferences saved'); setProfileView('info'); }} className="btn-primary w-full py-4">Confirm Settings</button>
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

      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNotifications(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-full max-w-sm glass-card-dark z-[101] shadow-2xl p-8 border-l border-white/10 overflow-y-auto">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold">Notifications</h2>
                  <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500"><X /></button>
               </div>
               <div className="space-y-4">
                  {notifications.length === 0 ? <p className="text-center text-slate-500 py-12">No alerts detected.</p> : notifications.map(notif => (
                    <div key={notif.id} onClick={() => markNotificationRead(notif.id)} className={cn("p-4 rounded-2xl border transition-all cursor-pointer", notif.read ? "bg-white/5 border-white/5 opacity-50" : "bg-white/10 border-accent/20")}>
                      <p className="font-bold text-sm">{notif.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{notif.message}</p>
                    </div>
                  ))}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {role === 'customer' && cart.length > 0 && activeTab !== 'cart' && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed right-8 bottom-8 z-50">
          <button onClick={() => setActiveTab('cart')} className="flex items-center gap-3 bg-white text-primary px-6 py-4 rounded-2xl font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all border-4 border-accent/20">
            <CartIcon size={20} />
            <span>Cart ({cart.length}) - ${cart.reduce((a, b) => a + (b.price * b.quantity), 0).toFixed(2)}</span>
          </button>
        </motion.div>
      )}

      <div className="fixed top-24 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div key={toast.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="pointer-events-auto min-w-64 glass-card-dark p-4 border border-white/10 flex items-start gap-4 shadow-2xl">
              {toast.type === 'success' ? <CheckCircle size={20} className="text-emerald-400" /> : <Info size={20} className="text-accent" />}
              <div className="flex-1">
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
