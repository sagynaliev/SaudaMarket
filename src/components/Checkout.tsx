import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Truck, ShieldCheck, CheckCircle, ChevronRight, Lock, MapPin, Globe, Loader2, ArrowLeft, Tag, Check } from 'lucide-react';
import { GlassCard, Badge } from './ui/Common';
import { CartItem } from '../types';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { resolvePricingStrategy, PricingEngine } from '../server/patterns/behavioral/pricing_strategy';
import { CurrencyAdapterFactory } from '../server/patterns/structural/currency_adapter';
import { CartStore } from '../server/patterns/creational/cart_singleton';
import { Trash2, Minus, Plus } from 'lucide-react';

import { APP_CONFIG } from '../constants';

const cartStore = CartStore.getInstance();

interface CheckoutProps {
  items: CartItem[];
  onComplete: () => void;
}

export function Checkout({ items, onComplete }: CheckoutProps) {
  const [step, setStep] = useState<'details' | 'payment' | 'processing'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [isInvalidPromo, setIsInvalidPromo] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'KZT' | 'EUR'>('USD');
  
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    zip: '',
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const total = items.reduce((a, b) => a + (b.price * b.quantity), 0);
  
  // Strategy Pattern (Pricing)
  const strategy = resolvePricingStrategy(appliedPromo || undefined, items.reduce((s, i) => s + i.quantity, 0));
  const engine = new PricingEngine(strategy);
  const calculation = engine.computeTotal(total, 1);

  // Adapter Pattern (Currency)
  const currencyAdapter = CurrencyAdapterFactory.getAdapter(currency);
  const formatPrice = (price: number) => {
    return `${currencyAdapter.getSymbol()}${currencyAdapter.convert(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const shipping = total > 500 ? 0 : 25;
  const grandTotal = calculation.total + shipping;

  const handleApplyPromo = () => {
    const validCodes = ['VIP15', 'BULK10', 'SALE25'];
    if (validCodes.includes(promoCode)) {
      setAppliedPromo(promoCode);
      setIsInvalidPromo(false);
    } else {
      setIsInvalidPromo(true);
      setTimeout(() => setIsInvalidPromo(false), 500);
    }
  };

  const handleProcessOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'details') {
      setStep('payment');
      return;
    }

    setIsLoading(true);
    setStep('processing');
    
    try {
      // 1. Create the order in the backend
      const orderData = {
        items: items.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          sellerId: (i as any).sellerId || '2' // Fallback for stability
        })),
        totalAmount: grandTotal,
        paymentMethod: 'stripe',
        appliedPromo: appliedPromo,
        currency: currency,
        shippingAddress: `${formData.address}, ${formData.city}, ${formData.zip}`
      };

      await api.orders.create(orderData);
      
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onComplete();
    } catch (err: any) {
      console.error(err);
      // Instead of alert, use the step state to show error if we had one, 
      // but for now let's just log and revert step to payment
      setStep('payment');
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) return (
     <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 text-slate-600">
           <Truck size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Cart is Empty</h2>
        <p className="text-slate-500 mb-8 max-w-xs">Initialize procurement sequence by adding items to your manifest.</p>
     </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{APP_CONFIG.NAME} Protocol</h1>
            <p className="text-slate-400 mt-1">Reviewing transaction manifest and security credentials.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Progress Indicator */}
          <div className="flex gap-4 mb-4">
             {['details', 'payment'].map((s, idx) => (
               <div key={s} className="flex-1 h-1.5 rounded-full bg-white/5 relative overflow-hidden">
                  <div 
                    className={cn(
                        "h-full bg-accent transition-all duration-700",
                        (step === s || (step === 'payment' && idx === 0) || step === 'processing') ? "w-full" : "w-0"
                    )} 
                  />
               </div>
             ))}
          </div>

          <form onSubmit={handleProcessOrder} className="space-y-8">
             <AnimatePresence mode="wait">
                {step === 'details' ? (
                  <motion.div 
                    key="details"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-8"
                  >
                    <GlassCard variant="dark" className="p-8">
                       <div className="flex items-center gap-4 mb-8">
                          <MapPin className="text-accent" />
                          <h3 className="text-xl font-bold">Transit Logistics</h3>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2 space-y-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Destination Address</label>
                             <input 
                                required
                                className="input-glass" 
                                placeholder="Quantum Street 123, Block B"
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Regional Sector</label>
                             <input 
                                required
                                className="input-glass" 
                                placeholder="Neo Almaty"
                                value={formData.city}
                                onChange={e => setFormData({...formData, city: e.target.value})}
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Postal Node</label>
                             <input 
                                required
                                className="input-glass" 
                                placeholder="010001"
                                value={formData.zip}
                                onChange={e => setFormData({...formData, zip: e.target.value})}
                             />
                          </div>
                       </div>
                    </GlassCard>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="payment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <GlassCard variant="dark" className="p-8">
                       <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                             <CreditCard className="text-accent" />
                             <h3 className="text-xl font-bold">Credit Matrix</h3>
                          </div>
                          <ShieldCheck className="text-emerald-500" />
                       </div>
                       <div className="space-y-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Account Holder</label>
                             <input 
                                required
                                className="input-glass" 
                                placeholder="ALAN TURING"
                                value={formData.cardName}
                                onChange={e => setFormData({...formData, cardName: e.target.value.toUpperCase()})}
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sequence Code</label>
                             <input 
                                required
                                className="input-glass" 
                                placeholder="4444 5555 6666 7777"
                                value={formData.cardNumber}
                                onChange={e => setFormData({...formData, cardNumber: e.target.value})}
                             />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Temporal Validity</label>
                                <input 
                                   required
                                   className="input-glass" 
                                   placeholder="MM / YY"
                                   value={formData.expiry}
                                   onChange={e => setFormData({...formData, expiry: e.target.value})}
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Security Node (CVV)</label>
                                <input 
                                   required
                                   type="password"
                                   maxLength={4}
                                   className="input-glass" 
                                   placeholder="•••"
                                   value={formData.cvv}
                                   onChange={e => setFormData({...formData, cvv: e.target.value})}
                                />
                             </div>
                          </div>
                       </div>
                    </GlassCard>
                  </motion.div>
                )}
             </AnimatePresence>

             <div className="flex items-center gap-4">
                {step === 'payment' && (
                  <button 
                    type="button" 
                    onClick={() => setStep('details')}
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <ArrowLeft size={24} />
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={step === 'processing'}
                  className="btn-primary flex-1 h-16 flex items-center justify-center gap-3 relative overflow-hidden group"
                >
                   {step === 'processing' ? (
                     <>
                        <Loader2 className="animate-spin" />
                        <span>SYNCHRONIZING WITH BLOCKCHAIN...</span>
                     </>
                   ) : (
                     <>
                        <span className="font-bold tracking-widest uppercase">
                          {step === 'details' ? 'CONTINUE TO PAYMENT' : `AUTHORIZE TRANSACTION (${formatPrice(grandTotal)})`}
                        </span>
                        <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                     </>
                   )}
                </button>
             </div>
          </form>
        </div>

        <div className="space-y-8">
           <GlassCard variant="dark" className="p-8 border-accent/20">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-bold text-sm uppercase tracking-widest text-slate-500">Manifest Summary</h3>
                 <button 
                   onClick={() => cartStore.clear()}
                   className="text-[10px] text-rose-500 font-bold hover:underline"
                 >
                    Clear All
                 </button>
              </div>

              {/* Currency Selector (Adapter Pattern) */}
              <div className="mb-6 pb-6 border-b border-white/5">
                 <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Globe size={12} /> Currency Node
                    </label>
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                    {(['KZT', 'USD', 'EUR'] as const).map((curr) => (
                       <button
                          key={curr}
                          type="button"
                          onClick={() => setCurrency(curr)}
                          className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${
                             currency === curr 
                                ? 'bg-accent/20 border-accent text-accent' 
                                : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'
                          }`}
                       >
                          {curr}
                       </button>
                    ))}
                 </div>
              </div>

              {/* Promo Code (Strategy Pattern) */}
              <div className="mb-6 pb-6 border-b border-white/5">
                 <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Tag size={12} /> Discount Protocol
                    </label>
                    {appliedPromo && (
                       <button 
                         type="button"
                         onClick={() => setAppliedPromo(null)}
                         className="text-[10px] text-rose-500 font-bold hover:underline"
                       >
                          Clear
                       </button>
                    )}
                 </div>
                 <div className="flex gap-2">
                    <motion.div 
                      animate={isInvalidPromo ? { x: [-5, 5, -5, 5, 0] } : {}}
                      className="flex-1"
                    >
                       <input 
                          type="text" 
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="ENTER CODE"
                          className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-[10px] font-bold placeholder:text-slate-600 focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                       />
                    </motion.div>
                    <button 
                       type="button"
                       onClick={handleApplyPromo}
                       className="h-10 w-10 flex items-center justify-center bg-white text-primary rounded-xl hover:bg-accent hover:text-white transition-all shadow-xl active:scale-95"
                    >
                       <Check size={16} />
                    </button>
                 </div>
                 {appliedPromo && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2"
                    >
                       <Check size={12} className="text-emerald-500" />
                       <p className="text-[9px] font-bold text-emerald-500 uppercase">{calculation.strategyName} Applied</p>
                    </motion.div>
                 )}
              </div>

              <div className="space-y-4 mb-8">
                 {items.map(item => (
                    <div key={item.id} className="flex flex-col gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 group">
                       <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                             <p className="text-sm font-medium text-white line-clamp-1">{item.name}</p>
                             <p className="text-xs text-slate-500 mt-0.5">{formatPrice(item.price)} per unit</p>
                          </div>
                          <p className="text-sm font-bold text-slate-200">{formatPrice(item.price * item.quantity)}</p>
                       </div>
                       
                       <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 bg-black/20 rounded-xl p-1 border border-white/5">
                             <button 
                                type="button"
                                onClick={() => cartStore.updateQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 transition-colors"
                             >
                                <Minus size={14} />
                             </button>
                             <span className="w-8 text-center text-xs font-bold font-mono">{item.quantity}</span>
                             <button 
                                type="button"
                                onClick={() => cartStore.updateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 transition-colors"
                             >
                                <Plus size={14} />
                             </button>
                          </div>
                          
                          <button 
                             type="button"
                             onClick={() => cartStore.removeItem(item.id)}
                             className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                             title="Remove item"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
              <div className="space-y-3 pt-6 border-t border-white/10">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Asset Value</span>
                    <span className="text-slate-300 font-bold">{formatPrice(total)}</span>
                 </div>
                 {calculation.savings > 0 && (
                    <div className="flex justify-between text-sm text-accent">
                       <span className="font-bold">Strategy Applied</span>
                       <span className="font-bold">-{formatPrice(calculation.savings)}</span>
                    </div>
                 )}
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Logistics Fee</span>
                    <span className="text-slate-300 font-bold">{formatPrice(shipping)}</span>
                 </div>
                 <div className="flex justify-between text-lg pt-3 border-t border-white/10">
                    <span className="font-bold">Total Payable</span>
                    <span className="font-bold text-accent">{formatPrice(grandTotal)}</span>
                 </div>
                 {calculation.savings > 0 && (
                    <p className="text-[10px] text-accent font-bold text-right uppercase tracking-widest mt-1">
                       You save {formatPrice(calculation.savings)}
                    </p>
                 )}
              </div>
           </GlassCard>

           <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-4">
              <div className="flex items-center gap-3 text-emerald-500">
                 <Lock size={18} />
                 <span className="text-xs font-bold uppercase tracking-widest">Encrypted Checkout</span>
              </div>
              <p className="text-xs text-slate-400">All payment data is processed through secured isolated environments and never stored on local nodes.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
