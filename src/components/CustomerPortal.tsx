import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Heart, Search, Filter, Star, Info, ChevronRight, Grid, List as ListIcon, Zap, Shield, Package, FileText, Printer, Download } from 'lucide-react';
import { GlassCard, Badge } from './ui/Common';
import { Product } from '../types';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { SpecsModal } from './SpecsModal';
import { InvoiceModal } from './InvoiceModal';

interface CustomerPortalProps {
  onAddToCart?: (product: Product) => void;
  searchTerm?: string;
  onTabChange?: (tab: string) => void;
  onToast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  activeTab?: 'catalogue' | 'orders' | 'wishlist';
}

export function CustomerPortal({ onAddToCart, searchTerm = '', onTabChange, onToast, activeTab: initialTab = 'catalogue' }: CustomerPortalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [specsProduct, setSpecsProduct] = useState<Product | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);

  const fetchInvoice = async (orderId: string) => {
    setIsInvoiceLoading(true);
    try {
      const invoice = await api.orders.getInvoice(orderId);
      setCurrentInvoice(invoice);
      onToast?.('Invoice node synthesized successfully.', 'success');
    } catch (err: any) {
      onToast?.(err.message || 'Failed to spawn invoice document.', 'error');
    } finally {
      setIsInvoiceLoading(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pRes, oRes, wRes] = await Promise.all([
        api.products.list(),
        api.orders.list(),
        api.wishlist.list()
      ]);
      setProducts(Array.isArray(pRes) ? pRes : []);
      setOrders(Array.isArray(oRes) ? oRes : []);
      setWishlist(Array.isArray(wRes) ? wRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      const cat = p.category || (p as any).categoryId || 'General';
      cats.add(cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase());
    });
    return ['All', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const pName = p.name?.toLowerCase() || '';
      const pDesc = p.description?.toLowerCase() || '';
      const pCat = (p.category || (p as any).categoryId || 'general').toLowerCase();
      
      const matchesSearch = pName.includes(searchTerm.toLowerCase()) || pDesc.includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || pCat === selectedCategory.toLowerCase();
      
      return matchesSearch && matchesCategory && p.isApproved;
    });
  }, [products, searchTerm, selectedCategory]);

  const toggleWishlist = async (pid: string) => {
    const isActive = wishlist.includes(pid);
    try {
      await api.wishlist.toggle(pid, isActive);
      setWishlist(prev => isActive ? prev.filter(id => id !== pid) : [...prev, pid]);
    } catch (err) { console.error(err); }
  };

  if (isLoading) return (
    <div className="h-96 flex items-center justify-center">
       <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
             <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Market Cluster</h1>
             <p className="text-slate-400 mt-1">Acquire validated assets from certified vendors.</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
             <button onClick={() => setViewMode('grid')} className={cn("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-white text-primary shadow-xl" : "text-slate-500 hover:text-white")}>
                <Grid size={20} />
             </button>
             <button onClick={() => setViewMode('list')} className={cn("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-white text-primary shadow-xl" : "text-slate-500 hover:text-white")}>
                <ListIcon size={20} />
             </button>
          </div>
       </div>

       {/* Category Scroll */}
       <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {categories.map(cat => (
             <button 
                key={cat}
                onClick={() => setSelectedCategory(cat.toLowerCase())}
                className={cn(
                  "px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
                  selectedCategory === cat.toLowerCase() ? "bg-accent border-accent text-white shadow-lg shadow-accent/20" : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                )}
             >{cat}</button>
          ))}
       </div>

       {initialTab === 'catalogue' && (
         <div className={cn(
           "grid gap-8",
           viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
         )}>
            <AnimatePresence mode="popLayout">
               {filteredProducts.map((p, idx) => (
                 <motion.div
                   key={p.id}
                   layout
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   transition={{ delay: idx * 0.05 }}
                 >
                    <ProductCard 
                      product={p} 
                      viewMode={viewMode}
                      isWishlisted={wishlist.includes(p.id)}
                      onToggleWishlist={() => toggleWishlist(p.id)}
                      onAddToCart={() => onAddToCart?.(p)}
                      onViewSpecs={() => setSpecsProduct(p)}
                    />
                 </motion.div>
               ))}
            </AnimatePresence>
         </div>
       )}

       {initialTab === 'orders' && (
         <div className="space-y-6">
            {orders.length === 0 ? (
               <div className="p-20 text-center glass-card-dark rounded-3xl">
                  <Package size={48} className="mx-auto mb-4 text-slate-700" />
                  <p className="text-slate-500">No transaction logs found in database.</p>
               </div>
            ) : orders.map(order => (
               <GlassCard key={order.id} variant="dark" className="p-8">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <Badge variant={order.status === 'delivered' ? 'success' : 'info'}>{order.status.toUpperCase()}</Badge>
                           <span className="text-sm font-mono text-slate-500 tracking-tighter">ORD-{order.id.padStart(6, '0')}</span>
                        </div>
                        <h4 className="text-xl font-bold font-display">${order.totalAmount.toFixed(2)} Total</h4>
                        <p className="text-xs text-slate-400">Order logged on {new Date(order.createdAt).toLocaleDateString()}</p>
                     </div>
                     <div className="flex-1 flex flex-wrap gap-4 items-center">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="p-2 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                             <div className="text-[10px] font-bold text-accent px-2 py-1 bg-accent/10 rounded-lg">{item.quantity}x</div>
                             <span className="text-xs font-medium text-slate-300">{item.name}</span>
                          </div>
                        ))}
                     </div>
                     <div className="flex gap-4 self-center">
                        <button 
                           onClick={() => fetchInvoice(order.id)}
                           disabled={isInvoiceLoading}
                           className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                        >
                           <FileText size={16} className="text-accent" />
                           View Receipt
                        </button>
                     </div>
                  </div>
               </GlassCard>
            ))}
         </div>
       )}

       {initialTab === 'wishlist' && (
         <div className={cn("grid gap-8", products.filter(p => wishlist.includes(p.id)).length > 0 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1")}>
            {products.filter(p => wishlist.includes(p.id)).length === 0 ? (<div className="p-20 text-center glass-card-dark rounded-3xl col-span-full"><Heart size={48} className="mx-auto mb-4 text-slate-700" /><p className="text-slate-500">Your wishlist is currently empty.</p></div>) : products.filter(p => wishlist.includes(p.id)).map(p => (
               <ProductCard 
                  key={p.id}
                  product={p}
                  isWishlisted={true}
                  onToggleWishlist={() => toggleWishlist(p.id)}
                  onAddToCart={() => onAddToCart?.(p)}
                  onViewSpecs={() => setSpecsProduct(p)}
               />
            ))}
         </div>
       )}

       <SpecsModal 
          isOpen={!!specsProduct}
          onClose={() => setSpecsProduct(null)}
          product={specsProduct}
       />

       <InvoiceModal 
          isOpen={!!currentInvoice}
          onClose={() => setCurrentInvoice(null)}
          invoice={currentInvoice}
          onToast={onToast}
       />
    </div>
  );
}

function ProductCard({ product, onAddToCart, isWishlisted, onToggleWishlist, onViewSpecs, viewMode = 'grid' }: any) {
  return (
    <GlassCard variant="dark" className={cn(
       "group relative flex flex-col h-full hover:border-accent/40 transition-all duration-500",
       viewMode === 'list' ? "md:flex-row gap-8 items-center" : ""
    )}>
       <div className={cn(
         "relative overflow-hidden rounded-2xl",
         viewMode === 'list' ? "w-full md:w-64 h-48" : "w-full aspect-square"
       )}>
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="absolute top-4 right-4 flex flex-col gap-2">
             <button 
                onClick={onToggleWishlist}
                className={cn(
                  "p-2.5 rounded-xl backdrop-blur-md transition-all shadow-xl",
                  isWishlisted ? "bg-rose-500 text-white" : "bg-black/20 text-white hover:bg-white hover:text-primary"
                )}
             >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
             </button>
             <button 
                onClick={onViewSpecs}
                className="p-2.5 rounded-xl backdrop-blur-md bg-black/20 text-white hover:bg-accent transition-all shadow-xl"
                title="View Technical Specs"
             >
                <Info size={18} />
             </button>
          </div>
       </div>

       <div className="flex-1 py-6 flex flex-col">
          <div className="flex justify-between items-start mb-2">
             <Badge variant="info" className="text-[9px] py-0 px-2 tracking-widest">{product.category?.toUpperCase() || 'GENERAL'}</Badge>
             <div className="flex items-center gap-1 text-amber-500">
                <Star size={12} fill="currentColor" />
                <span className="text-[10px] font-bold">{product.rating || (4.5 + Math.random()).toFixed(1)}</span>
             </div>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{product.name}</h3>
          <p className="text-slate-500 text-sm mb-6 line-clamp-2">{product.description}</p>
          
          <div className="mt-auto flex items-center justify-between gap-4">
             <div className="flex flex-col">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Asset Price</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-2xl font-display font-bold text-white">${product.price}</span>
                   <span className="text-xs text-slate-500">USD</span>
                </div>
                <button 
                  onClick={onViewSpecs} 
                  className="text-[10px] text-accent hover:underline flex items-center gap-1 mt-1 font-bold uppercase"
                >
                  View Details <ChevronRight size={10} />
                </button>
             </div>
             <button 
                onClick={onAddToCart}
                className="p-4 rounded-2xl bg-white text-primary hover:bg-accent hover:text-white transition-all shadow-xl hover:shadow-accent/40 active:scale-95 transition-colors"
                title="Add to Cart"
             >
                <ShoppingCart size={20} />
             </button>
          </div>
       </div>
    </GlassCard>
  );
}

