import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard, Badge } from './ui/Common';
import { Package, DollarSign, ShoppingBag, Plus, MoreVertical, Edit, Trash2, X, Upload, Save, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function SellerDashboard({ activeTab: sidebarTab }: { activeTab?: string }) {
  const [data, setData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const showInventory = sidebarTab === 'inventory';

  const fetchSellerData = async () => {
    try {
      const res = await api.seller.getDashboard();
      setData(res);
      setProducts(Array.isArray(res?.products) ? res.products : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerData();
  }, []);

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: Number(formData.get('price')),
      stock: Number(formData.get('stock')),
      categoryId: formData.get('category'),
      imageUrl: formData.get('imageUrl') || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800'
    };

    try {
      if (editingProduct) {
        await api.seller.updateProduct(editingProduct.id, productData);
      } else {
        await api.seller.addProduct(productData);
      }
      setShowProductModal(false);
      setEditingProduct(null);
      fetchSellerData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.seller.deleteProduct(id);
      fetchSellerData();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {showInventory ? 'Inventory Control' : 'Marketplace Command'}
          </h1>
          <p className="text-slate-400 mt-1">
            {showInventory ? 'Manage your product listings and stock levels.' : 'Manage your merchant inventory and analyze performance.'}
          </p>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
          className="btn-primary flex items-center gap-2 px-6 py-3"
        >
          <Plus size={20} /> Add New Product
        </button>
      </div>

      {!showInventory && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2" variant="dark">
          <h3 className="text-lg font-bold mb-6">Revenue Analytics</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Jan', revenue: 4000 }, { name: 'Feb', revenue: 3000 }, { name: 'Mar', revenue: 2000 },
                { name: 'Apr', revenue: 2780 }, { name: 'May', revenue: 1890 }, { name: 'Jun', revenue: 2390 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#ffffff0a'}}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff14', borderRadius: '12px' }}
                />
                <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <div className="space-y-6">
           <GlassCard variant="dark">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <DollarSign size={24} />
                </div>
                <div>
                   <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Total Earnings</p>
                   <p className="text-2xl font-display font-bold">${data?.revenue?.toLocaleString() || '0'}</p>
                </div>
              </div>
           </GlassCard>
           <GlassCard variant="dark">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <ShoppingBag size={24} />
                </div>
                <div>
                   <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Active Orders</p>
                   <p className="text-2xl font-display font-bold">{data?.recentOrdersCount || '0'}</p>
                </div>
              </div>
           </GlassCard>
        </div>
      </div>}

      <GlassCard variant="dark">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Inventory Control</h2>
            <div className="flex gap-2 text-[10px] font-mono">
               <Badge variant="success">Approved: {Array.isArray(products) ? products.filter(p => p.isApproved).length : 0}</Badge>
               <Badge variant="warning">Pending: {Array.isArray(products) ? products.filter(p => !p.isApproved).length : 0}</Badge>
            </div>
         </div>

         {(!Array.isArray(products) || products.length === 0) ? (
           <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-3xl">
              <Package size={40} className="mb-4 opacity-20" />
              <p className="text-sm">No products in inventory yet.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map(p => (
                <div key={p.id} className="group relative p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-accent/40 transition-all">
                  <div className="flex gap-4">
                    <div className="relative w-20 h-20 shrink-0">
                      <img src={p.imageUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                      {!p.isApproved && (
                        <div className="absolute inset-0 bg-yellow-500/20 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                          <AlertTriangle size={16} className="text-yellow-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold truncate pr-6 text-white">{p.name}</h4>
                        <div className="absolute top-4 right-4">
                          <Badge variant={p.isApproved ? 'success' : 'warning'} className="text-[8px] px-1.5 py-0.5">
                            {p.isApproved ? 'V' : '!'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">{p.categoryId || 'General'}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <p className="text-sm font-mono text-emerald-400 font-bold">${p.price}</p>
                        <span className="text-[10px] text-slate-600 font-bold">QTY: {p.stock}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-3">
                     <button 
                       onClick={() => { setEditingProduct(p); setShowProductModal(true); }}
                       className="flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-xl font-bold text-sm hover:scale-105 transition-transform"
                     >
                        <Edit size={16} /> Edit
                     </button>
                     <button 
                       onClick={() => handleDelete(p.id)}
                       className="p-2 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/40 transition-colors"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
                </div>
              ))}
           </div>
         )}
      </GlassCard>

      {/* Product Management Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowProductModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg glass-card-dark p-8 border border-white/10 shadow-3xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold font-display">
                  {editingProduct ? 'Update Inventory Item' : 'New Market Asset'}
                </h3>
                <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors"><X /></button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-500 ml-1">Universal Item Name</label>
                      <input name="name" required defaultValue={editingProduct?.name} className="input-glass" placeholder="e.g. Sauda Smart Watch" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-500 ml-1">Category Code</label>
                      <input name="category" required defaultValue={editingProduct?.categoryId || editingProduct?.category} className="input-glass" placeholder="electronics" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-500 ml-1">Asset Value ($)</label>
                      <input name="price" type="number" step="0.01" required defaultValue={editingProduct?.price} className="input-glass" placeholder="299.99" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-500 ml-1">Stock Quantifier</label>
                      <input name="stock" type="number" required defaultValue={editingProduct?.stock} className="input-glass" placeholder="50" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-500 ml-1">Visual ID (Image URL)</label>
                      <input name="imageUrl" defaultValue={editingProduct?.imageUrl} className="input-glass" placeholder="https://..." />
                   </div>
                   <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-500 ml-1">Product Manifest (Description)</label>
                      <textarea name="description" required defaultValue={editingProduct?.description} className="input-glass min-h-[100px] py-4" placeholder="Describe your product specs..."></textarea>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-4 text-sm font-bold text-slate-500 hover:text-white transition-colors">Discard</button>
                   <button type="submit" className="flex-[2] btn-primary py-4 flex items-center justify-center gap-2">
                      <Save size={18} />
                      {editingProduct ? 'Commit Changes' : 'Publish to Market'}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SellerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.seller.getOrders();
        setOrders(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error(err);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Store Orders</h1>
        <p className="text-slate-400 mt-1">All orders placed for your products.</p>
      </div>
      <GlassCard variant="dark">
        {orders.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-3xl">
            <ShoppingBag size={40} className="mb-4 opacity-20" />
            <p className="text-sm">No orders have been placed yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="text-slate-500 text-[10px] uppercase tracking-widest">
                  <th className="pb-4 px-4 font-mono font-bold">Order ID</th>
                  <th className="pb-4 px-4 font-mono font-bold">Items</th>
                  <th className="pb-4 px-4 font-mono font-bold">Total</th>
                  <th className="pb-4 px-4 font-mono font-bold">Method</th>
                  <th className="pb-4 px-4 font-mono font-bold">Status</th>
                  <th className="pb-4 px-4 font-mono font-bold">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} className="bg-white/5 hover:bg-white/10 transition-colors">
                    <td className="py-4 px-4 first:rounded-l-xl font-mono text-sm text-accent">#{o.id}</td>
                    <td className="py-4 px-4 text-slate-300 text-sm">{o.items?.length || 0} item(s)</td>
                    <td className="py-4 px-4 text-emerald-400 font-mono font-bold">${o.totalAmount?.toFixed(2)}</td>
                    <td className="py-4 px-4 text-slate-400 text-sm capitalize">{o.paymentMethod}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                        o.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                        o.status === 'cancelled' ? 'bg-rose-500/20 text-rose-400' :
                        o.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-indigo-500/20 text-indigo-400'
                      }`}>{o.status}</span>
                    </td>
                    <td className="py-4 px-4 last:rounded-r-xl text-slate-500 text-xs font-mono">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
