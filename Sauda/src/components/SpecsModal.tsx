import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, Shield, Scaling, ListChecks, ArrowRight } from 'lucide-react';
import { GlassCard } from './ui/Common';

interface SpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export function SpecsModal({ isOpen, onClose, product }: SpecsModalProps) {
  if (!product) return null;

  const specs = product.specifications || {
    brand: 'N/A',
    model: 'N/A',
    category: product.category || 'N/A',
    features: ['Standard features applied'],
    dimensions: 'N/A',
    additionalInfo: 'No additional specifications found for this node.'
  };

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
            className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-accent/10 to-transparent">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                     <Info size={24} />
                  </div>
                  <div>
                     <h2 className="text-xl font-bold tracking-tight">Technical Architecture</h2>
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

            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
               {/* Primary Attributes */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/5">
                     <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Shield size={12} /> Brand Identity
                     </p>
                     <p className="text-lg font-medium">{specs.brand}</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/5">
                     <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Shield size={12} /> Logic Model
                     </p>
                     <p className="text-lg font-medium">{specs.model}</p>
                  </div>
               </div>

               {/* Dimensions */}
               <div className="p-6 rounded-3xl bg-white/5 border border-white/5 relative overflow-hidden">
                  <Scaling className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Physical Dimensions</p>
                  <p className="text-2xl font-bold text-white tracking-tight">{specs.dimensions}</p>
               </div>

               {/* Features */}
               <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <ListChecks size={14} /> Feature Stack
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {specs.features.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group">
                           <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                              <ArrowRight size={12} />
                           </div>
                           <span className="text-sm">{feature}</span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Additional info */}
               <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Extended Protocol Info</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{specs.additionalInfo}</p>
               </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-end">
               <button 
                  onClick={onClose}
                  className="px-8 py-3 bg-white text-primary rounded-2xl font-bold text-sm uppercase tracking-widest hover:scale-105 transition-transform"
               >
                  Close Data Link
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
