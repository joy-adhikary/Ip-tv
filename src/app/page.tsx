'use client';

import { useState, useCallback, useEffect } from 'react';
import { Channel, SidebarView } from '@/types/channel';
import Sidebar from '@/components/Sidebar';
import NavBar from '@/components/NavBar';
import HeroPlayer from '@/components/HeroPlayer';
import ChannelGrid from '@/components/ChannelGrid';
import { useFavorites } from '@/hooks/useChannels';

export default function HomePage() {
  const [activeView, setActiveView] = useState<SidebarView>('bd');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [channelCount, setChannelCount] = useState(0);
  // Avoid hydration mismatch for Date.now()
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const { favorites } = useFavorites();

  const handleViewChange = useCallback((view: SidebarView) => {
    setActiveView(view);
    setSearchQuery('');
    setSidebarOpen(false);
  }, []);

  const handleSelectChannel = useCallback((channel: Channel) => {
    setSelectedChannel(channel);
    // Scroll to top so the newly mounted player is visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen flex overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        favoritesCount={favorites.length}
      />

      {/* Main Content Area — offset by sidebar width on lg+ */}
      <main className="flex-1 flex flex-col min-h-screen lg:pl-64 min-w-0 overflow-x-hidden">
        {/* Top Nav */}
        <NavBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          channelCount={channelCount}
        />

        {/* Page Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto w-full min-w-0">
          {/* Hero Player — only rendered when a channel is selected */}
          {selectedChannel && (
            <div className="animate-fade-slide-in">
              <HeroPlayer channel={selectedChannel} />
            </div>
          )}

          {/* Channel Grid */}
          <ChannelGrid
            activeView={activeView}
            searchQuery={searchQuery}
            selectedChannel={selectedChannel}
            onSelectChannel={handleSelectChannel}
            onCountChange={setChannelCount}
          />
        </div>

        {/* Footer */}
        <footer className="border-t border-white/[0.05] px-6 py-4 mt-4">
          <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-600">
              {year ? `© ${year} ` : ''}
              <span className="gradient-text font-semibold">LiveTV Premium</span>
              {' '}— Powered by{' '}
              <a
                href="https://iptv-org.github.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:text-indigo-400 transition-colors"
              >
                IPTV-Org
              </a>
            </p>
            <p className="text-[10px] text-slate-700">
              For prosonal use purposes only. We do not host any video content.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
