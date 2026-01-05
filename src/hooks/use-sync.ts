'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { db } from '@/lib/db';
import { useState, useEffect } from 'react';

export function useSync() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    setLastSync(localStorage.getItem('last_sync_at'));
  }, []);

  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      
      // 1. Get unsynced local changes
      const unsyncedTx = await db.transactions.where('is_synced').equals(0).toArray();
      const unsyncedPayments = await db.payments.where('is_synced').equals(0).toArray();
      const unsyncedWeeks = await db.weeks.where('is_synced').equals(0).toArray();

      // 2. Push to server
      if (unsyncedTx.length > 0 || unsyncedPayments.length > 0 || unsyncedWeeks.length > 0) {
        await apiClient.post('/sync/push/', {
          transactions: unsyncedTx,
          payments: unsyncedPayments,
          weeks: unsyncedWeeks,
        });

        // Mark local as synced
        await db.transactions.where('id').anyOf(unsyncedTx.map(t => t.id)).modify({ is_synced: 1 });
        await db.payments.where('id').anyOf(unsyncedPayments.map(p => p.id)).modify({ is_synced: 1 });
        await db.weeks.where('id').anyOf(unsyncedWeeks.map(w => w.id)).modify({ is_synced: 1 });
      }

      // 3. Pull from server
      const lastSyncAt = localStorage.getItem('last_sync_at') || '1970-01-01T00:00:00Z';
      const response = await apiClient.get(`/sync/pull/?since=${lastSyncAt}`);
      const { transactions, payments, weeks } = response.data;

      // Upsert into local DB
      if (transactions.length > 0) {
        await db.transactions.bulkPut(transactions.map((t: any) => ({ ...t, is_synced: 1 })));
      }
      if (payments.length > 0) {
        await db.payments.bulkPut(payments.map((p: any) => ({ ...p, is_synced: 1 })));
      }
      if (weeks.length > 0) {
        await db.weeks.bulkPut(weeks.map((w: any) => ({ ...w, is_synced: 1 })));
      }

      const now = new Date().toISOString();
      localStorage.setItem('last_sync_at', now);
      setLastSync(now);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['weeks'] });
      setIsSyncing(false);
    },
    onError: () => {
      setIsSyncing(false);
    }
  });

  return {
    sync: syncMutation.mutate,
    syncAsync: syncMutation.mutateAsync,
    isSyncing,
    lastSync,
  };
}
