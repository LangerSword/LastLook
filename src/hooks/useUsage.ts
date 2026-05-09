import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface UsageStats {
  fullReviewsUsed: number;
  individualActionsUsed: number;
  loading: boolean;
}

export function useUsage(): UsageStats {
  const { user, isDemoMode } = useAuth();
  const [stats, setStats] = useState<UsageStats>({
    fullReviewsUsed: 0,
    individualActionsUsed: 0,
    loading: true,
  });

  useEffect(() => {
    if (!supabase || !user || isDemoMode) {
      setStats({ fullReviewsUsed: 0, individualActionsUsed: 0, loading: false });
      return;
    }

    let isMounted = true;

    async function fetchUsage(supabaseClient: NonNullable<typeof supabase>) {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const isoStart = startOfDay.toISOString();

      try {
        const [fullRes, indRes] = await Promise.all([
          supabaseClient
            .from('usage_events')
            .select('*', { count: 'exact', head: true })
            .eq('action', 'full_review')
            .gte('created_at', isoStart),
          supabaseClient
            .from('usage_events')
            .select('*', { count: 'exact', head: true })
            .in('action', ['analyze', 'generate', 'check'])
            .gte('created_at', isoStart),
        ]);

        if (isMounted) {
          setStats({
            fullReviewsUsed: fullRes.count || 0,
            individualActionsUsed: indRes.count || 0,
            loading: false,
          });
        }
      } catch (err) {
        if (isMounted) {
          setStats(prev => ({ ...prev, loading: false }));
        }
      }
    }

    fetchUsage(supabase);

    return () => {
      isMounted = false;
    };
  }, [user, isDemoMode]);

  return stats;
}
