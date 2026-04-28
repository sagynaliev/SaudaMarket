import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Heart, Search, Filter, Star, Info, ChevronRight, Grid, List as ListIcon, Zap, Shield, Package, FileText, Printer, Download, Undo2, Layers, RotateCcw, ArrowUpDown, Trash2 } from 'lucide-react';
import { GlassCard, Badge } from './ui/Common';
import { Product } from '../types';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { SpecsModal } from './SpecsModal';
import { InvoiceModal } from './InvoiceModal';
import { OrderTracking } from './OrderTracking';
import { ProductCompare } from './ProductCompare';
import { ReviewModal } from './ReviewModal';
import { APP_CONFIG } from '../constants';
import { CommandHistory, AddToCartCommand } from '../server/patterns/behavioral/cart_command';
import { ProductComponent, BaseProduct, NewArrivalDecorator, SaleDecorator, TrendingDecorator, OutOfStockDecorator } from '../server/patterns/structural/product_decorator';
import { ReviewSubject, SellerReviewNotifier, AdminAuditLogger, RatingAggregator } from '../server/patterns/behavioral/review_observer';
import { WishlistSubject, WishlistPriceNotifier } from '../server/patterns/behavioral/wishlist_observer';

interface CustomerPortalProps {
  onAddToCart?: (product: Product) => void;
  searchTerm?: string;
  onTabChange?: (tab: string) => void;
  onToast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  activeTab?: 'catalogue' | 'orders' | 'wishlist';
}

// Global pattern instances
const commandHistory = new CommandHistory();
const wishlistSubject = new WishlistSubject();

export function CustomerPortal({ onAddToCart, searchTerm = '', onTabChange, onToast, activeTab = 'catalogue' }: CustomerPortalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating' | 'newest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [specsProduct, setSpecsProduct] = useState<Product | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);

  // Review System
  const [reviewProduct, setReviewProduct] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Compare pattern state
  const [compareItems, setCompareItems] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Initialize Price Notifier
  useEffect(() => {
    if (onToast) {
      const notifier = new WishlistPriceNotifier(onToast);
      wishlistSubject.attach(notifier);
      return () => wishlistSubject.detach(notifier);
    }
  }, [onToast]);

  const handleUndo = () => {
    const cmd = commandHistory.undo();
    if (cmd) {
      onToast?.(`Undone: ${cmd.description}`, 'info');
    } else {
      onToast?.("Nothing to undo in current session.", "warning");
    }
  };

  const wrapAddToCart = (product: Product) => {
    // Command Pattern
    const cmd = new AddToCartCommand(product);
    commandHistory.execute(cmd);
    onToast?.(`Synthesized 1x ${product.name} to cart manifest.`, 'success');
  };

  const toggleCompare = (product: Product) => {
    setCompareItems(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.filter(i => i.id !== product.id);
      if (prev.length >= 3) {
        onToast?.("Max 3 assets for comparative analysis.", "warning");
        return prev;
      }
      return [...prev, product];
    });
    setIsCompareOpen(true);
  };

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
      const productList = Array.isArray(pRes) ? pRes : [];
      const wishlistList = Array.isArray(wRes) ? wRes : [];
      
      setProducts(productList);
      setOrders(Array.isArray(oRes) ? oRes : []);
      setWishlist(wishlistList);

      // Price tracking sync
      // First sync to detect changes against last known state
      wishlistSubject.sync(productList);
      // Then update trackers with current manifest
      wishlistSubject.setWishlist(wishlistList, productList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Improved: Poll for updates to simulate real-time price changes
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, APP_CONFIG.PRICE_UPDATE_INTERVAL || 30000); // Default to 30s
    return () => clearInterval(interval);
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      const cat = p.category || (p as any).categoryId || 'General';
      cats.add(cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase());
    });
    return ['All', ...Array.from(cats)].sort();
  }, [products]);

  // Robust Filtering & Sorting Pipeline
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const pName = p.name?.toLowerCase() || '';
      const pDesc = p.description?.toLowerCase() || '';
      const pCat = (p.category || (p as any).categoryId || 'general').toLowerCase();
      
      const matchesSearch = pName.includes(searchTerm.toLowerCase()) || pDesc.includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || pCat === selectedCategory.toLowerCase();
      
      return matchesSearch && matchesCategory && p.isApproved;
    });

    // Strategy Pattern for Sorting (Simplified)
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'newest': return b.id.localeCompare(a.id); // Assuming IDs are sequential or timestamp-based
        default: return 0;
      }
    });

    return result;
  }, [products, searchTerm, selectedCategory, sortBy]);

  const toggleWishlist = async (pid: string) => {
    const isActive = wishlist.includes(pid);
    try {
      if (isActive) {
        await api.wishlist.toggle(pid, true);
        setWishlist(prev => prev.filter(id => id !== pid));
      } else {
        await api.wishlist.toggle(pid, false);
        setWishlist(prev => [...prev, pid]);
        
        // Add to price tracker
        const prod = products.find(p => p.id === pid);
        if (prod) wishlistSubject.setWishlist([...wishlist, pid], products);
      }
    } catch (err) { console.error(err); }
  };

  const handleWishlistToCart = (product: Product) => {
    wrapAddToCart(product);
    // Remove from wishlist after moving to cart
    toggleWishlist(product.id);
    onToast?.(`Moved ${product.name} to active procurement manifest.`, 'info');
  };

  if (isLoading) return (
    <div className="h-96 flex items-center justify-center">
       <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
       {/* Header with improved layout for responsiveness */}
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-1">
             <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{APP_CONFIG.NAME} Marketplace</h1>
             <p className="text-slate-400">Acquire validated assets from certified vendors.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={handleUndo} 
                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
              >
                 <RotateCcw size={14} /> Undo Action
              </button>
              
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                 <ArrowUpDown size={14} className="text-slate-500" />
                 <select 
                   value={sortBy}
                   onChange={(e: any) => setSortBy(e.target.value)}
                   className="bg-transparent text-[10px] uppercase font-bold text-slate-400 focus:outline-none cursor-pointer"
                 >
                    <option value="newest" className="bg-primary text-white">Newest Assets</option>
                    <option value="price-asc" className="bg-primary text-white">Price: Low to High</option>
                    <option value="price-desc" className="bg-primary text-white">Price: High to Low</option>
                    <option value="rating" className="bg-primary text-white">Top Rated</option>
                 </select>
              </div>

              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                 <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-xl transition-all", viewMode === 'grid' ? "bg-white text-primary shadow-xl" : "text-slate-500 hover:text-white")}>
                    <Grid size={18} />
                 </button>
                 <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-xl transition-all", viewMode === 'list' ? "bg-white text-primary shadow-xl" : "text-slate-500 hover:text-white")}>
                    <ListIcon size={18} />
                 </button>
              </div>
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

       {activeTab === 'catalogue' && (
         <div className={cn(
           "grid gap-8",
           viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
         )}>
            <AnimatePresence mode="popLayout">
               {filteredProducts.length > 0 ? filteredProducts.map((p, idx) => (
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
                      onAddToCart={() => wrapAddToCart(p)}
                      onViewSpecs={() => setSpecsProduct(p)}
                      isComparing={compareItems.some(i => i.id === p.id)}
                      onCompare={() => toggleCompare(p)}
                    />
                 </motion.div>
               )) : (
                 <div className="col-span-full py-20 text-center glass-card-dark rounded-3xl">
                    <Search size={48} className="mx-auto mb-4 text-slate-700" />
                    <p className="text-slate-500">No assets detected matching current search parameters.</p>
                    <button onClick={() => { setSelectedCategory('all'); setSortBy('newest'); }} className="mt-4 text-accent font-bold text-xs uppercase hover:underline">Reset Filters</button>
                 </div>
               )}
            </AnimatePresence>
         </div>
       )}

       {activeTab === 'orders' && (
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
                           <Badge variant={order.status === 'delivered' ? 'success' : 'info'}>{order.status?.toUpperCase()}</Badge>
                           <span className="text-sm font-mono text-slate-500 tracking-tighter">ORD-{order.id.padStart(6, '0')}</span>
                        </div>
                        <h4 className="text-xl font-bold font-display">${order.totalAmount?.toFixed(2)} Total</h4>
                        <p className="text-xs text-slate-400">Order logged on {new Date(order.createdAt).toLocaleDateString()}</p>
                        <div className="pt-4 mt-4 border-t border-white/5">
                           <OrderTracking currentStatus={order.status as any} />
                        </div>
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
                        {order.status === 'delivered' && (
                           <button 
                              onClick={() => {
                                 const p = products.find(prod => prod.id === order.items?.[0]?.id);
                                 if (p) {
                                    setReviewProduct(p);
                                    setIsReviewModalOpen(true);
                                 } else {
                                    onToast?.("Product details not synchronized.", "error");
                                 }
                              }}
                              className="flex items-center gap-2 px-6 py-3 bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded-2xl text-xs font-bold uppercase tracking-widest text-accent transition-all"
                           >
                              <Star size={16} />
                              Leave Review
                           </button>
                        )}
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

       {activeTab === 'wishlist' && (
         <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/5">
               <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                     <Heart size={20} className="text-rose-500 fill-rose-500" />
                     Wishlist Manifest
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                     {products.filter(p => wishlist.includes(p.id)).length} Assets Under Surveillance
                  </p>
               </div>
               {products.filter(p => wishlist.includes(p.id)).length > 0 && (
                  <button 
                     onClick={() => {
                        const items = products.filter(p => wishlist.includes(p.id));
                        items.forEach(p => wrapAddToCart(p));
                        setWishlist([]); // Clear wishlist after bulk add
                        onToast?.(`Bulk synchronization complete: ${items.length} assets transferred to cart.`, 'success');
                     }}
                     className="w-full sm:w-auto px-8 py-3.5 bg-accent text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:shadow-2xl hover:shadow-accent/40 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                     <ShoppingCart size={16} />
                     Transfer All to Cart
                  </button>
               )}
            </div>

            <div className={cn("grid gap-8", products.filter(p => wishlist.includes(p.id)).length > 0 ? (viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1") : "grid-cols-1")}>
               {products.filter(p => wishlist.includes(p.id)).length === 0 ? (
                  <div className="p-20 text-center glass-card-dark rounded-3xl col-span-full">
                     <Heart size={48} className="mx-auto mb-4 text-slate-700" />
                     <p className="text-slate-500 font-bold mb-2">Manifest is Empty</p>
                     <p className="text-slate-500 text-xs">Search our marketplace to add items to your watchlist for price tracking.</p>
                  </div>
               ) : products.filter(p => wishlist.includes(p.id)).map((p, idx) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                     <ProductCard 
                        product={p}
                        viewMode={viewMode}
                        isWishlisted={true}
                        isWishlistTab={true}
                        onToggleWishlist={() => toggleWishlist(p.id)}
                        onAddToCart={() => handleWishlistToCart(p)}
                        onViewSpecs={() => setSpecsProduct(p)}
                        isComparing={compareItems.some(i => i.id === p.id)}
                        onCompare={() => toggleCompare(p)}
                     />
                  </motion.div>
               ))}
            </div>
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
       
       <ProductCompare 
          products={compareItems}
          isOpen={isCompareOpen}
          onRemove={(id) => setCompareItems(prev => prev.filter(i => i.id !== id))}
          onClear={() => { setCompareItems([]); setIsCompareOpen(false); }}
       />

       <ReviewModal 
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          product={reviewProduct}
          onToast={onToast}
          onSuccess={() => {
             fetchData();
             setReviewProduct(null);
          }}
       />
    </div>
  );
}

function ProductCard({ 
  product, 
  onAddToCart, 
  isWishlisted, 
  onToggleWishlist, 
  onViewSpecs, 
  viewMode = 'grid', 
  isComparing, 
  onCompare,
  isWishlistTab = false
}: any) {
  // Decorator Pattern Logic
  let decoratedProduct: ProductComponent = new BaseProduct(product.name, product.price);
  
  // Apply decorators based on numeric product ID
  const pid = parseInt(product.id) || product.id.length || 0;
  if (pid % 4 === 0) decoratedProduct = new NewArrivalDecorator(decoratedProduct);
  if (pid % 4 === 1) decoratedProduct = new SaleDecorator(decoratedProduct, 15);
  if (pid % 4 === 2) decoratedProduct = new TrendingDecorator(decoratedProduct);
  if (product.stock <= 5 && product.stock > 0) decoratedProduct = new OutOfStockDecorator(decoratedProduct);

  const badges = decoratedProduct.getBadges();
  const displayPrice = decoratedProduct.getPrice();

  // Price tracking state
  const [lastKnownPrice, setLastKnownPrice] = useState(product.price);
  
  const rating = product.rating || 0;

  return (
    <GlassCard variant="dark" className={cn(
       "group relative flex flex-col h-full hover:border-accent/40 transition-all duration-500",
       viewMode === 'list' ? "md:flex-row gap-8 items-center" : ""
    )}>
       <div className={cn(
         "relative overflow-hidden rounded-2xl shrink-0",
         viewMode === 'list' ? "w-full md:w-64 h-48" : "w-full aspect-square"
       )}>
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 pointer-events-none">
             {badges.map(b => (
               <div key={b}>
                 <Badge variant={b.includes('SALE') ? 'error' : b.includes('NEW') ? 'info' : 'warning'} className="text-[8px] py-0 px-2 shadow-xl border-white/20">
                   {b}
                 </Badge>
               </div>
             ))}
          </div>

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
                onClick={onCompare}
                className={cn(
                  "p-2.5 rounded-xl backdrop-blur-md transition-all shadow-xl",
                  isComparing ? "bg-accent text-white" : "bg-black/20 text-white hover:bg-accent"
                )}
                title="Add to Comparative Analysis"
             >
                <Layers size={18} />
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

       <div className="flex-1 py-6 flex flex-col px-4">
          <div className="flex justify-between items-start mb-2">
             <Badge variant="info" className="text-[9px] py-0 px-2 tracking-widest">{product.category?.toUpperCase() || 'GENERAL'}</Badge>
             <div className="flex items-center gap-1 text-amber-500">
                {[1,2,3,4,5].map(star => (
                    <Star key={star} size={10} fill={star <= Math.round(rating) ? 'currentColor' : 'none'} className={star <= Math.round(rating) ? 'text-amber-500' : 'text-slate-700'} />
                ))}
                <span className="text-[10px] font-bold ml-1">{rating > 0 ? rating.toFixed(1) : 'NEW'}</span>
             </div>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{product.name}</h3>
          <p className="text-slate-500 text-sm mb-6 line-clamp-2">{product.description}</p>
          
          <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-2">
             <div className="flex flex-col min-w-0">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">Global Asset Price</p>
                <div className="flex items-baseline gap-1 truncate">
                   <span className={cn(
                     "text-xl font-display font-bold text-white",
                     displayPrice < product.price ? "text-emerald-400" : ""
                   )}>${displayPrice.toFixed(0)}</span>
                   {displayPrice < product.price && (
                     <span className="text-[10px] text-slate-600 line-through">${product.price}</span>
                   )}
                   <span className="text-[10px] text-slate-500">USD</span>
                </div>
             </div>
             
             <div className="flex gap-1.5 shrink-0">
                {isWishlistTab ? (
                  <button 
                    onClick={onAddToCart}
                    className="h-11 bg-accent text-white rounded-xl font-bold text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-accent/40 hover:-translate-y-0.5 transition-all active:scale-95 px-4"
                  >
                    <ShoppingCart size={14} />
                    <span>Move to Cart</span>
                  </button>
                ) : (
                  <>
                    {isWishlisted && (
                      <button 
                          onClick={onToggleWishlist}
                          className="w-11 h-11 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl active:scale-95"
                          title="Remove from Wishlist"
                      >
                          <Trash2 size={18} />
                      </button>
                    )}
                    <button 
                      onClick={onAddToCart}
                      className="w-11 h-11 flex items-center justify-center rounded-xl bg-white text-primary hover:bg-accent hover:text-white transition-all shadow-xl hover:shadow-accent/40 active:scale-95"
                      title="Add to Cart"
                    >
                      <ShoppingCart size={18} />
                    </button>
                  </>
                )}
             </div>
          </div>
       </div>
    </GlassCard>
  );
}
