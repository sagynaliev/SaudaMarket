import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Search, MoreVertical, CheckCircle, Info, MessageSquare } from 'lucide-react';
import { GlassCard, Badge } from './ui/Common';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  createdAt: string;
}

export function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await api.messages.list();
      setMessages(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setMessages([]);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await api.messages.getEligibleContacts();
      setContacts(Array.isArray(res) ? res : []);
      if (res.length > 0 && !selectedContact) {
        setSelectedContact(res[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.username.toLowerCase().includes(contactSearch.toLowerCase())
  );

  useEffect(() => {
    fetchMessages();
    fetchContacts();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredMessages = messages.filter(m => 
    (selectedContact && (m.fromId === selectedContact.id || m.toId === selectedContact.id))
  );

  const currentUser = JSON.parse(localStorage.getItem('sauda_user') || '{}');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedContact) return;

    try {
      await api.messages.send({ toId: selectedContact.id, text: inputText });
      setInputText('');
      fetchMessages();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'System transmission failure.');
    }
  };

  if (isLoading) return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent animate-spin rounded-full"></div></div>;

  return (
    <div className="h-[calc(100vh-200px)] flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Sidebar - Contacts */}
      <GlassCard className="w-1/3 flex flex-col p-4 overflow-hidden" variant="dark">
         <div className="mb-6">
            <h3 className="text-xl font-bold mb-4">Direct Channels</h3>
            <div className="relative">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
               <input 
                  placeholder="Search encrypted chats..." 
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs font-mono outline-none" 
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                />
            </div>
         </div>
         <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            {filteredContacts.length === 0 ? (
               <div className="p-8 text-center opacity-40">
                  <Info size={32} className="mx-auto mb-2" />
                  <p className="text-xs font-mono uppercase">{contactSearch ? 'NO MATCHES DETECTED' : 'No Purchase History Detected'}</p>
                  <p className="text-[10px] mt-2">{contactSearch ? 'Try a different protocol segment.' : 'Acquire assets to unlock merchant channels.'}</p>
               </div>
            ) : filteredContacts.map(contact => (
              <div 
                key={contact.id} 
                onClick={() => setSelectedContact(contact)}
                className={cn(
                  "p-4 border rounded-2xl flex gap-3 cursor-pointer transition-all",
                  selectedContact?.id === contact.id ? "bg-accent/20 border-accent/40" : "bg-white/5 border-white/5 hover:bg-white/10"
                )}
              >
                 <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center font-bold text-white shrink-0">
                    {contact.username.charAt(0).toUpperCase()}
                 </div>
                 <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{contact.username}</p>
                    <p className="text-[10px] text-slate-400 truncate tracking-widest uppercase">{contact.role}</p>
                 </div>
              </div>
            ))}
         </div>
      </GlassCard>

      {/* Main Chat Area */}
      <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden" variant="dark">
         {!selectedContact ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30">
               <MessageSquare size={64} className="mb-6" />
               <h3 className="text-2xl font-bold font-mono">CHANNEL_IDLE</h3>
               <p className="text-sm">Select a contact to begin transmission.</p>
            </div>
         ) : (
           <>
             {/* Chat Header */}
             <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-accent flex items-center justify-center font-bold text-lg text-white">
                      {selectedContact.username.charAt(0).toUpperCase()}
                   </div>
                   <div>
                      <h4 className="font-bold">{selectedContact.username}</h4>
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                         <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Synchronized</p>
                      </div>
                   </div>
                </div>
                <button className="p-2 hover:bg-white/5 rounded-xl text-slate-500"><MoreVertical size={20} /></button>
             </div>

             {/* Messages Scroll Area */}
             <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-900/40">
                {filteredMessages.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center opacity-20">
                      <Info size={40} className="mb-4" />
                      <p className="font-mono text-sm">NO DATA DETECTED IN CHANNEL</p>
                   </div>
                ) : filteredMessages.map((m) => {
                   const isMe = m.fromId === currentUser.id;
                   return (
                     <div key={m.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[70%] p-4 rounded-3xl text-sm font-medium shadow-lg transition-transform hover:scale-[1.02]",
                          isMe ? "bg-accent text-white rounded-tr-none" : "bg-white/10 border border-white/10 text-white rounded-tl-none"
                        )}>
                           <p>{m.text}</p>
                           <p className={cn("text-[9px] mt-2 font-mono uppercase tracking-widest opacity-60", isMe ? "text-right" : "text-left")}>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                     </div>
                   );
                })}
             </div>

             {/* Message Input Area */}
             <form onSubmit={handleSendMessage} className="p-6 bg-slate-900/60 border-t border-white/5 backdrop-blur-xl">
                <div className="relative group">
                   <input 
                     value={inputText}
                     onChange={(e) => setInputText(e.target.value)}
                     placeholder="Type your transmission here..." 
                     className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-sm focus:border-accent/40 focus:ring-1 focus:ring-accent/20 outline-none transition-all placeholder:text-slate-600 text-white"
                   />
                   <button 
                     type="submit"
                     className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-accent text-white rounded-xl shadow-lg shadow-accent/20 hover:scale-110 active:scale-95 transition-all"
                   >
                      <Send size={18} />
                   </button>
                </div>
             </form>
           </>
         )}
      </GlassCard>
    </div>
  );
}
