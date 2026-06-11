'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListTodo, PlusSquare, BarChart2, Settings } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path 
      ? "flex items-center gap-3 px-3 py-2 bg-orange-50 text-primary rounded-md transition-colors"
      : "flex items-center gap-3 px-3 py-2 text-text-muted hover:bg-background hover:text-primary rounded-md transition-colors";
  };

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen flex flex-col fixed left-0 top-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="w-8 h-8 bg-primary text-white rounded flex items-center justify-center font-bold text-lg mr-3">SB</div>
        <span className="font-bold text-xl text-text-main tracking-tight">SIXBRICK</span>
      </div>
      <div className="flex-1 py-6 px-4 space-y-1">
        <Link href="/dashboard" className={isActive('/dashboard')}>
          <LayoutDashboard size={20} />
          <span className="font-medium">Dashboard</span>
        </Link>
        <Link href="/" className={isActive('/')}>
          <ListTodo size={20} />
          <span className="font-medium">Activities</span>
        </Link>
        <Link href="/add" className={isActive('/add')}>
          <PlusSquare size={20} />
          <span className="font-medium">Add Activity</span>
        </Link>
        <Link href="#" className={isActive('/reports')}>
          <BarChart2 size={20} />
          <span className="font-medium">Reports</span>
        </Link>
        <Link href="/" className="flex items-center gap-3 px-3 py-2 text-text-muted hover:bg-background hover:text-primary rounded-md transition-colors">
          <Settings size={20} />
          <span className="font-medium">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
