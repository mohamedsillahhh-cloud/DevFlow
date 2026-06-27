import { useState } from 'react'
import { FullScreenLoader } from '../components/ui/full-screen-loader'
import { Panel } from '../components/ui/panel'
import { useAsyncData } from '../hooks/use-async-data'
import { useRealtimeSync } from '../hooks/use-realtime-sync'
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CURRENCY_OPTIONS,
  INPUT_BASE,
  formatCurrency,
} from '../lib/format'
import { fetchConfiguracoes, saveConfiguracoes } from '../lib/supabase/supabase-data'

export function ConfigPage() {
  const { data, error, isLoading, reload } = useAsyncData(fetchConfiguracoes)
  useRealtimeSync(['configuracoes'], reload, { pollIntervalMs: 15000 })
  const [form, setForm] = useState({
    alerta_conta_dias: '3',
    alerta_prazo_dias: '7',
    caminho_backup: '',
    moeda: 'CVE',
    nome_usuario: '',
    tema: 'light',
    ultimo_backup: 'nunca',
  })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [prevConfigData, setPrevConfigData] = useState(data)
  if (data && data !== prevConfigData) {
    setPrevConfigData(data)
    setForm({
      alerta_conta_dias: data.alerta_conta_dias ?? '3',
      alerta_prazo_dias: data.alerta_prazo_dias ?? '7',
      caminho_backup: data.caminho_backup ?? '',
      moeda: data.moeda ?? 'CVE',
      nome_usuario: data.nome_usuario ?? '',
      tema: data.tema ?? 'light',
      ultimo_backup: data.ultimo_backup ?? 'nunca',
    })
  }

  if (isLoading && !data) {
    return <FullScreenLoader label="A carregar as configuracoes..." />
  }

  if (error || !data) {
    return (
      <Panel
        actions={
          <button className={BUTTON_SECONDARY} onClick={() => void reload()} type="button">
            Tentar novamente
          </button>
        }
        description={error ?? 'Nao foi possivel carregar as configuracoes.'}
        title="Falha ao carregar"
      />
    )
  }

  async function handleSave() {
    setFeedback(null)
    setSaveError(null)
    setIsSaving(true)

    try {
      await saveConfiguracoes(form)
      // Sincronizar tema com localStorage e aplicar ao documento
      window.localStorage.setItem('app-theme-mode', form.tema)
      document.documentElement.setAttribute('data-theme', form.tema)
      setFeedback('Configuracoes guardadas com sucesso.')
      await reload()
    } catch (caughtError) {
      setSaveError(
        caughtError instanceof Error ? caughtError.message : 'Nao foi possivel guardar as configuracoes.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <Panel
        actions={
          <button className={BUTTON_PRIMARY} disabled={isSaving} onClick={() => void handleSave()} type="button">
            Guardar configuracoes
          </button>
        }
        description="Parametros pessoais guardados na tabela configuracoes."
        title="Preferencias"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-label)]">Nome</span>
            <input
              className={INPUT_BASE}
              onChange={(event) => setForm((current) => ({ ...current, nome_usuario: event.target.value }))}
              type="text"
              value={form.nome_usuario}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-label)]">Moeda</span>
            <select
              className={INPUT_BASE}
              onChange={(event) => setForm((current) => ({ ...current, moeda: event.target.value }))}
              value={form.moeda}
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-label)]">Tema</span>
            <select
              className={INPUT_BASE}
              onChange={(event) => setForm((current) => ({ ...current, tema: event.target.value }))}
              value={form.tema}
            >
              <option value="light">Branco</option>
              <option value="dark">Preto</option>
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-label)]">Pasta de backup</span>
            <input
              className={INPUT_BASE}
              onChange={(event) => setForm((current) => ({ ...current, caminho_backup: event.target.value }))}
              type="text"
              value={form.caminho_backup}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-label)]">Dias para prazo</span>
            <input
              className={INPUT_BASE}
              onChange={(event) =>
                setForm((current) => ({ ...current, alerta_prazo_dias: event.target.value }))
              }
              type="number"
              value={form.alerta_prazo_dias}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-label)]">Dias para contas</span>
            <input
              className={INPUT_BASE}
              onChange={(event) =>
                setForm((current) => ({ ...current, alerta_conta_dias: event.target.value }))
              }
              type="number"
              value={form.alerta_conta_dias}
            />
          </label>
        </div>

        {feedback ? <p className="mt-4 text-sm text-[var(--color-success)]">{feedback}</p> : null}
        {saveError ? <p className="mt-4 text-sm text-[var(--color-danger)]">{saveError}</p> : null}
      </Panel>

      <div className="space-y-6">
        <Panel description="Resumo rapido do ambiente configurado." title="Preview">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-label)]">Formato monetario atual</p>
            <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
              {formatCurrency(0, form.moeda)}
            </p>
            <div className="mt-6 space-y-2 text-sm text-[var(--text-muted)]">
              <p>Utilizador: {form.nome_usuario || 'nao definido'}</p>
              <p>Alerta de prazo: {form.alerta_prazo_dias || '0'} dia(s)</p>
              <p>Alerta de contas: {form.alerta_conta_dias || '0'} dia(s)</p>
              <p>Ultimo backup: {form.ultimo_backup || 'nunca'}</p>
            </div>
          </div>
        </Panel>

      </div>
    </div>
  )
}
