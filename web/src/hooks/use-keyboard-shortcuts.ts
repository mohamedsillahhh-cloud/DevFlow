import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

type ShortcutMap = Record<string, () => void>

export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase()
      const hasModifier = event.metaKey || event.ctrlKey
      const tag = (event.target as HTMLElement)?.tagName

      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      for (const [pattern, handler] of Object.entries(shortcuts)) {
        const [mod, k] = pattern.includes('+') ? pattern.split('+') : ['', pattern]

        if (mod === 'g' && hasModifier) continue

        const modMatch = mod === 'g' ? hasModifier : (!mod || (mod === 'meta' && hasModifier))
        if (modMatch && key === k) {
          event.preventDefault()
          handler()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])
}

export function useNavigationShortcuts() {
  const navigate = useNavigate()

  useKeyboardShortcuts({
    'g+d': () => navigate('/dashboard'),
    'g+p': () => navigate('/projetos'),
    'g+f': () => navigate('/financas'),
    'g+i': () => navigate('/investimentos'),
    'g+t': () => navigate('/timer'),
    'g+,': () => navigate('/config'),
  })
}
