import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, MessageSquare, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { GlassCard } from './ui/Common';
import { api } from '../services/api';
import { cn } from '../lib/utils';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onSuccess: () => void;
  onToast?: (msg: string, type?: any) => void;
}

export function ReviewModal({ isOpen, onClose, product, onSuccess, onToast }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      onToast?.('Please prioritize a rating level (1-5 star).', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.products.addReview(product.id, { rating, comment });
      setIsSuccess(true);
      onToast?.('Review sequence synchronized successfully.', 'success');
      setTimeout(() => {
        onSuccess();
        reset();
        onClose();
      }, 2000);
    } catch (err: any) {
      onToast?.(err.message || 'Verification failure for review submission.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setRating(0);
    setComment('');
    setIsSuccess(false);
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden"
          >
            {isSuccess ? (
              <div className="p-12 text-center space-y-6">
                 <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto animate-bounce">
                    <CheckCircle2 size={40} />
                 </div>
                 <h2 className="text-2xl font-bold">Protocol Complete</h2>
                 <p className="text-slate-500">Your feedback has been integrated into the asset ledger.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-accent/10 to-transparent">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                         <MessageSquare size={24} />
                      </div>
                      <div>
                         <h2 className="text-xl font-bold tracking-tight">Review Protocol</h2>
                         <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">{product.name}</p>
                      </div>
                   </div>
                   <button 
                     onClick={onClose}
                     className="p-3 hover:bg-white/5 rounded-full transition-all text-slate-400 hover:text-white"
                   >
                     <X size={24} />
                   </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                   <div className="space-y-4 text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assign Rating Status</p>
                      <div className="flex justify-center gap-2">
                         {[1, 2, 3, 4, 5].map((star) => (
                            <button
                               key={star}
                               type="button"
                               className={cn(
                                 "p-2 transition-all duration-300",
                                 (hover || rating) >= star ? "text-amber-500 scale-110" : "text-slate-700"
                               )}
                               onMouseEnter={() => setHover(star)}
                               onMouseLeave={() => setHover(0)}
                               onClick={() => setRating(star)}
                            >
                               <Star size={32} fill={(hover || rating) >= star ? 'currentColor' : 'none'} strokeWidth={1.5} />
                            </button>
                         ))}
                      </div>
                      <p className="text-xs text-slate-500 italic">
                         {rating === 1 && "Critical Fail"}
                         {rating === 2 && "Sub-optimal Performance"}
                         {rating === 3 && "Nominal Operations"}
                         {rating === 4 && "Superior Asset"}
                         {rating === 5 && "Flawless Execution"}
                      </p>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Feedback Log</label>
                      <textarea
                         required
                         rows={4}
                         placeholder="Synthesize your experience with this asset..."
                         className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-accent transition-all resize-none"
                         value={comment}
                         onChange={(e) => setComment(e.target.value)}
                      />
                   </div>

                   <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl">
                      <p className="text-[9px] text-slate-500 uppercase leading-relaxed">
                         Note: Review eligibility is strictly tied to verified procurement nodes. Attempts to spoof feedback will result in account status evaluation.
                      </p>
                   </div>

                   <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 bg-white text-primary rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                   >
                      {isSubmitting ? (
                        <>
                           <Loader2 size={20} className="animate-spin" />
                           Synchronizing...
                        </>
                      ) : (
                        <>
                           <Send size={20} />
                           Submit Feedback
                        </>
                      )}
                   </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
