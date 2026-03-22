import { startTransition, useCallback, useEffect, useState } from 'react'

export function useAsyncData<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await loader()
      startTransition(() => {
        setData(result)
        setIsLoading(false)
      })
    } catch (caughtError) {
      startTransition(() => {
        setError(caughtError instanceof Error ? caughtError.message : 'Ocorreu um erro inesperado.')
        setIsLoading(false)
      })
    }
  }, [loader])

  useEffect(() => {
    void load()
  }, [load])

  return {
    data,
    error,
    isLoading,
    reload: load,
  }
}
