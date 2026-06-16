'use client';

import { useState, useMemo } from 'react';
import { Channel, SidebarView } from '@/types/channel';
import { useChannels, useFavorites } from '@/hooks/useChannels';
import ChannelCard, { ChannelCardSkeleton } from './ChannelCard';
import { RefreshCw, Tv, AlertCircle, Heart, LayoutGrid, Tag } from 'lucide-react';
import { clsx } from 'clsx';

interface ChannelGridProps {
  activeView: SidebarView;
  searchQuery: string;
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onCountChange: (count: number) => void;
}

const ALL_CATEGORY = 'All';

function getCountryForView(view: SidebarView): string | null {
  if (view === 'bd' || view === 'in' || view === 'ar' || view === 'all') return view;
  return null;
}

function ViewHeading({ view }: { view: SidebarView }) {
  const labels: Record<SidebarView, string> = {
    all: '🌍 All Live Channels',
    sports: '🏆 Sports Hub',
    bd: '🇧🇩 Bangladesh TV',
    in: '🇮🇳 India TV',
    ar: '🇦🇷 Argentina TV',
    favorites: '❤️ My Favorites',
  };
  return <h2 className="text-lg font-bold text-slate-100 mb-1">{labels[view]}</h2>;
}

// Category pill component
function CategoryPill({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
        'border transition-all duration-200 whitespace-nowrap',
        isActive
          ? 'bg-indigo-500/25 border-indigo-500/50 text-indigo-300 shadow-sm shadow-indigo-500/20'
          : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/20 hover:bg-white/[0.07]'
      )}
    >
      {label === ALL_CATEGORY ? (
        <LayoutGrid size={11} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
      ) : (
        <Tag size={10} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
      )}
      {label}
      <span
        className={clsx(
          'text-[9px] px-1.5 py-0.5 rounded-full font-semibold',
          isActive
            ? 'bg-indigo-500/30 text-indigo-300'
            : 'bg-white/[0.08] text-slate-500'
        )}
      >
        {count}
      </span>
    </button>
  );
}

export default function ChannelGrid({
  activeView,
  searchQuery,
  selectedChannel,
  onSelectChannel,
  onCountChange,
}: ChannelGridProps) {
  const country = getCountryForView(activeView);
  const { channels, loading, error, refetch } = useChannels(country);
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);

  // Determine base channel list by view
  let baseChannels: Channel[] = channels;
  if (activeView === 'favorites') {
    baseChannels = favorites;
  } else if (activeView === 'sports') {
    baseChannels = channels.filter((c) =>
      /sport|football|soccer|cricket|fifa|tennis|nba|nfl|espn/i.test(c.name + c.group)
    );
  }

  // Apply search filter first
  const searchFiltered = useMemo(() => {
    if (!searchQuery) return baseChannels;
    const q = searchQuery.toLowerCase();
    return baseChannels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q)
    );
  }, [baseChannels, searchQuery]);

  // Extract sorted unique categories from the search-filtered base
  const categories = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const ch of searchFiltered) {
      const g = ch.group?.trim() || 'General';
      countMap.set(g, (countMap.get(g) ?? 0) + 1);
    }
    // Sort by count descending, then alphabetically
    return Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [searchFiltered]);

  // Reset category when view or search changes (if current category no longer exists)
  const categoryNames = categories.map((c) => c.name);
  const resolvedCategory =
    activeCategory === ALL_CATEGORY || categoryNames.includes(activeCategory)
      ? activeCategory
      : ALL_CATEGORY;

  // Apply category filter
  const displayChannels = useMemo(() => {
    if (resolvedCategory === ALL_CATEGORY) return searchFiltered;
    return searchFiltered.filter(
      (c) => (c.group?.trim() || 'General') === resolvedCategory
    );
  }, [searchFiltered, resolvedCategory]);

  const handleToggleFavorite = (channel: Channel) => {
    if (isFavorite(channel.id)) {
      removeFavorite(channel.id);
    } else {
      addFavorite(channel);
    }
  };

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <div className="mb-4">
          <ViewHeading view={activeView} />
          <p className="text-xs text-slate-500">Loading channels from IPTV-Org...</p>
        </div>
        {/* Skeleton category bar */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 w-full" style={{ scrollbarWidth: 'none' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-20 shrink-0 rounded-full skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <ChannelCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center">
          <AlertCircle size={28} className="text-rose-400" />
        </div>
        <div className="text-center">
          <p className="text-slate-300 font-semibold mb-1">Failed to load channels</p>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <button
            onClick={refetch}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold mx-auto"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Favorites empty ───────────────────────────────────────────────────────
  if (activeView === 'favorites' && favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center animate-float">
          <Heart size={28} className="text-rose-400" />
        </div>
        <div className="text-center">
          <p className="text-slate-300 font-semibold mb-1">No favorites yet</p>
          <p className="text-slate-500 text-sm">
            Click the ♥ on any channel card to save it here.
          </p>
        </div>
      </div>
    );
  }

  // ── Empty results ─────────────────────────────────────────────────────────
  if (displayChannels.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <ViewHeading view={activeView} />
            <p className="text-xs text-slate-500">
              {searchQuery
                ? `No channels matching "${searchQuery}"`
                : resolvedCategory !== ALL_CATEGORY
                ? `No channels in "${resolvedCategory}"`
                : 'No channels available'}
            </p>
          </div>
          <button
            onClick={refetch}
            className="w-8 h-8 rounded-lg glass border border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        {/* Still show category pills even when empty */}
        {categories.length > 0 && (
          <CategoryBar
            categories={categories}
            total={searchFiltered.length}
            active={resolvedCategory}
            onChange={setActiveCategory}
          />
        )}
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center animate-float">
            <Tv size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-500 text-sm">No channels found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <ViewHeading view={activeView} />
          <p className="text-xs text-slate-500">
            {displayChannels.length} channel{displayChannels.length !== 1 ? 's' : ''}
            {resolvedCategory !== ALL_CATEGORY && (
              <> · <span className="text-indigo-400">{resolvedCategory}</span></>
            )}
            {searchQuery && ` · "${searchQuery}"`}
          </p>
        </div>
        <button
          onClick={refetch}
          className="w-8 h-8 rounded-lg glass border border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-slate-300 hover:border-white/20 transition-all"
          title="Refresh channels"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Category Filter Bar */}
      <CategoryBar
        categories={categories}
        total={searchFiltered.length}
        active={resolvedCategory}
        onChange={setActiveCategory}
      />

      {/* Channel Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {displayChannels.map((channel, idx) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            isSelected={selectedChannel?.id === channel.id}
            isFavorite={isFavorite(channel.id)}
            onSelect={(ch) => {
              onSelectChannel(ch);
              onCountChange(displayChannels.length);
            }}
            onToggleFavorite={handleToggleFavorite}
            animationDelay={Math.min(idx * 25, 350)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Separate CategoryBar component ────────────────────────────────────────────
function CategoryBar({
  categories,
  total,
  active,
  onChange,
}: {
  categories: { name: string; count: number }[];
  total: number;
  active: string;
  onChange: (cat: string) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="mb-5 min-w-0 w-full">
      {/* Scrollable pill strip — w-0 flex-basis trick forces it to clip */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 w-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* "All" pill */}
        <CategoryPill
          label={ALL_CATEGORY}
          count={total}
          isActive={active === ALL_CATEGORY}
          onClick={() => onChange(ALL_CATEGORY)}
        />
        {/* Per-category pills */}
        {categories.map(({ name, count }) => (
          <CategoryPill
            key={name}
            label={name}
            count={count}
            isActive={active === name}
            onClick={() => onChange(active === name ? ALL_CATEGORY : name)}
          />
        ))}
      </div>
      {/* Subtle bottom divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  );
}
