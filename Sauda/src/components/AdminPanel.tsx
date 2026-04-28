import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingCart, DollarSign, Package, Check, X, Shield, Globe, Bell, Mail } from 'lucide-react';
import { GlassCard, Badge } from './ui/Common';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ProductFactory } from '../lib/factories';

interface AdminDashboardProps {
  activeView?: 'dashboard' | 'approvals' | 'users' | 'settings';
  onToast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function AdminDashboard({ activeView = 'dashboard', onToast }: AdminDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.admin.getDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
      onToast?.('Failed to synchronize with central node.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [activeView]);

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      if (approve) await api.admin.approveProduct(id);
      else await api.admin.rejectProduct(id);
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const [broadcast, setBroadcast] = useState({ title: '', content: '' });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcast.title || !broadcast.content) return;
    setIsBroadcasting(true);
    try {
      await api.admin.broadcast(broadcast);
      setBroadcast({ title: '', content: '' });
      onToast?.('Broadcast transmission successful.', 'success');
    } catch (err) {
      console.error(err);
      onToast?.('Broadcast failure: System out of sync.', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
    </div>
  );

  const stats = [
    { label: 'Total Revenue', value: `${data?.totalRevenue?.toLocaleString() || '0'}`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Total Users', value: data?.totalUsers || 0, icon: Users, color: 'text-indigo-400' },
    { label: 'Total Products', value: (Array.isArray(data?.allProducts) ? data.allProducts.length : 0), icon: ShoppingCart, color: 'text-amber-400' },
    { label: 'Pending Approvals', value: data?.pendingApprovals || 0, icon: Package, color: 'text-rose-400' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent capitalize">
            {activeView === 'dashboard' ? 'Executive Command' : activeView === 'approvals' ? 'Product Protocol' : activeView === 'users' ? 'User Directory' : 'System Configuration'}
          </h1>
          <p className="text-slate-400 mt-1">
             {activeView === 'dashboard' ? 'Platform-wide performance monitoring.' : 
              activeView === 'approvals' ? 'Review and authorize market assets.' : 
              activeView === 'users' ? 'Manage platform citizenship and roles.' : 
              'Adjust platform-wide operational parameters.'}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'dashboard' && (
          <motion.div 
            key="overview" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="space-y-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <GlassCard key={stat.label} variant="dark" className="hover:border-accent/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <stat.icon size={24} className={stat.color} />
                    </div>
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
                  <h3 className="text-lg font-bold">Volume Analytics</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.revenueHistory || [
                      { name: 'Mon', revenue: 0 }, { name: 'Sun', revenue: 0 }
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
                  <h3 className="text-lg font-bold mb-6">Operations Health</h3>
                  <div className="space-y-6">
                     {[
                       { label: 'Database Status', status: 'Healthy', val: 'Active', color: 'bg-emerald-500' },
                       { label: 'API Protocols', status: 'Nominal', val: 'Online', color: 'bg-emerald-500' },
                       { label: 'Storage Cluster', status: 'Stable', val: 'Verified', color: 'bg-indigo-500' }
                     ].map(h => (
                       <div key={h.label} className="space-y-2">
                         <div className="flex justify-between text-xs mb-1">
                           <span className="text-slate-400">{h.label}</span>
                           <span className="text-white font-mono">{h.val}</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                             <div className={cn("h-full", h.color)} style={{width: '100%'}}></div>
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
          <motion.div 
            key="approvals" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
          >
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
                      {data.allProducts.filter((p: any) => !p.isApproved).map((p: any) => {
                        const productInstance = ProductFactory.createProduct(p);
                        return (
                          <tr key={p.id} className="bg-white/5 hover:bg-white/10 transition-colors group">
                            <td className="py-4 px-4 first:rounded-l-xl">
                              <div className="flex items-center gap-3">
                                <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                <div>
                                  <span className="font-medium text-slate-200 block">{p.name}</span>
                                  <Badge variant="info" className="text-[7px] py-0 px-1 opacity-50">{productInstance.getType()}</Badge>
                                </div>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {activeView === 'users' && (
          <motion.div 
            key="users" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
          >
            <GlassCard variant="dark">
              <h2 className="text-xl font-bold mb-6">User Directory</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.allUsers?.map((u: any) => (
                  <div key={u.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent font-bold">
                          {u.username.charAt(0)}
                       </div>
                       <div>
                         <p className="font-bold text-white">{u.username}</p>
                         <p className="text-xs text-slate-500">{u.email}</p>
                         <Badge variant="info" className="mt-2 text-[8px]">{u.role.toUpperCase()}</Badge>
                       </div>
                    </div>
                    {u.role !== 'admin' && (
                       <button 
                          onClick={async () => {
                             if(confirm(`Are you sure you want to delete user ${u.username}?`)) {
                                await api.admin.deleteUser(u.id);
                                fetchDashboard();
                             }
                          }}
                          className="p-3 bg-rose-500/10 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                          <X size={16} />
                       </button>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeView === 'settings' && (
          <motion.div 
            key="settings" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
          >
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
                      <button onClick={() => { onToast?.('Platform configuration updated.', 'success'); fetchDashboard(); }} className="btn-primary w-full py-4 mt-4">Save Configuration</button>
                   </div>
                </GlassCard>

                <GlassCard variant="dark" className="p-8">
                   <div className="flex items-center gap-3 mb-8">
                      <Bell className="text-amber-500" />
                      <h3 className="font-bold text-xl">System Broadcast</h3>
                   </div>
                   <div className="space-y-6">
                      <p className="text-sm text-slate-400">Send a global notification to all active users on the platform.</p>
                      <form onSubmit={handleBroadcast} className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Message Title</label>
                            <input 
                               type="text" 
                               className="input-glass" 
                               placeholder="e.g. Schedule Maintenance" 
                               value={broadcast.title}
                               onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Content Body</label>
                            <textarea 
                               className="input-glass min-h-[100px] py-4" 
                               placeholder="Type your broadcast here..."
                               value={broadcast.content}
                               onChange={(e) => setBroadcast({ ...broadcast, content: e.target.value })}
                            ></textarea>
                         </div>
                         <button 
                            type="submit" 
                            disabled={isBroadcasting}
                            className="btn-primary w-full py-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white disabled:opacity-50"
                         >
                            {isBroadcasting ? 'Broadcasting...' : 'Initialize Broadcast'}
                         </button>
                      </form>
                   </div>
                </GlassCard>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
