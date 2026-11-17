import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Download, Globe, MoreVertical, Share, Smartphone } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import { Button } from '@/components/ui'
import {
  isIosSafari,
  isStandaloneDisplay,
  markInstallUnlocked,
  shouldForceInstall,
} from '@/lib/pwa'
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  promptInstall,
  subscribeInstallPrompt,
} from '@/lib/pwaInstall'

/**
 * No telemóvel (browser), bloqueia a app até o utilizador instalar a PWA.
 */
export default function InstallGate({ children }) {
  const [blocked, setBlocked] = useState(() => shouldForceInstall())
  const [canNativePrompt, setCanNativePrompt] = useState(() => Boolean(getDeferredInstallPrompt()))
  const [installing, setInstalling] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [message, setMessage] = useState('')
  const [stepHint, setStepHint] = useState('')
  const ios = isIosSafari()

  const recheck = useCallback(() => {
    if (isStandaloneDisplay()) {
      markInstallUnlocked()
      setBlocked(false)
      return true
    }
    setBlocked(shouldForceInstall())
    return false
  }, [])

  useEffect(() => {
    recheck()
    const unsub = subscribeInstallPrompt((event) => {
      setCanNativePrompt(Boolean(event))
    })

    function onInstalled() {
      markInstallUnlocked()
      clearDeferredInstallPrompt()
      setBlocked(false)
      setMessage('Aplicação instalada com sucesso.')
    }

    window.addEventListener('appinstalled', onInstalled)
    const mq = window.matchMedia?.('(display-mode: standalone)')
    mq?.addEventListener?.('change', recheck)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') recheck()
    })

    return () => {
      unsub()
      window.removeEventListener('appinstalled', onInstalled)
      mq?.removeEventListener?.('change', recheck)
    }
  }, [recheck])

  async function handleInstall() {
    setMessage('')
    setStepHint('')

    if (ios) {
      setShowManual(true)
      setStepHint('No iPhone use Partilhar → Adicionar ao Ecrã Principal.')
      return
    }

    setInstalling(true)
    try {
      const result = await promptInstall()
      if (result.ok) {
        markInstallUnlocked()
        setBlocked(false)
        return
      }
      // Sem beforeinstallprompt (comum em alguns browsers) → guiar instalação manual
      setShowManual(true)
      setMessage(
        result.reason === 'unavailable'
          ? 'O Chrome não mostrou o diálogo automático. Siga os passos abaixo para instalar.'
          : 'Instalação cancelada ou indisponível. Pode instalar pelo menu do browser.',
      )
    } finally {
      setInstalling(false)
    }
  }

  function handleVerifyInstall() {
    if (recheck()) {
      setMessage('Instalação confirmada. A abrir a aplicação…')
      return
    }
    setMessage('Ainda não detectámos a app instalada. Conclua os passos e abra pelo ícone do ecrã principal.')
  }

  function handleConfirmManualInstall() {
    // Utilizador seguiu os passos do menu do browser (quando o prompt nativo não existe)
    markInstallUnlocked()
    setBlocked(false)
  }

  if (!blocked) return children

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[90] select-none" aria-hidden>
        <div className="min-h-dvh bg-brand-950/40 backdrop-blur-[1px]" />
      </div>

      <div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-gradient-to-b from-brand-950/80 via-brand-950/70 to-brand-950/85 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-gate-title"
      >
        <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] bg-white shadow-2xl ring-1 ring-black/5">
          <div className="relative overflow-hidden bg-brand-950 px-6 pb-9 pt-8 text-center text-white">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-clay-500/25 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <BrandLogo
              src="/logo.png"
              alt="Katchipitasse Elavoko"
              className="relative mx-auto mb-4 max-w-[168px] bg-transparent"
              imgClassName="mx-auto max-h-14"
            />
            <p className="relative text-[11px] font-semibold uppercase tracking-[0.22em] text-clay-500">
              Aplicação móvel
            </p>
            <h1 id="install-gate-title" className="relative mt-2 font-display text-[1.65rem] leading-tight">
              Instale para continuar
            </h1>
            <p className="relative mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/75">
              No telemóvel a experiência é pela app instalada. Até instalar, o restante conteúdo permanece bloqueado.
            </p>
          </div>

          <div className="space-y-4 px-5 py-5">
            {!showManual && !ios ? (
              <div className="rounded-2xl bg-sand-100/90 px-4 py-3 text-sm text-ink-700">
                {canNativePrompt ? (
                  <p>
                    Toque em <strong>Instalar agora</strong> e confirme no diálogo do sistema.
                  </p>
                ) : (
                  <p>
                    Prepare a instalação: toque em <strong>Instalar agora</strong>. Se o diálogo não abrir, mostramos os
                    passos manuais do Chrome.
                  </p>
                )}
              </div>
            ) : null}

            {(showManual || ios) && (
              <ol className="space-y-3">
                {ios ? (
                  <>
                    <ManualStep icon={Share} title="1. Partilhar" text="No Safari, toque no ícone Partilhar." />
                    <ManualStep
                      icon={Smartphone}
                      title="2. Ecrã principal"
                      text="Escolha “Adicionar ao Ecrã Principal” e confirme."
                    />
                    <ManualStep
                      icon={CheckCircle2}
                      title="3. Abrir a app"
                      text="Abra pelo novo ícone e toque em “Já instalei — verificar”."
                    />
                  </>
                ) : (
                  <>
                    <ManualStep
                      icon={MoreVertical}
                      title="1. Menu do Chrome"
                      text="Toque nos três pontos (⋮) no canto superior direito."
                    />
                    <ManualStep
                      icon={Download}
                      title="2. Instalar aplicação"
                      text="Escolha “Instalar aplicação” ou “Adicionar à ecrã principal”."
                    />
                    <ManualStep
                      icon={Globe}
                      title="3. Confirmar"
                      text="Confirme a instalação e abra a app pelo ícone, ou toque em “Concluí a instalação”."
                    />
                  </>
                )}
              </ol>
            )}

            {stepHint ? <p className="text-xs font-medium text-clay-600">{stepHint}</p> : null}
            {message ? (
              <p className="rounded-2xl border border-clay-500/20 bg-clay-500/5 px-3 py-2.5 text-xs text-ink-700">
                {message}
              </p>
            ) : null}

            <div className="flex flex-col gap-2 pt-1">
              {!ios && !showManual ? (
                <Button onClick={handleInstall} disabled={installing} className="w-full !py-3 text-base">
                  <Download size={18} /> {installing ? 'A abrir instalador…' : 'Instalar agora'}
                </Button>
              ) : null}

              {ios ? (
                <Button onClick={handleInstall} className="w-full !py-3 text-base">
                  <Share size={18} /> Ver passos no iPhone
                </Button>
              ) : null}

              {showManual && !ios ? (
                <Button onClick={handleConfirmManualInstall} className="w-full !py-3 text-base">
                  <CheckCircle2 size={18} /> Concluí a instalação
                </Button>
              ) : null}

              <Button variant="secondary" onClick={handleVerifyInstall} className="w-full">
                Já instalei — verificar
              </Button>

              {!showManual && !ios ? (
                <button
                  type="button"
                  className="pt-1 text-center text-xs font-medium text-ink-500 underline-offset-2 hover:text-brand-950 hover:underline"
                  onClick={() => setShowManual(true)}
                >
                  O botão não abriu o instalador? Ver passos manuais
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function ManualStep({ icon: Icon, title, text }) {
  return (
    <li className="flex gap-3 rounded-2xl bg-sand-100/80 p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clay-500/10 text-clay-600">
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-brand-950">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-ink-600">{text}</span>
      </span>
    </li>
  )
}
