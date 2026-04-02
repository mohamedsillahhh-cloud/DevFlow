import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

interface UseRealtimeSyncOptions {
  pollIntervalMs?: number
}

export function useRealtimeSync(
  tables: string[],
  onRefresh: () => void | Promise<void>,
  options?: UseRealtimeSyncOptions,
) {
  const [isLive, setIsLive] = useState(false)
  const pollIntervalMs = options?.pollIntervalMs ?? 20000
  const tableKey = tables.join('|')
  const refreshRef = useRef(onRefresh)

  useEffect(() => {
    refreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    const subscribedTables = tableKey ? tableKey.split('|') : []

    if (subscribedTables.length === 0) {
      return
    }

    let scheduledRefresh: ReturnType<typeof setTimeout> | null = null

    const triggerRefresh = () => {
      if (scheduledRefresh) {
        clearTimeout(scheduledRefresh)
      }

      scheduledRefresh = setTimeout(() => {
        void refreshRef.current()
      }, 180)
    }

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        void refreshRef.current()
      }
    }

    const channel = subscribedTables.reduce(
      (currentChannel, table) =>
        currentChannel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => {
            triggerRefresh()
          },
        ),
      supabase.channel(`live-sync:${tableKey}`),
    )

    channel.subscribe((status) => {
      setIsLive(status === 'SUBSCRIBED')
    })

    const pollId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshRef.current()
      }
    }, pollIntervalMs)

    window.addEventListener('focus', handleVisibilityRefresh)
    document.addEventListener('visibilitychange', handleVisibilityRefresh)

    return () => {
      if (scheduledRefresh) {
        clearTimeout(scheduledRefresh)
      }

      window.clearInterval(pollId)
      window.removeEventListener('focus', handleVisibilityRefresh)
      document.removeEventListener('visibilitychange', handleVisibilityRefresh)
      void supabase.removeChannel(channel)
    }
  }, [pollIntervalMs, tableKey])

  return { isLive }
}
