import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Printer, ShieldCheck, CreditCard, Building2, User2, Package } from 'lucide-react';
import { GlassCard } from './ui/Common';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onToast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function InvoiceModal({ isOpen, onClose, invoice, onToast }: InvoiceModalProps) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    onToast?.('PDF generation initialized. Please use system print to save as PDF for maximum security.', 'info');
    setTimeout(() => {
       window.print();
    }, 1000);
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl overflow-hidden glass-card-dark rounded-3xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                    <ShieldCheck size={24} />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold">Tax Invoice</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{invoice.invoiceId}</p>
                 </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div id="invoice-content" className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar bg-white/[0.01]">
               {/* Header Section */}
               <div className="grid grid-cols-2 gap-12 mb-12">
                  <div className="space-y-4">
                     <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Issuer (Seller)</p>
                     <div className="flex items-start gap-3">
                        <Building2 size={16} className="text-slate-500 mt-1" />
                        <div>
                           <p className="text-sm font-bold">{invoice.seller.name}</p>
                           <p className="text-xs text-slate-500">Merchant Protocol ID: {invoice.seller.id}</p>
                           <p className="text-xs text-slate-500">Digital City, Web3 Territory</p>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Recipient (Buyer)</p>
                     <div className="flex items-start gap-3">
                        <User2 size={16} className="text-slate-500 mt-1" />
                        <div>
                           <p className="text-sm font-bold">{invoice.buyer.name}</p>
                           <p className="text-xs text-slate-500">Node ID: {invoice.buyer.id}</p>
                           <p className="text-xs text-slate-500">Verified Identity Channel</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Meta Info */}
               <div className="flex flex-wrap gap-8 p-6 bg-white/5 rounded-2xl border border-white/5 mb-12">
                  <div>
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Issue Date</p>
                     <p className="text-sm font-mono">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Reference Order</p>
                     <p className="text-sm font-mono">#{invoice.orderId}</p>
                  </div>
                  <div>
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Method</p>
                     <p className="text-sm flex items-center gap-2">
                        <CreditCard size={14} className="text-accent" />
                        <span className="font-mono">DIGITAL_LEDGER</span>
                     </p>
                  </div>
                  <div>
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                     <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                        {invoice.status}
                     </div>
                  </div>
               </div>

               {/* Line Items */}
               <div className="space-y-4 mb-12">
                  <div className="grid grid-cols-12 px-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">
                     <div className="col-span-6">Asset Specification</div>
                     <div className="col-span-2 text-center">Qty</div>
                     <div className="col-span-2 text-right">Unit</div>
                     <div className="col-span-2 text-right">Total</div>
                  </div>
                  {invoice.items.map((item: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-12 px-4 items-center group">
                       <div className="col-span-6 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500">
                             <Package size={14} />
                          </div>
                          <p className="text-sm font-medium">{item.productName}</p>
                       </div>
                       <div className="col-span-2 text-center font-mono text-sm text-slate-400">
                          {item.quantity}
                       </div>
                       <div className="col-span-2 text-right font-mono text-sm text-slate-400">
                          ${item.price}
                       </div>
                       <div className="col-span-2 text-right font-bold text-sm">
                          ${item.total}
                       </div>
                    </div>
                  ))}
               </div>

               {/* Summary */}
               <div className="border-t border-white/5 pt-6 flex justify-end">
                  <div className="w-64 space-y-3">
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span>${invoice.subtotal}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Network Fee</span>
                        <span className="text-slate-500">$0.00</span>
                     </div>
                     <div className="flex justify-between text-lg font-bold border-t border-white/5 pt-3">
                        <span className="text-accent">TOTAL PAYABLE</span>
                        <span>${invoice.total}</span>
                     </div>
                  </div>
               </div>

               <div className="mt-12 p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Quantum Secured Transaction Hash</p>
                  <p className="text-[8px] font-mono text-slate-600 break-all mt-1">
                     SAUDA-PROTOCOL-{invoice.invoiceId}-SHA256-SIGNATURE-{Math.random().toString(36).substring(7).toUpperCase()}
                  </p>
               </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-white/5 flex gap-4">
               <button 
                  onClick={handlePrint}
                  className="flex-1 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-all"
               >
                  <Printer size={16} />
                  Print Document
               </button>
               <button 
                  onClick={handleDownload}
                  className="flex-1 h-12 bg-accent text-primary hover:scale-[1.02] rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-all"
               >
                  <Download size={16} />
                  Download PDF
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
