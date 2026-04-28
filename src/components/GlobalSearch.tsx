import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, User, Package, Box, ChevronRight, X } from 'lucide-react';
import { api } from '../services/api';
import { RemoteSearchStrategy, SearchContext, SearchResult } from '../server/patterns/behavioral/search_strategy';
import { GlassCard, Badge } from './ui/Common';
import { cn } from '../lib/utils';
import { Product } from '../types';

interface GlobalSearchProps {
  query: string;
  onClose: () => void;
  onProductClick: (p: Product) => void;
  onUserClick: (u: any) => void;
}

export function GlobalSearch({ query, onClose, onProductClick, onUserClick }: GlobalSearchProps) {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const searchContext = new SearchContext(new RemoteSearchStrategy(api));

  useEffect(() => {
    const performSearch = async () => {
      if (query.trim().length < 2) {
        setResults(null);
        return;
      }
      
      setIsLoading(true);
      const res = await searchContext.executeSearch(query);
      setResults(res);
      setIsLoading(false);
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const hasResults = results && (results.products.length > 0 || results.users.length > 0 || (results.protocols?.length || 0) > 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Search className="text-accent" />
            Global Intelligence Search
          </h2>
          <p className="text-slate-500 text-sm mt-1">Found results matching: <span className="text-white font-mono italic">"{query}"</span></p>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-slate-500 transition-all">
          <X size={20} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest animate-pulse">Scanning distributed nodes...</p>
        </div>
      ) : hasResults ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Products Group */}
          <section className="space-y-4">
             <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                   <Package size={14} /> Marketplace Assets ({results.products.length})
                </h3>
             </div>
             <div className="space-y-3">
                {results.products.length > 0 ? results.products.map(p => (
                  <motion.div 
                    key={p.id} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => onProductClick(p)}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-accent/40 cursor-pointer transition-all flex items-center gap-4 group"
                  >
                     <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
                        <img src={p.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white group-hover:text-accent transition-colors truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{p.category} • ${p.price}</p>
                     </div>
                     <ChevronRight size={14} className="text-slate-600 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                  </motion.div>
                )) : (
                  <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                     <p className="text-xs text-slate-600">No assets detected.</p>
                  </div>
                )}
             </div>
          </section>

          {/* Users Group */}
          <section className="space-y-4">
             <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                   <User size={14} /> Network Nodes ({results.users.length})
                </h3>
             </div>
             <div className="space-y-3">
                {results.users.length > 0 ? results.users.map(u => (
                  <motion.div 
                    key={u.id} 
                    initial={{ opacity: 0, x: 10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => onUserClick(u)}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-accent/40 cursor-pointer transition-all flex items-center gap-4 group"
                  >
                     <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-indigo-700 flex items-center justify-center text-white font-bold shrink-0 shadow-lg">
                        {u.username.charAt(0)}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white group-hover:text-accent transition-colors truncate">{u.username}</p>
                        <Badge variant="info" className="text-[8px] py-0">{u.role.toUpperCase()}</Badge>
                     </div>
                     <ChevronRight size={14} className="text-slate-600 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                  </motion.div>
                )) : (
                  <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                     <p className="text-xs text-slate-600">No nodes detected.</p>
                  </div>
                )}
             </div>
          </section>

          {/* Other Entities (Protocols etc) */}
          {(results.protocols?.length || 0) > 0 && (
             <section className="col-span-full space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Box size={14} /> System Protocols ({results.protocols?.length})
                   </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {results.protocols?.map((prot: any) => (
                     <div key={prot.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                        <p className="font-bold text-sm group-hover:text-accent transition-colors">{prot.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{prot.description}</p>
                     </div>
                   ))}
                </div>
             </section>
          )}
        </div>
      ) : query.length >= 2 ? (
        <div className="py-20 text-center glass-card-dark rounded-3xl">
           <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-slate-700" />
           </div>
           <h3 className="text-xl font-bold mb-2">Null Result Detected</h3>
           <p className="text-slate-500 text-sm max-w-sm mx-auto">None of our distributed nodes contain records matching your current query parameters.</p>
        </div>
      ) : (
        <div className="py-20 text-center p-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
           <p className="text-slate-500">Enter at least 2 characters to initiate global scanning.</p>
        </div>
      )}
    </div>
  );
}
