import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase/supabase'

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

    const abortController = new AbortController()
    const { signal } = abortController

    let scheduledRefresh: ReturnType<typeof setTimeout> | null = null

    const triggerRefresh = () => {
      if (scheduledRefresh) {
        clearTimeout(scheduledRefresh)
      }

      scheduledRefresh = setTimeout(() => {
        if (!signal.aborted) {
          void refreshRef.current()
        }
      }, 180)
    }

    const safeRefresh = () => {
      if (!signal.aborted) {
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
      if (!signal.aborted) {
        setIsLive(status === 'SUBSCRIBED')
      }
    })

    const pollId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        safeRefresh()
      }
    }, pollIntervalMs)

    window.addEventListener('focus', safeRefresh)
    document.addEventListener('visibilitychange', safeRefresh)

    return () => {
      abortController.abort()
      if (scheduledRefresh) {
        clearTimeout(scheduledRefresh)
      }

      window.clearInterval(pollId)
      window.removeEventListener('focus', safeRefresh)
      document.removeEventListener('visibilitychange', safeRefresh)
      void supabase.removeChannel(channel)
    }
  }, [pollIntervalMs, tableKey])

  return { isLive }
}
