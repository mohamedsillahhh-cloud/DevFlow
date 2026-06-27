import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import type { Observable } from 'dexie'
import { observeQuery } from '../lib/data'

export function useAsyncData<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller

    setIsLoading(true)
    setError(null)

    try {
      const result = await loader()
      if (signal.aborted) return
      startTransition(() => {
        setData(result)
        setIsLoading(false)
      })
    } catch (caughtError) {
      if (signal.aborted) return
      startTransition(() => {
        setError(caughtError instanceof Error ? caughtError.message : 'Ocorreu um erro inesperado.')
        setIsLoading(false)
      })
    }
  }, [loader])

  useEffect(() => {
    void load()
    return () => {
      abortRef.current?.abort()
    }
  }, [load])

  return {
    data,
    error,
    isLoading,
    reload: load,
  }
}

export function useLiveQuery<T>(queryFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const observable: Observable<T> = observeQuery(queryFn)
    const subscription = observable.subscribe({
      next: (result) => {
        startTransition(() => {
          setData(result)
          setIsLoading(false)
        })
      },
      error: (err) => {
        startTransition(() => {
          setError(err instanceof Error ? err.message : 'Erro de consulta.')
          setIsLoading(false)
        })
      },
    })
    return () => subscription.unsubscribe()
  }, [queryFn])

  const reload = useCallback(() => {
    setIsLoading(true)
    setError(null)
    queryFn()
      .then((result) => {
        startTransition(() => {
          setData(result)
          setIsLoading(false)
        })
      })
      .catch((err) => {
        startTransition(() => {
          setError(err instanceof Error ? err.message : 'Erro de consulta.')
          setIsLoading(false)
        })
      })
  }, [queryFn])

  return { data, error, isLoading, reload }
}
