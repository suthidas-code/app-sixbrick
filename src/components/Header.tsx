'use client';

import { Search, Bell, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Header() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) setUsername(data.user);
      })
      .catch(console.error);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };
  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center bg-background border border-border rounded-md px-3 py-2 w-96 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-sm">
        <Search size={18} className="text-text-muted mr-2" />
        <input 
          type="text" 
          placeholder="Search activities..." 
          className="bg-transparent border-none outline-none text-sm w-full text-text-main placeholder-text-muted"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <button className="text-text-muted hover:text-primary transition-colors">
          <Bell size={20} />
        </button>
        <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white overflow-hidden">
            <User size={16} />
          </div>
          <span className="text-sm font-medium text-primary">
            {username || 'Loading...'}
          </span>
        </div>
        <button 
          onClick={handleLogout}
          className="text-text-muted hover:text-red-500 transition-colors ml-2"
          title="ออกจากระบบ"
        >
          <LogOut size={20} />
        </button>
        <Link href="/add" className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm ml-2">
          + Add Activity
        </Link>
      </div>
    </header>
  );
}
