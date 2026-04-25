import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Star, Filter, Heart, ChevronRight, Check, Package, Truck, Clock, MapPin, X, ChevronLeft, Send, Search, DollarSign, Trash2 } from 'lucide-react';
import { GlassCard, Badge } from './ui/Common';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Order } from '../types';
import { cn } from '../lib/utils';

interface CustomerPortalProps {
  onAddToCart?: (p: Product) => void;
  activeTab?: string;
  searchTerm?: string;
}

export function CustomerPortal({ onAddToCart, activeTab = 'catalogue', searchTerm = '' }: CustomerPortalProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceRange, setPriceRange] = useState<number>(5000);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  const categories = ['All', 'Electronics', 'Fashion', 'Furniture', 'Beauty'];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, orderRes, wishRes] = await Promise.all([
        api.products.list().catch(() => []),
        api.orders.list().catch(() => []),
        api.wishlist.list().catch(() => [])
      ]);
      setProducts(Array.isArray(prodRes) ? prodRes.filter((p: any) => p?.isApproved) : []);
      setOrders(Array.isArray(orderRes) ? orderRes : []);
      setWishlist(Array.isArray(wishRes) ? wishRes : []);
    } catch (err) {
      console.error(err);
      setProducts([]);
      setOrders([]);
      setWishlist([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    let result = products;
    
    if (selectedCategory !== 'All') {
      const cat = selectedCategory.toLowerCase();
      result = result.filter(p =>
        (p.categoryId || '').toLowerCase() === cat ||
        (p.category || '').toLowerCase() === cat
      );
    }

    result = result.filter(p => p.price <= priceRange);
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.description.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [selectedCategory, searchTerm, products, priceRange]);

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    if (!searchTerm) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(o => 
      o.id.toLowerCase().includes(term) || 
      o.status.toLowerCase().includes(term)
    );
  }, [searchTerm, orders]);

  const toggleWishlist = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const currentWishlist = Array.isArray(wishlist) ? wishlist : [];
      const isActive = currentWishlist.includes(id);
      await api.wishlist.toggle(id, isActive);
      setWishlist(prev => {
        const p = Array.isArray(prev) ? prev : [];
        return isActive ? p.filter(i => i !== id) : [...p, id];
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await api.products.addReview(selectedProduct.id, newReview);
      setNewReview({ rating: 5, comment: '' });
      // Refresh selected product
      const updated = await api.products.get(selectedProduct.id);
      setSelectedProduct(updated);
      fetchData(); // Refresh list too
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
    </div>
  );

  const renderCatalogue = () => (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-64 space-y-8">
        <div>
          <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
            <Filter size={18} className="text-accent" /> Categories
          </h3>
          <div className="space-y-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "w-full text-left px-4 py-2.5 rounded-xl transition-all",
                  selectedCategory === cat 
                    ? 'bg-accent/10 text-accent font-medium' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
            <DollarSign size={18} className="text-accent" /> Price Filter
          </h3>
          <div className="px-2">
            <input 
              type="range" 
              min="0" 
              max="5000" 
              step="100"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-accent h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer" 
            />
            <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-500">
              <span>$0</span>
              <span className="text-accent font-bold">${priceRange}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Product Grid */}
      <div className="flex-1">
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <Search size={48} className="mb-4 opacity-20" />
            <p>No products found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setSelectedProduct(product)}
                  className="cursor-pointer"
                >
                  <GlassCard variant="dark" className="p-0 border-white/5 hover:border-white/20 transition-all group overflow-hidden h-full flex flex-col shadow-xl">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                         <button 
                           onClick={(e) => toggleWishlist(product.id, e)}
                           className={cn(
                             "p-2.5 rounded-xl backdrop-blur-md transition-all shadow-xl",
                             wishlist && Array.isArray(wishlist) && wishlist.includes(product.id) ? 'bg-rose-500 text-white scale-110' : 'bg-black/40 text-white hover:bg-black/60 hover:scale-110'
                           )}
                         >
                           <Heart size={16} fill={wishlist && Array.isArray(wishlist) && wishlist.includes(product.id) ? "currentColor" : "none"} />
                         </button>
                      </div>
                      <div className="absolute bottom-4 left-4">
                         <Badge variant="success">${product.price}</Badge>
                      </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex text-amber-400">
                          <Star size={12} fill="currentColor" className="text-amber-400" />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">4.8 (24)</span>
                        <Badge variant="info" className="ml-auto text-[8px]">{product.category || product.categoryId || 'general'}</Badge>
                      </div>
                      <h3 className="font-bold text-lg text-slate-100 mb-1 group-hover:text-accent transition-colors">{product.name}</h3>
                      <p className="text-slate-400 text-xs line-clamp-2 mb-6 font-medium">{product.description}</p>
                      
                      <div className="mt-auto">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onAddToCart?.(product); }}
                          className="w-full py-3 bg-white/5 hover:bg-accent hover:text-white rounded-xl border border-white/5 transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                        >
                          <ShoppingCart size={18} className="transition-transform group-hover/btn:-rotate-12" />
                          <span className="font-medium">Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );

  const renderWishlist = () => {
    const wishItems = (Array.isArray(products) && Array.isArray(wishlist)) ? products.filter(p => wishlist.includes(p.id)) : [];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
             <Heart className="text-rose-500" fill="currentColor" /> My Favorites
          </h2>
          <Badge variant="info">{wishItems.length} Saved Items</Badge>
        </div>
        {wishItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-3xl">
            <Heart size={48} className="mb-4 opacity-20" />
            <p>Your wishlist is empty. Start exploring!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {wishItems.map(p => (
                <GlassCard key={p.id} variant="dark" className="p-4 border-white/5 relative group">
                   <img src={p.imageUrl} alt="" className="w-full aspect-square object-cover rounded-xl mb-4" />
                   <h3 className="font-bold text-white truncate">{p.name}</h3>
                   <p className="text-emerald-400 font-mono font-bold mt-1">${p.price}</p>
                   <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-3">
                      <button onClick={() => onAddToCart?.(p)} className="p-3 bg-accent text-white rounded-xl"><ShoppingCart size={18}/></button>
                      <button onClick={() => toggleWishlist(p.id)} className="p-3 bg-rose-500/20 text-rose-500 rounded-xl"><Trash2 size={18}/></button>
                   </div>
                </GlassCard>
             ))}
          </div>
        )}
      </div>
    );
  };

  const renderOrders = () => (
    <div className="grid gap-6">
      <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
             <Package className="text-accent" /> Order History
          </h2>
      </div>
      {filteredOrders.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-3xl">
          <Package size={48} className="mb-4 opacity-20" />
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        filteredOrders.map((order) => (
          <GlassCard key={order.id} variant="dark" className="p-6 border-white/5 relative overflow-hidden group hover:border-accent/30 transition-all shadow-xl">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                       <Package size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Order #{order.id}</h3>
                      <p className="text-xs text-slate-500 font-mono">Timestamp: {new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge variant={
                    order.status === 'delivered' ? 'success' : 
                    order.status === 'cancelled' ? 'error' : 
                    order.status === 'pending' ? 'warning' : 'info'
                  }>
                    {order.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Value</p>
                    <p className="text-xl font-display font-bold text-emerald-400">${order.totalAmount?.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Method</p>
                    <p className="text-sm font-medium text-slate-100 capitalize">{order.paymentMethod}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Items</p>
                     <p className="text-sm font-medium text-slate-100">{order.items?.length || 0} Assets</p>
                  </div>
                </div>
              </div>

              {/* Status Tracker */}
              <div className="w-full md:w-80 bg-white/5 rounded-3xl p-6 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-20"><Truck size={40} className="rotate-12" /></div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                   Logistics Manifest
                </h4>
                <div className="space-y-6 relative">
                  <div className="absolute left-2.5 top-0 bottom-0 w-px bg-white/10 ml-[2px]"></div>
                  
                  {[
                    { step: 'System Received', time: 'T+0s', status: 'completed', icon: Clock },
                    { step: 'Warehouse Processing', time: 'T+1hr', status: order.status !== 'pending' ? 'completed' : 'active', icon: Check },
                    { step: 'Logistics Deployment', time: order.status === 'delivered' ? 'Completed' : 'Pending', status: order.status === 'delivered' ? 'completed' : 'pending', icon: Truck },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-4 relative z-10">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                        s.status === 'completed' ? "bg-accent text-white shadow-lg shadow-accent/40" : 
                        s.status === 'active' ? "bg-accent/20 text-accent animate-pulse border border-accent/40" :
                        "bg-slate-800 text-slate-600 border border-white/10"
                      )}>
                        <s.icon size={12} />
                      </div>
                      <div>
                        <p className={cn("text-xs font-bold", s.status !== 'pending' ? "text-slate-100" : "text-slate-500")}>
                          {s.step}
                        </p>
                        <p className="text-[10px] text-slate-600 font-mono">{s.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto pb-20">
      {/* Hero Section */}
      {activeTab === 'catalogue' && !searchTerm && (
        <GlassCard className="relative h-[350px] flex items-center p-12 overflow-hidden bg-gradient-to-br from-indigo-900/50 via-slate-900 to-emerald-900/20 border-white/5 group shadow-2xl">
          <div className="relative z-10 max-w-xl">
            <Badge variant="info" className="mb-4">Ecosystem Active</Badge>
            <h1 className="text-4xl md:text-6xl font-bold font-display leading-tight text-white mb-6">
              The Future of <br /> <span className="text-accent underline decoration-accent/20 underline-offset-8">Global Commerce</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-md">Experience sub-second procurement and military-grade security in the modern marketplace.</p>
            <button onClick={() => setSelectedCategory('Electronics')} className="btn-primary mt-10 px-10 py-5 shadow-2xl shadow-accent/20">Explore Infrastructure</button>
          </div>
          <div className="absolute right-[-10%] top-[-10%] w-2/3 h-2/3 bg-accent/20 blur-[120px] rounded-full group-hover:bg-accent/30 transition-all duration-1000"></div>
          <div className="absolute bottom-12 right-12 opacity-20 group-hover:opacity-40 transition-opacity">
            <ShoppingCart size={200} className="rotate-12" />
          </div>
        </GlassCard>
      )}

      {/* Main Content */}
      <div className="min-h-[400px]">
        {activeTab === 'catalogue' ? renderCatalogue() : 
         activeTab === 'orders' ? renderOrders() : 
         activeTab === 'wishlist' ? renderWishlist() : renderCatalogue()}
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setSelectedProduct(null)}
               className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 40 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 40 }}
               className="relative w-full max-w-6xl glass-card-dark overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-white/10 shadow-3xl max-h-[90vh]"
            >
               <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 z-20 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"><X /></button>
               
               <div className="relative aspect-square lg:aspect-auto overflow-hidden bg-slate-900 flex items-center justify-center">
                  <img src={selectedProduct.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute bottom-8 left-8 flex gap-3">
                     <Badge variant="success" className="text-xl px-6 py-2 shadow-2xl">${selectedProduct.price}</Badge>
                     <Badge variant="info" className="text-lg px-4 py-2 opacity-80">{(selectedProduct.category || selectedProduct.categoryId || 'product').toUpperCase()}</Badge>
                  </div>
               </div>

               <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col">
                  <div className="mb-10">
                    <h2 className="text-4xl font-bold text-white mb-4 leading-tight">{selectedProduct.name}</h2>
                    <div className="flex items-center gap-6 text-slate-500 font-mono text-sm">
                       <div className="flex items-center gap-2">
                          <Check className="text-emerald-500" size={16} /> 100% Verified Merchant
                       </div>
                       <div className="flex items-center gap-2">
                          <Package className="text-indigo-500" size={16} /> Fast Dispatch
                       </div>
                    </div>
                  </div>

                  <div className="space-y-8 mb-12">
                     <p className="text-slate-400 text-lg leading-relaxed">{selectedProduct.description}</p>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                           <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Available Stock</p>
                           <p className="text-2xl font-bold text-white">{selectedProduct.stock} Units</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                           <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Platform Rating</p>
                           <div className="flex items-center gap-2 text-2xl font-bold text-amber-400">
                             <Star fill="currentColor" size={24} /> 4.8
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6 mt-auto">
                     <div className="flex gap-4">
                        <button 
                           onClick={() => { onAddToCart?.(selectedProduct); setSelectedProduct(null); }}
                           className="flex-1 btn-primary py-5 rounded-3xl text-lg flex items-center justify-center gap-3 shadow-2xl shadow-accent/20"
                        >
                           <ShoppingCart size={24} /> Acquire Asset
                        </button>
                        <button 
                           onClick={() => toggleWishlist(selectedProduct.id)}
                           className={cn(
                             "p-5 rounded-3xl border transition-all",
                             Array.isArray(wishlist) && wishlist.includes(selectedProduct.id) ? "bg-rose-500 border-rose-500 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                           )}
                        >
                           <Heart size={24} fill={Array.isArray(wishlist) && wishlist.includes(selectedProduct.id) ? "currentColor" : "none"} />
                        </button>
                     </div>

                     {/* Reviews Section */}
                     <div className="pt-10 border-t border-white/10">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                           <Star className="text-amber-400" size={20} /> Merchant Feedback
                        </h3>
                        
                        <div className="space-y-6 mb-10">
                           {(selectedProduct as any).reviews?.length > 0 ? (selectedProduct as any).reviews.map((r: any) => (
                             <div key={r.id} className="p-5 rounded-2xl bg-white/5 border border-white/5">
                               <div className="flex justify-between mb-2">
                                 <p className="font-bold text-sm text-slate-200">@{r.username}</p>
                                 <div className="flex text-amber-500 gap-0.5">
                                   {[...Array(r.rating)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                                 </div>
                               </div>
                               <p className="text-xs text-slate-400 italic">"{r.comment}"</p>
                             </div>
                           )) : (
                             <p className="text-xs text-slate-600 text-center py-4">No manifest feedback available for this asset.</p>
                           )}
                        </div>

                        {/* Add Review Form */}
                        <form onSubmit={handleAddReview} className="space-y-4">
                           <div className="flex items-center gap-3 mb-2">
                              {[1,2,3,4,5].map(v => (
                                <button 
                                  key={v} type="button" 
                                  onClick={() => setNewReview(prev => ({...prev, rating: v}))}
                                  className={cn("p-2 rounded-lg transition-all", newReview.rating >= v ? "text-amber-400 bg-amber-400/10" : "text-slate-600 bg-white/5")}
                                >
                                  <Star size={18} fill={newReview.rating >= v ? "currentColor" : "none"} />
                                </button>
                              ))}
                           </div>
                           <div className="flex gap-3">
                              <input 
                                value={newReview.comment}
                                onChange={(e) => setNewReview(prev => ({...prev, comment: e.target.value}))}
                                placeholder="Submit protocol feedback..." 
                                className="flex-1 input-glass" 
                                required
                              />
                              <button type="submit" className="p-4 bg-accent text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20">
                                 <Send size={18} />
                              </button>
                           </div>
                        </form>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
