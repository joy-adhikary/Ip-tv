'use client';

import { useState } from 'react';
import { Channel } from '@/types/channel';
import { Play, Heart, Radio } from 'lucide-react';
import { clsx } from 'clsx';

interface ChannelCardProps {
  channel: Channel;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (channel: Channel) => void;
  animationDelay?: number;
}

function FlagEmoji({ country }: { country: string }) {
  const flags: Record<string, string> = { bd: '🇧🇩', in: '🇮🇳', ar: '🇦🇷' };
  return <span className="text-xs">{flags[country] || '🌐'}</span>;
}

function GroupBadge({ group }: { group: string }) {
  const truncated = group.length > 18 ? group.slice(0, 17) + '…' : group;
  return (
    <span className="text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 truncate max-w-[120px]">
      {truncated}
    </span>
  );
}

export default function ChannelCard({
  channel,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
  animationDelay = 0,
}: ChannelCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={clsx(
        'glass-card rounded-2xl overflow-hidden cursor-pointer group relative animate-fade-slide-in card-glow-purple',
        isSelected && 'ring-2 ring-indigo-500/60 border-indigo-500/40 shadow-lg shadow-indigo-500/20'
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={() => onSelect(channel)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail / Logo Area */}
      <div className="relative aspect-video bg-gradient-to-br from-slate-800/60 to-slate-900/80 overflow-hidden">
        {channel.logo && !imgError ? (
          <img
            src={channel.logo}
            alt={channel.name}
            onError={() => setImgError(true)}
            className={clsx(
              'w-full h-full object-contain p-3 transition-transform duration-500',
              isHovered && 'scale-110'
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Radio
              size={28}
              className={clsx(
                'text-slate-600 transition-all duration-300',
                isHovered && 'text-indigo-400 scale-110'
              )}
            />
          </div>
        )}

        {/* Hover Overlay */}
        <div
          className={clsx(
            'absolute inset-0 flex items-center justify-center transition-all duration-300',
            'bg-gradient-to-t from-black/70 via-black/20 to-transparent',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="w-10 h-10 rounded-full bg-indigo-500/90 flex items-center justify-center shadow-lg shadow-indigo-500/50 backdrop-blur-sm">
            <Play size={16} className="text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Live Badge */}
        <div className="absolute top-2 left-2">
          <span className="live-badge text-[9px] font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-live-blink" />
            LIVE
          </span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(channel);
          }}
          className={clsx(
            'absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200',
            'backdrop-blur-sm border',
            isFavorite
              ? 'bg-rose-500/80 border-rose-400/50 text-white'
              : 'bg-black/40 border-white/10 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30'
          )}
        >
          <Heart size={12} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        {/* Country Flag */}
        <div className="absolute bottom-2 right-2">
          <FlagEmoji country={channel.country} />
        </div>

        {/* Selected Indicator */}
        {isSelected && (
          <div className="absolute inset-0 ring-2 ring-inset ring-indigo-500/50 rounded-2xl" />
        )}
      </div>

      {/* Info */}
      <div className="px-3 pb-3 pt-2">
        <h3 className="text-sm font-semibold text-slate-200 truncate leading-snug mb-1">
          {channel.name}
        </h3>
        <GroupBadge group={channel.group} />
      </div>
    </div>
  );
}

// Skeleton Card
export function ChannelCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="aspect-video skeleton" />
      <div className="px-3 pb-3 pt-2 space-y-2">
        <div className="h-3.5 w-3/4 rounded-full skeleton" />
        <div className="h-2.5 w-1/2 rounded-full skeleton" />
      </div>
    </div>
  );
}
