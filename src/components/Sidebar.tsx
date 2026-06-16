'use client';

import { SidebarView } from '@/types/channel';
import {
  Tv,
  Trophy,
  Globe,
  Heart,
  ChevronRight,
  Radio,
  Zap,
  X,
  Menu,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  isOpen: boolean;
  onToggle: () => void;
  favoritesCount: number;
}

const NAV_ITEMS = [
  {
    id: 'all',
    label: 'All Live Channels',
    icon: Tv,
    description: 'Browse all streams',
  },
  {
    id: 'sports',
    label: 'Sports Hub',
    icon: Trophy,
    description: 'FIFA & live sports',
  },
  {
    id: 'favorites',
    label: 'My Favorites',
    icon: Heart,
    description: 'Saved channels',
  },
] as const;

const COUNTRY_ITEMS = [
  { id: 'bd', label: 'Bangladesh', flag: '🇧🇩', color: '#22c55e' },
  { id: 'in', label: 'India', flag: '🇮🇳', color: '#f97316' },
  { id: 'ar', label: 'Argentina', flag: '🇦🇷', color: '#60a5fa' },
] as const;

export default function Sidebar({
  activeView,
  onViewChange,
  isOpen,
  onToggle,
  favoritesCount,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out',
          'glass-strong border-r border-white/[0.07]',
          'flex flex-col',
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-64'
        )}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Radio size={18} className="text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 animate-live-blink border-2 border-[#0a1020]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">LiveTV</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                Premium
              </p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {/* Main Items */}
          {NAV_ITEMS.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => onViewChange(id as SidebarView)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group relative',
                activeView === id
                  ? 'nav-item-active'
                  : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
              )}
            >
              <Icon
                size={18}
                className={clsx(
                  'shrink-0 transition-colors',
                  activeView === id ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                )}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium block truncate">{label}</span>
                <span className="text-[10px] text-slate-600 block truncate">{description}</span>
              </div>
              {id === 'favorites' && favoritesCount > 0 && (
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full px-2 py-0.5 font-semibold">
                  {favoritesCount}
                </span>
              )}
              {activeView === id && (
                <ChevronRight size={14} className="text-indigo-400 shrink-0" />
              )}
            </button>
          ))}

          {/* Country Filters */}
          <div className="pt-4 pb-1">
            <div className="flex items-center gap-2 px-3 mb-2">
              <Globe size={12} className="text-slate-600" />
              <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">
                Country Filters
              </span>
            </div>
            {COUNTRY_ITEMS.map(({ id, label, flag }) => (
              <button
                key={id}
                onClick={() => onViewChange(id as SidebarView)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group',
                  activeView === id
                    ? 'nav-item-active'
                    : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                )}
              >
                <span className="text-lg leading-none">{flag}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium block">{label}</span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider">{id.toUpperCase()}</span>
                </div>
                {activeView === id && (
                  <ChevronRight size={14} className="text-indigo-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Bottom Status */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Zap size={14} className="text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-emerald-400">Live Streams Active</p>
              <p className="text-[10px] text-slate-500">IPTV-Org Database</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className={clsx(
          'fixed top-4 left-4 z-50 lg:hidden',
          'w-10 h-10 rounded-xl glass border border-white/10',
          'flex items-center justify-center text-slate-300',
          'hover:text-white hover:border-white/20 transition-all',
          isOpen && 'hidden'
        )}
      >
        <Menu size={18} />
      </button>
    </>
  );
}
