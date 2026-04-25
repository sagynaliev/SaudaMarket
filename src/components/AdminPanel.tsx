import { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingCart, DollarSign, Package, Check, X, Shield, Globe, Bell, Mail } from 'lucide-react';
import { GlassCard, Badge } from './ui/Common';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function AdminDashboard({ activeTab: sidebarTab }: { activeTab?: string }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'approvals' | 'users' | 'settings'>('overview');

  // Sync internal view when sidebar tab changes
  useEffect(() => {
    if (sidebarTab === 'users') setActiveView('users');
    else if (sidebarTab === 'approvals') setActiveView('approvals');
    else if (sidebarTab === 'settings') setActiveView('settings');
    else setActiveView('overview');
  }, [sidebarTab]);

  const fetchDashboard = async () => {
    try {
      const res = await api.admin.getDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      if (approve) await api.admin.approveProduct(id);
      else await api.admin.rejectProduct(id);
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
    </div>
  );

  const stats = [
    { label: 'Total Revenue', value: `$${data?.totalRevenue?.toLocaleString() || '0'}`, icon: DollarSign, trend: '+12.5%', color: 'text-emerald-400' },
    { label: 'Total Users', value: data?.totalUsers || 0, icon: Users, trend: '+3.2%', color: 'text-indigo-400' },
    { label: 'Total Products', value: (Array.isArray(data?.allProducts) ? data.allProducts.length : 0), icon: ShoppingCart, trend: '+8.1%', color: 'text-amber-400' },
    { label: 'Pending Approvals', value: data?.pendingApprovals || 0, icon: Package, trend: '-2.4%', color: 'text-rose-400' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Executive Overview
          </h1>
          <p className="text-slate-400 mt-1">Platform-wide performance and system health.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
           {['overview', 'approvals', 'users', 'settings'].map(v => (
             <button 
               key={v}
               onClick={() => setActiveView(v as any)}
               className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeView === v ? 'bg-accent text-white' : 'text-slate-500 hover:text-slate-300'}`}
             >
               {v}
             </button>
           ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <GlassCard key={stat.label} variant="dark" className="hover:border-accent/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <stat.icon size={24} className={stat.color} />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                      {stat.trend}
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-slate-400 text-sm font-medium">{stat.label}</h3>
                    <p className="text-2xl font-display font-bold text-white mt-1">{stat.value}</p>
                  </div>
                </GlassCard>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GlassCard className="lg:col-span-2 min-h-[400px]" variant="dark">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold">Revenue Growth</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: 'Mon', revenue: 4000 }, { name: 'Tue', revenue: 3000 }, { name: 'Wed', revenue: 9800 },
                      { name: 'Thu', revenue: 3908 }, { name: 'Fri', revenue: 4800 }, { name: 'Sat', revenue: 3800 }, { name: 'Sun', revenue: 4300 }
                    ]}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff14', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#6366F1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard variant="dark">
                  <h3 className="text-lg font-bold mb-6">System Health</h3>
                  <div className="space-y-6">
                     {[
                       { label: 'Database Nodes', status: 'Healthy', val: '100%', color: 'bg-emerald-500' },
                       { label: 'API Latency', status: 'Nominal', val: '84ms', color: 'bg-emerald-500' },
                       { label: 'Storage Usage', status: 'Stable', val: '42%', color: 'bg-indigo-500' }
                     ].map(h => (
                       <div key={h.label} className="space-y-2">
                         <div className="flex justify-between text-xs mb-1">
                           <span className="text-slate-400">{h.label}</span>
                           <span className="text-white font-mono">{h.val}</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className={cn("h-full", h.color)} style={{width: h.val.includes('%') ? h.val : '100%'}}></div>
                         </div>
                       </div>
                     ))}
                  </div>
                  
                  <div className="mt-12 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <p className="text-xs text-orange-400 font-medium uppercase tracking-widest mb-1">Security Status</p>
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-orange-400" />
                      <span className="text-sm text-slate-200">2 Factor Auth Required</span>
                    </div>
                  </div>
              </GlassCard>
            </div>
          </motion.div>
        )}

         {activeView === 'approvals' && (
          <motion.div key="approvals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlassCard variant="dark">
              <h2 className="text-xl font-bold mb-6">Product Review Queue</h2>
              {(!Array.isArray(data?.allProducts) || data.allProducts.filter((p: any) => !p.isApproved).length === 0) ? (
                <div className="p-12 text-center text-slate-500">No products pending approval.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-4">
                    <thead>
                      <tr className="text-slate-500 text-[10px] uppercase tracking-widest">
                        <th className="pb-4 px-4 font-mono font-bold">Product</th>
                        <th className="pb-4 px-4 font-mono font-bold">Seller</th>
                        <th className="pb-4 px-4 font-mono font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.allProducts.filter((p: any) => !p.isApproved).map((p: any) => (
                        <tr key={p.id} className="bg-white/5 hover:bg-white/10 transition-colors group">
                          <td className="py-4 px-4 first:rounded-l-xl">
                            <div className="flex items-center gap-3">
                              <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                              <span className="font-medium text-slate-200">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-400 text-sm">Seller ID: {p.sellerId}</td>
                          <td className="py-4 px-4 text-right last:rounded-r-xl">
                            <div className="flex justify-end gap-2">
                               <button onClick={() => handleApprove(p.id, true)} className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors">
                                  <Check size={18} />
                               </button>
                               <button onClick={() => handleApprove(p.id, false)} className="p-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-lg transition-colors">
                                  <X size={18} />
                               </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {activeView === 'users' && (
          <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <GlassCard variant="dark">
              <h2 className="text-xl font-bold mb-6">User Directory</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.allUsers?.map((u: any) => (
                  <div key={u.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent font-bold">
                       {u.username.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white">{u.username}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                      <Badge variant="info" className="mt-2">{u.role.toUpperCase()}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeView === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GlassCard variant="dark" className="p-8">
                   <div className="flex items-center gap-3 mb-8">
                      <Globe className="text-accent" />
                      <h3 className="font-bold text-xl">Platform Config</h3>
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Service Name</label>
                         <input type="text" className="input-glass" defaultValue="Sauda Engine" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-mono uppercase tracking-widest text-slate-500">System Domain</label>
                         <input type="text" className="input-glass" defaultValue="api.sauda.io" />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                         <div>
                            <p className="text-sm font-bold text-white">Maintenance Mode</p>
                            <p className="text-[10px] text-slate-500">Offline for all users except admins</p>
                         </div>
                         <div className="w-10 h-6 bg-slate-800 rounded-full p-1 cursor-pointer">
                            <div className="w-4 h-4 bg-slate-400 rounded-full"></div>
                         </div>
                      </div>
                      <button className="btn-primary w-full py-4 mt-4">Save Configuration</button>
                   </div>
                </GlassCard>

                <GlassCard variant="dark" className="p-8">
                   <div className="flex items-center gap-3 mb-8">
                      <Bell className="text-amber-500" />
                      <h3 className="font-bold text-xl">System Broadcast</h3>
                   </div>
                   <div className="space-y-6">
                      <p className="text-sm text-slate-400">Send a global notification to all active users on the platform.</p>
                      <div className="space-y-2">
                         <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Message Title</label>
                         <input type="text" className="input-glass" placeholder="e.g. Schedule Maintenance" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Content Body</label>
                         <textarea className="input-glass min-h-[100px] py-4" placeholder="Type your broadcast here..."></textarea>
                      </div>
                      <button className="btn-primary w-full py-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white">
                         Initialize Broadcast
                      </button>
                   </div>
                </GlassCard>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
