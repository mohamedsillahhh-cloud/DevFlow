import { useEffect, useState } from 'react'
import { FullScreenLoader } from '../components/full-screen-loader'
import { Panel } from '../components/panel'
import { useAuth } from '../hooks/use-auth'
import { useAsyncData } from '../hooks/use-async-data'
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CURRENCY_OPTIONS,
  INPUT_BASE,
  formatCurrency,
} from '../lib/format'
import { fetchConfiguracoes, saveConfiguracoes } from '../lib/supabase-data'

export function ConfigPage() {
  const { data, error, isLoading, reload } = useAsyncData(fetchConfiguracoes)
  const { updatePassword, user } = useAuth()
  const [form, setForm] = useState({
    alerta_conta_dias: '3',
    alerta_prazo_dias: '7',
    caminho_backup: '',
    moeda: 'CVE',
    nome_usuario: '',
    tema: 'preto',
    ultimo_backup: 'nunca',
  })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    confirmPassword: '',
    newPassword: '',
  })
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  useEffect(() => {
    if (!data) {
      return
    }

    setForm({
      alerta_conta_dias: data.alerta_conta_dias ?? '3',
      alerta_prazo_dias: data.alerta_prazo_dias ?? '7',
      caminho_backup: data.caminho_backup ?? '',
      moeda: data.moeda ?? 'CVE',
      nome_usuario: data.nome_usuario ?? '',
      tema: data.tema ?? 'preto',
      ultimo_backup: data.ultimo_backup ?? 'nunca',
    })
  }, [data])

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

  async function handlePasswordUpdate() {
    setPasswordFeedback(null)
    setPasswordError(null)

    const normalizedPassword = passwordForm.newPassword.trim()
    const normalizedConfirmPassword = passwordForm.confirmPassword.trim()

    if (normalizedPassword.length < 8) {
      setPasswordError('A nova senha precisa de pelo menos 8 caracteres.')
      return
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      setPasswordError('A confirmacao da senha nao coincide.')
      return
    }

    setIsUpdatingPassword(true)

    try {
      await updatePassword(normalizedPassword)
      setPasswordForm({
        confirmPassword: '',
        newPassword: '',
      })
      setPasswordFeedback('Senha atualizada com sucesso.')
    } catch (caughtError) {
      setPasswordError(
        caughtError instanceof Error ? caughtError.message : 'Nao foi possivel atualizar a senha.',
      )
    } finally {
      setIsUpdatingPassword(false)
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
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Nome</span>
            <input
              className={INPUT_BASE}
              onChange={(event) => setForm((current) => ({ ...current, nome_usuario: event.target.value }))}
              type="text"
              value={form.nome_usuario}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Moeda</span>
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

          <label className="space-y-2 md:col-span-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Pasta de backup</span>
            <input
              className={INPUT_BASE}
              onChange={(event) => setForm((current) => ({ ...current, caminho_backup: event.target.value }))}
              type="text"
              value={form.caminho_backup}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Dias para prazo</span>
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
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Dias para contas</span>
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
          <div className="rounded-2xl border border-[#171717] bg-[#090909] p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Formato monetario atual</p>
            <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#f0f0f0]">
              {formatCurrency(0, form.moeda)}
            </p>
            <div className="mt-6 space-y-2 text-sm text-[#888888]">
              <p>Utilizador: {form.nome_usuario || 'nao definido'}</p>
              <p>E-mail da conta: {user?.email || 'nao autenticado'}</p>
              <p>Alerta de prazo: {form.alerta_prazo_dias || '0'} dia(s)</p>
              <p>Alerta de contas: {form.alerta_conta_dias || '0'} dia(s)</p>
              <p>Ultimo backup: {form.ultimo_backup || 'nunca'}</p>
            </div>
          </div>
        </Panel>

        <Panel
          actions={
            <button
              className={BUTTON_PRIMARY}
              disabled={isUpdatingPassword}
              onClick={() => void handlePasswordUpdate()}
              type="button"
            >
              Atualizar senha
            </button>
          }
          description="A troca de senha usa a sessao atual do Supabase e mantem o acesso na conta autenticada."
          title="Seguranca"
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              Conta autenticada: <span className="text-[var(--text-primary)]">{user?.email || '-'}</span>
            </div>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Nova senha</span>
              <input
                className={INPUT_BASE}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                }
                placeholder="Minimo de 8 caracteres"
                type="password"
                value={passwordForm.newPassword}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#666666]">Confirmar nova senha</span>
              <input
                className={INPUT_BASE}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                placeholder="Repete a nova senha"
                type="password"
                value={passwordForm.confirmPassword}
              />
            </label>

            {passwordFeedback ? (
              <p className="text-sm text-[var(--color-success)]">{passwordFeedback}</p>
            ) : null}
            {passwordError ? <p className="text-sm text-[var(--color-danger)]">{passwordError}</p> : null}
          </div>
        </Panel>
      </div>
    </div>
  )
}
