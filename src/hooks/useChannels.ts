'use client';

import { useState, useEffect, useCallback } from 'react';
import { Channel } from '@/types/channel';

interface UseChannelsResult {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useChannels(country: string | null): UseChannelsResult {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    if (!country || country === 'all' || country === 'favorites' || country === 'sports') {
      // For 'all', fetch all three countries
      if (country === 'all') {
        setLoading(true);
        setError(null);
        try {
          const results = await Promise.all(
            ['bd', 'in', 'ar'].map((c) =>
              fetch(`/api/streams?country=${c}`).then((r) => r.json())
            )
          );
          const allChannels = results.flatMap((r) => r.channels || []);
          setChannels(allChannels);
        } catch {
          setError('Failed to load channels. Please try again.');
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/streams?country=${country}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setChannels(data.channels || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load channels. Please try again.'
      );
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, [country]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return { channels, loading, error, refetch: fetchChannels };
}

// Hook for localStorage favorites
export function useFavorites() {
  const [favorites, setFavorites] = useState<Channel[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('livetv-favorites');
      if (stored) setFavorites(JSON.parse(stored));
    } catch {}
  }, []);

  const addFavorite = useCallback((channel: Channel) => {
    setFavorites((prev) => {
      if (prev.find((c) => c.id === channel.id)) return prev;
      const next = [...prev, channel];
      localStorage.setItem('livetv-favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFavorite = useCallback((channelId: string) => {
    setFavorites((prev) => {
      const next = prev.filter((c) => c.id !== channelId);
      localStorage.setItem('livetv-favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (channelId: string) => favorites.some((c) => c.id === channelId),
    [favorites]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
