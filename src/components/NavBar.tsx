'use client';

import { Search, Bell, Settings, Wifi } from 'lucide-react';

interface NavBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  channelCount: number;
}

export default function NavBar({ searchQuery, onSearchChange, channelCount }: NavBarProps) {
  return (
    <header className="glass-strong border-b border-white/[0.06] sticky top-0 z-20">
      <div className="flex items-center gap-4 px-6 py-3.5">
        {/* Search */}
        <div className="flex-1 relative max-w-md ml-8 lg:ml-0">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search channels, groups..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all"
          />
        </div>

        <div className="flex-1" />

        {/* Stats */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <Wifi size={12} className="text-emerald-400" />
          <span className="text-xs text-slate-400 font-medium">
            <span className="text-emerald-400 font-semibold">{channelCount}</span> channels
          </span>
        </div>

        {/* Actions */}
        <button className="w-9 h-9 rounded-xl glass border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-white/20 transition-all relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
        </button>

        <button className="w-9 h-9 rounded-xl glass border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-white/20 transition-all">
          <Settings size={16} />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/25">
          JD
        </div>
      </div>
    </header>
  );
}
