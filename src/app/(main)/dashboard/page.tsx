'use client';

import { useState, useEffect, useMemo } from 'react';
import { Activity, SET_OPTIONS } from '@/lib/types';
import { LayoutDashboard, ListTodo, Layers, Loader2, FolderOpen } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
      if (!scriptUrl) {
        console.error('Missing Google Script URL');
        return;
      }
      const res = await fetch(`${scriptUrl}?action=getAll`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (data.status === 'success') {
        const mappedData = data.data.map((item: any, idx: number) => ({
          ...item,
          setNames: item.setNames || []
        }));
        const sorted = mappedData.sort((a: Activity, b: Activity) => 
          new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        );
        setActivities(sorted);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const totalActivities = activities.length;

  const setCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SET_OPTIONS.forEach(opt => counts[opt] = 0);
    
    activities.forEach(activity => {
      activity.setNames.forEach(setName => {
        if (counts[setName] !== undefined) {
          counts[setName]++;
        } else {
          // If a set name exists but is not in SET_OPTIONS
          counts[setName] = (counts[setName] || 0) + 1;
        }
      });
    });
    return counts;
  }, [activities]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-text-muted">กำลังโหลดข้อมูล Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <LayoutDashboard className="text-primary" size={24} />
            Dashboard
          </h1>
          <p className="text-text-muted text-sm mt-1">สรุปภาพรวมจำนวนกิจกรรมฝึกทักษะ</p>
        </div>
        <Link 
          href="/" 
          className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-md text-sm font-medium text-text-main hover:bg-gray-50 transition-colors"
        >
          <ListTodo size={16} />
          ดูรายการกิจกรรมทั้งหมด
        </Link>
      </div>

      {/* Summary Card */}
      <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
          <ListTodo className="w-8 h-8 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-muted">จำนวนกิจกรรมทั้งหมด</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-text-main">{totalActivities}</span>
            <span className="text-text-muted font-medium">รายการ</span>
          </div>
        </div>
      </div>

      {/* Breakdown by Sets */}
      <div>
        <h2 className="text-lg font-bold text-text-main flex items-center gap-2 mb-4">
          <Layers className="text-primary" size={20} />
          จำนวนกิจกรรมแยกตามชุด
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(setCounts).map(([setName, count]) => (
            <div key={setName} className="bg-white p-5 rounded-xl border border-border shadow-sm hover:border-primary/30 transition-colors group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <FolderOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-main text-sm">{setName}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary block leading-none">{count}</span>
                  <span className="text-xs font-medium text-text-muted">รายการ</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
