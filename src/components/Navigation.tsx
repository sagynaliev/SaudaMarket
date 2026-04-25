import { LayoutDashboard, ShoppingBag, Users, Store, Settings, Package, ShoppingCart, LogOut, Search, Bell, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onLogout: () => void;
}

export function Sidebar({ role, activeTab, setActiveTab, collapsed, setCollapsed, onLogout }: SidebarProps) {
  const adminLinks = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Analytics' },
    { id: 'users', icon: Users, label: 'User Directory' },
    { id: 'approvals', icon: Package, label: 'Product Approvals' },
    { id: 'settings', icon: Settings, label: 'System Settings' },
  ];

  const sellerLinks = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Revenue' },
    { id: 'inventory', icon: Package, label: 'Inventory' },
    { id: 'orders', icon: ShoppingBag, label: 'Store Orders' },
  ];

  const customerLinks = [
    { id: 'catalogue', icon: Store, label: 'Marketplace' },
    { id: 'orders', icon: ShoppingBag, label: 'My Orders' },
    { id: 'wishlist', icon: Heart, label: 'Wishlist' },
    { id: 'cart', icon: ShoppingCart, label: 'Cart' },
  ];

  const links = role === 'admin' ? adminLinks : role === 'seller' ? sellerLinks : customerLinks;

  return (
    <aside className={cn(
      "h-screen glass-card-dark rounded-none border-y-0 border-l-0 border-r-white/5 transition-all duration-500 fixed left-0 top-0 z-50 flex flex-col",
      collapsed ? "w-20" : "w-72"
    )}>
      <div className="p-6 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0 shadow-lg shadow-accent/20">
            <span className="font-display font-bold text-white">S</span>
          </div>
          {!collapsed && <span className="font-display font-bold text-xl tracking-tight text-white whitespace-nowrap">SAUDA</span>}
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all ml-1"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-2">
        {links.map((link) => (
          <button
            key={link.id}
            onClick={() => setActiveTab(link.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
              activeTab === link.id 
                ? "bg-accent/10 text-accent font-medium shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <link.icon size={20} className={cn("transition-transform shrink-0", activeTab === link.id ? "scale-110" : "group-hover:scale-110")} />
            {!collapsed && <span className="whitespace-nowrap">{link.label}</span>}
            {activeTab === link.id && (
              <div className="absolute left-0 w-1 h-6 bg-accent rounded-r-full" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 text-rose-400 hover:text-rose-300 w-full px-4 py-3 rounded-xl transition-colors hover:bg-rose-500/5 group"
        >
          <LogOut size={20} className="shrink-0 transition-transform group-hover:-translate-x-1" />
          {!collapsed && <span className="whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

interface TopNavProps {
  username: string;
  role: string;
  onProfileClick: () => void;
  onNotificationsClick: () => void;
  onSearch: (term: string) => void;
  hasUnreadNotifications?: boolean;
}

export function TopNav({ username, role, onProfileClick, onNotificationsClick, onSearch, hasUnreadNotifications }: TopNavProps) {
  return (
    <header className="h-20 glass-card-dark rounded-none border-x-0 border-t-0 border-b-white/5 px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <div className="relative group lg:w-96 hidden md:block">
           <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
           <input 
             type="text" 
             placeholder="Search marketplace, orders..." 
             className="w-full bg-slate-900/80 border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-sm focus:border-accent/40 focus:ring-1 focus:ring-accent/20 outline-none transition-all placeholder:text-slate-600 text-white"
             onChange={(e) => onSearch(e.target.value)}
           />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onNotificationsClick}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors relative group"
        >
           <Bell size={18} className="text-slate-300 group-hover:scale-110 transition-transform" />
           {hasUnreadNotifications && (
             <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent rounded-full ring-4 ring-primary animate-pulse"></span>
           )}
        </button>
        
        <div className="h-10 w-[1px] bg-white/10 mx-2 hidden sm:block"></div>
        
        <button 
          onClick={onProfileClick}
          className="flex items-center gap-3 group px-2 py-1.5 rounded-2xl hover:bg-white/5 transition-all"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white group-hover:text-accent transition-colors">{username}</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{role}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-indigo-700 flex items-center justify-center font-display font-bold text-white shadow-lg shadow-accent/20 border border-white/20 transition-transform group-hover:scale-105">
             <User size={18} />
          </div>
        </button>
      </div>
    </header>
  );
}

const Heart = ({ size, className, fill }: { size: number, className?: string, fill?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;

