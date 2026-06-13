'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListTodo, PlusSquare, BarChart2, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (value: boolean) => void;
}

export default function Sidebar({ isCollapsed = false, setIsCollapsed = () => {} }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path 
      ? `flex items-center gap-3 px-3 py-2 bg-orange-50 text-primary rounded-md transition-colors ${isCollapsed ? 'justify-center' : ''}`
      : `flex items-center gap-3 px-3 py-2 text-text-muted hover:bg-background hover:text-primary rounded-md transition-colors ${isCollapsed ? 'justify-center' : ''}`;
  };

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-surface border-r border-border h-screen flex flex-col fixed left-0 top-0 z-20 transition-all duration-300`}>
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-6'} border-b border-border transition-all duration-300`}>
        <div className={`w-8 h-8 bg-primary text-white rounded flex items-center justify-center font-bold text-lg ${isCollapsed ? '' : 'mr-3'} shrink-0`}>SB</div>
        {!isCollapsed && <span className="font-bold text-xl text-text-main tracking-tight truncate">SIXBRICK</span>}
      </div>
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto overflow-x-hidden">
        <Link href="/dashboard" className={isActive('/dashboard')} title={isCollapsed ? "Dashboard" : undefined}>
          <LayoutDashboard size={20} className="shrink-0" />
          {!isCollapsed && <span className="font-medium truncate">Dashboard</span>}
        </Link>
        <Link href="/" className={isActive('/')} title={isCollapsed ? "Activities" : undefined}>
          <ListTodo size={20} className="shrink-0" />
          {!isCollapsed && <span className="font-medium truncate">Activities</span>}
        </Link>
        <Link href="/add" className={isActive('/add')} title={isCollapsed ? "Add Activity" : undefined}>
          <PlusSquare size={20} className="shrink-0" />
          {!isCollapsed && <span className="font-medium truncate">Add Activity</span>}
        </Link>
        <Link href="#" className={isActive('/reports')} title={isCollapsed ? "Reports" : undefined}>
          <BarChart2 size={20} className="shrink-0" />
          {!isCollapsed && <span className="font-medium truncate">Reports</span>}
        </Link>
        <Link href="#" className={isActive('/settings')} title={isCollapsed ? "Settings" : undefined}>
          <Settings size={20} className="shrink-0" />
          {!isCollapsed && <span className="font-medium truncate">Settings</span>}
        </Link>
      </div>
      <div className="p-4 border-t border-border">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-end'} p-2 text-text-muted hover:text-primary hover:bg-orange-50 rounded-md transition-colors cursor-pointer`}
          title={isCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  );
}
