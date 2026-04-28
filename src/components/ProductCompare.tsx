import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Zap, Trash2, ChevronRight } from 'lucide-react';
import { GlassCard } from './ui/Common';

interface ProductCompareProps {
  products: any[];
  onRemove: (id: string) => void;
  onClear: () => void;
  isOpen: boolean;
}

export function ProductCompare({ products, onRemove, onClear, isOpen }: ProductCompareProps) {
  if (products.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-6"
        >
          <GlassCard variant="dark" className="max-w-6xl mx-auto shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10 rounded-t-[3rem] rounded-b-none overflow-hidden">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                   <Zap size={20} />
                </div>
                <div>
                   <h3 className="font-bold text-lg">Compare Nodes</h3>
                   <p className="text-xs text-slate-500">{products.length} assets selected for analysis</p>
                </div>
              </div>
              <button 
                onClick={onClear}
                className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest flex items-center gap-2"
              >
                Clear All <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="relative p-6 rounded-3xl bg-white/5 border border-white/5 group">
                  <button 
                    onClick={() => onRemove(p.id)}
                    className="absolute top-4 right-4 p-2 hover:bg-rose-500/20 hover:text-rose-500 rounded-xl transition-all"
                  >
                    <X size={16} />
                  </button>
                  
                  <div className="flex gap-4 mb-6">
                    <img src={p.imageUrl} className="w-20 h-20 rounded-2xl object-cover border border-white/10" alt={p.name} />
                    <div>
                      <h4 className="font-bold text-white mb-1">{p.name}</h4>
                      <p className="text-xl font-display text-accent font-bold">${p.price}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Category</span>
                      <span className="text-xs font-medium">{p.category}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Availability</span>
                      <span className={`text-xs font-bold ${p.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {p.stock > 0 ? `${p.stock} Units` : 'Out of Stock'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Protocol</span>
                      <span className="text-xs font-medium">Standard</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
