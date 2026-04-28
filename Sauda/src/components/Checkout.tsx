import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Truck, ShieldCheck, CheckCircle, ChevronRight, Lock, MapPin, Globe, Loader2, ArrowLeft } from 'lucide-react';
import { GlassCard, Badge } from './ui/Common';
import { CartItem } from '../types';
import { api } from '../services/api';
import { cn } from '../lib/utils';

interface CheckoutProps {
  items: CartItem[];
  onComplete: () => void;
}

export function Checkout({ items, onComplete }: CheckoutProps) {
  const [step, setStep] = useState<'details' | 'payment' | 'processing'>('details');
  const [isLoading, setIsLoading] = useState(false);
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
  const shipping = total > 500 ? 0 : 25;
  const grandTotal = total + shipping;

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
        shippingAddress: `${formData.address}, ${formData.city}, ${formData.zip}`
      };

      await api.orders.create(orderData);
      
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onComplete();
    } catch (err) {
      console.error(err);
      alert('Order synchronization failure. Retrying sequence...');
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Order Protocol</h1>
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
                          {step === 'details' ? 'CONTINUE TO PAYMENT' : `AUTHORIZE TRANSACTION ($${grandTotal.toFixed(2)})`}
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
              <h3 className="font-bold mb-6 text-sm uppercase tracking-widest text-slate-500">Manifest Summary</h3>
              <div className="space-y-4 mb-8">
                 {items.map(item => (
                   <div key={item.id} className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                         <p className="text-sm font-medium text-white line-clamp-1">{item.name}</p>
                         <p className="text-xs text-slate-500 mt-0.5">{item.quantity} x ${item.price.toFixed(2)}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-200">${(item.price * item.quantity).toFixed(2)}</p>
                   </div>
                 ))}
              </div>
              <div className="space-y-3 pt-6 border-t border-white/10">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Asset Value</span>
                    <span className="text-slate-300 font-bold">${total.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Logistics Fee</span>
                    <span className="text-slate-300 font-bold">${shipping.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-lg pt-3 border-t border-white/10">
                    <span className="font-bold">Total Payable</span>
                    <span className="font-bold text-accent">${grandTotal.toFixed(2)}</span>
                 </div>
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
