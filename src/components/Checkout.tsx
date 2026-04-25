import { useState } from 'react';
import { CreditCard, Wallet, ArrowRight, ShieldCheck, Truck, Clock, AlertTriangle } from 'lucide-react';
import { GlassCard, Badge } from './ui/Common';
import { CartItem, PaymentProvider } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';

interface CheckoutProps {
  items: CartItem[];
  onComplete: (paymentMethod: PaymentProvider) => void;
}

export function Checkout({ items, onComplete }: CheckoutProps) {
  const [method, setMethod] = useState<PaymentProvider>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = 15.00;
  const total = subtotal + shipping;

  const handlePay = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    setError(null);
    try {
      await api.orders.create({
        items: items.map(i => ({ id: i.id, quantity: i.quantity, price: i.price, name: i.name })),
        totalAmount: total,
        paymentMethod: method
      });
      onComplete(method);
    } catch (err: any) {
      setError(err.message || 'Transaction failed. Gateway unresponsive.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center">
       <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart size={40} className="text-slate-600" />
       </div>
       <h2 className="text-2xl font-bold text-white">Your cart is empty</h2>
       <p className="text-slate-500 mt-2">Initialize procurement in the marketplace first.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left: Payment info */}
        <div className="lg:col-span-3 space-y-6">
          <GlassCard variant="dark">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
               <ShieldCheck className="text-accent" /> Secure Payment Gateway
            </h2>
            <div className="grid grid-cols-2 gap-4">
               <button 
                 onClick={() => setMethod('stripe')}
                 className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                    method === 'stripe' ? 'bg-accent/10 border-accent shadow-lg shadow-accent/10' : 'bg-white/5 border-white/5 hover:border-white/20'
                 }`}
               >
                 <CreditCard size={32} className={method === 'stripe' ? 'text-accent' : 'text-slate-400'} />
                 <div className="text-center">
                    <p className="font-bold text-sm text-white">Stripe Card</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Debit/Credit Node</p>
                 </div>
               </button>
               
               <button 
                 onClick={() => setMethod('paypal')}
                 className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                    method === 'paypal' ? 'bg-indigo-500/10 border-indigo-400 shadow-lg shadow-indigo-400/10' : 'bg-white/5 border-white/5 hover:border-white/20'
                 }`}
               >
                 <Wallet size={32} className={method === 'paypal' ? 'text-indigo-400' : 'text-slate-400'} />
                 <div className="text-center">
                    <p className="font-bold text-sm text-white">Digital Wallet</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Instant Settlement</p>
                 </div>
               </button>
            </div>

            <div className="mt-8 space-y-4">
               <div className="space-y-1">
                 <label className="text-xs text-slate-400 uppercase font-mono tracking-widest ml-1">Card Manifest</label>
                 <input type="text" placeholder="#### #### #### ####" className="input-glass" defaultValue="4242 4242 4242 4242" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 uppercase font-mono tracking-widest ml-1">Expiration</label>
                    <input type="text" placeholder="MM/YY" className="input-glass" defaultValue="12/28" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 uppercase font-mono tracking-widest ml-1">CVC Cipher</label>
                    <input type="text" placeholder="***" className="input-glass" defaultValue="123" />
                  </div>
               </div>
            </div>
          </GlassCard>

          <GlassCard variant="dark">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
               <Truck className="text-accent" /> Logistics Allocation
            </h2>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Recipient First Name" className="input-glass" defaultValue="Alikhan" />
                  <input type="text" placeholder="Recipient Last Name" className="input-glass" defaultValue="S." />
               </div>
               <input type="text" placeholder="Logistics Primary Address" className="input-glass" defaultValue="Dostyk Avenue 105, Unit 4B" />
               <div className="grid grid-cols-3 gap-4">
                  <input type="text" placeholder="City" className="input-glass" defaultValue="Almaty" />
                  <input type="text" placeholder="Region" className="input-glass" defaultValue="KZ" />
                  <input type="text" placeholder="Postal ID" className="input-glass" defaultValue="050010" />
               </div>
            </div>
          </GlassCard>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard variant="dark" className="sticky top-28 border-white/10 shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Manifest Summary</h2>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
               {items.map(item => (
                 <div key={item.id} className="flex gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-800" />
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-white truncate">{item.name}</p>
                       <p className="text-[10px] text-slate-500 font-mono">QUANTITY: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-mono text-emerald-400 font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                 </div>
               ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
               <div className="flex justify-between text-xs uppercase tracking-widest font-bold">
                 <span className="text-slate-500">Subtotal Assets</span>
                 <span className="text-white">${subtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-xs uppercase tracking-widest font-bold">
                 <span className="text-slate-500">Logistics Fee</span>
                 <span className="text-white">$15.00</span>
               </div>
               <div className="flex justify-between text-2xl font-display font-bold pt-4 text-white border-t border-white/5">
                 <span>Final Total</span>
                 <span className="text-accent">${total.toFixed(2)}</span>
               </div>
            </div>

            <AnimatePresence>
               {error && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-4">
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-[10px] flex items-center gap-2 font-bold uppercase">
                       <AlertTriangle size={14} /> {error}
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>

            <button 
              disabled={isProcessing || items.length === 0}
              onClick={handlePay}
              className="btn-primary w-full mt-8 py-5 flex items-center justify-center gap-3 relative overflow-hidden shadow-2xl shadow-accent/20"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                 {isProcessing ? (
                   <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="font-bold uppercase tracking-widest text-sm">Synchronizing...</span>
                   </>
                 ) : (
                   <>
                     <span className="font-bold uppercase tracking-widest text-sm">Commit Transaction</span>
                     <ArrowRight size={20} />
                   </>
                 )}
              </div>
            </button>
            <p className="text-[9px] text-center text-slate-600 mt-6 uppercase tracking-[0.2em] font-mono font-bold">
               Secure Settlement Protocol Active
            </p>
          </GlassCard>

          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-2 text-slate-500">
                <Clock size={12} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Express Deployment</span>
             </div>
             <div className="flex items-center gap-2 text-slate-500">
                <ShieldCheck size={12} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Protocol Shielded</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const ShoppingCart = ({ size, className }: { size: number, className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>;
