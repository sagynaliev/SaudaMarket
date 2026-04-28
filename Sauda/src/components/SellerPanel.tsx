import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard, Badge } from './ui/Common';
import { Package, DollarSign, ShoppingBag, Plus, MoreVertical, Edit, Trash2, X, Upload, Save, AlertTriangle, ShieldCheck, Download, Printer } from 'lucide-react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ProductFactory } from '../lib/factories';
import { InvoiceModal } from './InvoiceModal';

interface SellerDashboardProps {
  activeTab?: string;
  onToast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function SellerDashboard({ activeTab = 'dashboard', onToast }: SellerDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<string | null>(null);

  const handleGenerateInvoice = async (orderId: string) => {
    setIsGeneratingInvoice(orderId);
    try {
      const invoice = await api.seller.generateInvoice(orderId);
      setCurrentInvoice(invoice);
      setIsInvoiceModalOpen(true);
      onToast?.('Invoice node synthesized successfully.', 'success');
    } catch (err: any) {
      onToast?.(err.message || 'Failed to spawn invoice document.', 'error');
    } finally {
      setIsGeneratingInvoice(null);
    }
  };

  const fetchSellerData = async () => {
    try {
      const res = await api.seller.getDashboard();
      setData(res);
      setProducts(Array.isArray(res?.products) ? res.products : []);
      setOrders(Array.isArray(res?.orders) ? res.orders : []);
    } catch (err) {
      console.error(err);
      onToast?.('Failed to fetch merchant data architecture.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerData();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(orderId);
    try {
      await api.seller.updateOrderStatus(orderId, newStatus);
      onToast?.(`Order status updated to ${newStatus}.`, 'success');
      await fetchSellerData();
    } catch (err: any) {
      onToast?.(err.message || 'Failed to update order status.', 'error');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: Number(formData.get('price')),
      stock: Number(formData.get('stock')),
      category: (formData.get('category') as string),
      categoryId: (formData.get('category') as string).toLowerCase(),
      weight: Number(formData.get('weight')) || 0,
      isDigital: formData.get('isDigital') === 'on',
      fileSize: formData.get('fileSize') || '0MB',
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

  const renderRevenue = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2" variant="dark">
          <h3 className="text-lg font-bold mb-6">Revenue Analytics History</h3>
          <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data?.revenueHistory || []}>
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
      </div>
    </div>
  );

  const renderInventory = () => (
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
                  {(() => {
                    const productInstance = ProductFactory.createProduct(p);
                    return (
                      <>
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
                          <div className="flex items-center gap-2 mt-1">
                             <p className="text-[10px] text-slate-500 uppercase font-mono">{p.categoryId || 'General'}</p>
                             <Badge variant="info" className="text-[7px] py-0 px-1 opacity-50">{productInstance.getType()}</Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-3">
                            <p className="text-sm font-mono text-emerald-400 font-bold">${p.price}</p>
                            <span className="text-[10px] text-slate-600 font-bold">QTY: {p.stock}</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
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
  );

  const renderOrders = () => (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Incoming Store Orders</h2>
          <Badge variant="info">{orders.length} Total Logs</Badge>
       </div>
       {orders.length === 0 ? (
         <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-3xl">
            <ShoppingBag size={40} className="mb-4 opacity-20" />
            <p>No customer orders detected yet.</p>
         </div>
       ) : (
         <div className="space-y-4">
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 text-slate-500 text-[10px] uppercase font-bold tracking-widest pb-2">
               <div className="col-span-4">Product Context</div>
               <div className="col-span-2">Buyer identity</div>
               <div className="col-span-1">Qty</div>
               <div className="col-span-2">Status</div>
               <div className="col-span-1">Value</div>
               <div className="col-span-2 text-right">Operations</div>
            </div>

            {orders.map(o => (
              <GlassCard key={o.id} variant="dark" className="p-0 border-white/5 hover:border-white/10 transition-colors overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center p-6">
                  {/* Product Info */}
                  <div className="col-span-1 lg:col-span-4 flex items-center gap-4">
                    <div className="relative w-12 h-12 bg-white/5 rounded-lg overflow-hidden shrink-0">
                      <img src={o.items?.[0]?.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                       <p className="text-sm font-bold truncate text-white">{o.items?.[0]?.name || 'Unknown Asset'}</p>
                       <p className="text-[10px] font-mono text-slate-500 uppercase">OrderID: #{o.id}</p>
                    </div>
                  </div>

                  {/* Buyer */}
                  <div className="col-span-1 lg:col-span-2 flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px] font-bold">
                        {o.buyerName?.charAt(0) || 'U'}
                     </div>
                     <p className="text-sm text-slate-400 font-medium">{o.buyerName || 'Anonymous'}</p>
                  </div>

                  {/* Qty */}
                  <div className="col-span-1 lg:col-span-1 text-sm font-mono text-slate-500">
                     x{o.items?.[0]?.quantity || 1}
                  </div>

                  {/* Status */}
                  <div className="col-span-1 lg:col-span-2">
                     <Badge 
                        variant={o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'error' : 'warning'}
                        className="text-[10px] py-0.5"
                     >
                        {o.status.toUpperCase()}
                     </Badge>
                     <p className="text-[9px] text-slate-600 font-mono mt-1">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>

                  {/* Amount */}
                  <div className="col-span-1 lg:col-span-1 font-bold text-emerald-400 text-sm">
                     ${o.totalAmount}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 lg:col-span-2 flex justify-end gap-2">
                     <button 
                        onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
                        className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
                     >
                        <MoreVertical size={16} />
                     </button>
                  </div>
                </div>

                {/* Expandable Action Panel */}
                <AnimatePresence>
                  {expandedOrderId === o.id && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="border-t border-white/5 bg-white/[0.02] overflow-hidden"
                    >
                      <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                         <div className="space-y-4 w-full md:w-auto">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Available Protocols</p>
                            <div className="flex flex-wrap gap-2">
                               <button 
                                  disabled={o.status === 'delivered' || o.status === 'cancelled' || isUpdatingStatus === o.id}
                                  onClick={() => handleUpdateStatus(o.id, 'processing')}
                                  className={cn(
                                     "px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border",
                                     o.status === 'processing' ? "bg-accent/20 border-accent text-accent" : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                                  )}
                               >
                                  Process Order
                               </button>
                               <button 
                                  disabled={o.status === 'delivered' || o.status === 'cancelled' || isUpdatingStatus === o.id}
                                  onClick={() => handleUpdateStatus(o.id, 'shipped')}
                                  className={cn(
                                     "px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border",
                                     o.status === 'shipped' ? "bg-indigo-500/20 border-indigo-500 text-indigo-400" : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                                  )}
                               >
                                  Mark Shipped
                               </button>
                               <button 
                                  disabled={o.status === 'delivered' || o.status === 'cancelled' || isUpdatingStatus === o.id}
                                  onClick={() => handleUpdateStatus(o.id, 'cancelled')}
                                  className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20"
                               >
                                  Abort Order
                               </button>
                            </div>
                         </div>

                         <div className="flex gap-3 w-full md:w-auto">
                            <button 
                               disabled={isGeneratingInvoice === o.id}
                               onClick={() => handleGenerateInvoice(o.id)}
                               className="flex-1 md:flex-none px-6 py-3 bg-white text-primary rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
                            >
                               {isGeneratingInvoice === o.id ? 'Generating...' : 'Generate Invoice'}
                            </button>
                         </div>
                      </div>
                      {isUpdatingStatus === o.id && (
                        <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] flex items-center justify-center">
                           <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            ))}
         </div>
       )}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent capitalize">
            {activeTab === 'dashboard' ? 'Revenue Command' : activeTab === 'inventory' ? 'Inventory Control' : 'Store Orders'}
          </h1>
          <p className="text-slate-400 mt-1">
             {activeTab === 'dashboard' ? 'Analyze your merchant performance and earnings.' : 
              activeTab === 'inventory' ? 'Manage your market assets and stock levels.' : 
              'Track incoming customer orders and logistics.'}
          </p>
        </div>
        {(activeTab === 'inventory' || activeTab === 'dashboard') && (
          <button 
            onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
            className="btn-primary flex items-center gap-2 px-6 py-3"
          >
            <Plus size={20} /> Add New Product
          </button>
        )}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'dashboard' ? renderRevenue() : 
         activeTab === 'inventory' ? renderInventory() : 
         activeTab === 'orders' ? renderOrders() : renderRevenue()}
      </div>

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
              className="relative w-full max-w-lg glass-card-dark p-8 border border-white/10 shadow-3xl overflow-y-auto max-h-[90vh] custom-scrollbar"
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
                      <select name="category" required defaultValue={editingProduct?.categoryId || editingProduct?.category || 'electronics'} className="input-glass appearance-none cursor-pointer">
                         <option value="electronics">Electronics</option>
                         <option value="fashion">Fashion</option>
                         <option value="furniture">Furniture</option>
                         <option value="beauty">Beauty</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-500 ml-1">Asset Value ($)</label>
                      <input name="price" type="number" step="0.01" required defaultValue={editingProduct?.price} className="input-glass" placeholder="299.99" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-500 ml-1">Physical Weight (kg)</label>
                      <input name="weight" type="number" step="0.1" defaultValue={editingProduct?.weight} className="input-glass" placeholder="1.5" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-500 ml-1">Is Digital Asset?</label>
                      <div className="flex items-center gap-4 h-12 px-4 bg-white/5 rounded-xl border border-white/10">
                         <input name="isDigital" type="checkbox" defaultChecked={editingProduct?.isDigital} className="w-4 h-4 accent-accent" />
                         <span className="text-xs text-slate-400">Software / Key / Download</span>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-slate-500 ml-1">Digital Size (e.g. 150MB)</label>
                      <input name="fileSize" defaultValue={editingProduct?.fileSize} className="input-glass" placeholder="50MB" />
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

      <InvoiceModal 
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={currentInvoice}
        onToast={onToast}
      />
    </div>
  );
}
