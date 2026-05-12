import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, MessageSquare, Workflow, Settings, Bell, Search, UserCircle, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

function cn(...inputs) { return twMerge(clsx(inputs)); }

export default function MainLayout() {
  const { health } = useStore();
  const location = useLocation();
  
  const links = [
    { to: "/", icon: LayoutDashboard, label: "Overview" },
    { to: "/architecture", icon: Workflow, label: "Orchestration" },
    { to: "/documents", icon: Database, label: "Knowledge Graph" },
    { to: "/chat", icon: MessageSquare, label: "AI Workspace" },
  ];

  // Map route to breadcrumb
  const getPageTitle = () => {
    switch(location.pathname) {
      case "/": return "Platform Overview";
      case "/architecture": return "Orchestration Pipelines";
      case "/documents": return "Dataset Intelligence";
      case "/chat": return "AI Analyst Workspace";
      default: return "A.R.C.H.E.R.";
    }
  }

  return (
    <div className="flex h-screen w-full bg-[#F4F7FB] overflow-hidden font-sans text-[#111827]">
      
      {/* Matte Navy Sidebar */}
      <aside className="w-[260px] h-full bg-[#0E1A2B] flex flex-col shrink-0 border-r border-[#08172c]">
        {/* Logo / Header */}
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <Workflow className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-semibold text-[15px] tracking-tight text-white leading-tight">A.R.C.H.E.R.</span>
              <span className="text-[11px] text-gray-400 font-medium tracking-wide">Enterprise UI</span>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 flex flex-col gap-1">
          <div className="px-3 mb-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Infrastructure</div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => cn(
                "relative flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-[#16243A] text-white" 
                  : "text-gray-400 hover:bg-[#16243A]/50 hover:text-gray-200"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 z-10">
                    <link.icon className={cn("w-4 h-4 transition-transform duration-300 group-hover:scale-110", isActive ? "text-blue-400" : "text-gray-500")} />
                    {link.label}
                  </div>
                  {isActive && (
                    <motion.div 
                      layoutId="active-pill" 
                      className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(36,91,255,0.4)]" 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-gray-400 hover:text-gray-200">
            <Settings className="w-4 h-4" />
            <span className="text-[13px] font-medium">Settings</span>
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Premium Topbar */}
        <header className="h-16 flex-shrink-0 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400 font-medium">Organization</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <span className="text-gray-900 font-semibold font-display tracking-tight">{getPageTitle()}</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search infrastructure..." 
                className="w-64 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
              />
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200">
                <span className={cn("w-2 h-2 rounded-full", health ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-red-500")} />
                <span className="text-[11px] font-mono text-gray-600 font-medium tracking-wide">SYSTEM: {health ? 'OK' : 'ERR'}</span>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <UserCircle className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
