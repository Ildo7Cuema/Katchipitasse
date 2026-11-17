import { useCallback, useEffect, useState } from 'react'
import { Download, Share, Smartphone } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import { Button } from '@/components/ui'
import {
  isIosSafari,
  isStandaloneDisplay,
  markInstallUnlocked,
  shouldForceInstall,
} from '@/lib/pwa'

/**
 * No telemóvel (browser), bloqueia a app até o utilizador instalar a PWA.
 * Já instalada / Capacitor nativo / desktop → não mostra.
 */
export default function InstallGate({ children }) {
  const [blocked, setBlocked] = useState(() => shouldForceInstall())
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installing, setInstalling] = useState(false)
  const [message, setMessage] = useState('')
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

    function onBeforeInstall(e) {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    function onInstalled() {
      markInstallUnlocked()
      setBlocked(false)
      setMessage('Aplicação instalada com sucesso.')
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    const mq = window.matchMedia?.('(display-mode: standalone)')
    const onDisplayChange = () => recheck()
    mq?.addEventListener?.('change', onDisplayChange)

    const onVisible = () => {
      if (document.visibilityState === 'visible') recheck()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      mq?.removeEventListener?.('change', onDisplayChange)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [recheck])

  async function handleInstall() {
    setMessage('')
    if (ios) {
      setMessage('No iPhone: toque em Partilhar → “Adicionar ao Ecrã Principal”. Depois abra o ícone da app.')
      return
    }

    if (!deferredPrompt) {
      setMessage(
        'O browser ainda não disponibilizou o instalador. Use o menu do Chrome → “Instalar aplicação” / “Adicionar ao ecrã principal”.',
      )
      return
    }

    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      if (choice?.outcome === 'accepted') {
        markInstallUnlocked()
        setBlocked(false)
      } else {
        setMessage('É necessário instalar a aplicação para continuar a usar no telemóvel.')
      }
    } catch {
      setMessage('Não foi possível abrir o instalador. Tente pelo menu do browser.')
    } finally {
      setInstalling(false)
    }
  }

  function handleVerifyInstall() {
    if (recheck()) return
    setMessage('Ainda não detectámos a instalação. Abra a app pelo ícone no ecrã principal.')
  }

  if (!blocked) return children

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[90] select-none blur-[2px]" aria-hidden>
        <div className="min-h-dvh bg-sand-50 opacity-40">{children}</div>
      </div>

      <div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-brand-950/75 p-4 sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-gate-title"
      >
        <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
          <div className="bg-brand-950 px-6 pb-8 pt-7 text-center text-white">
            <BrandLogo
              src="/logo.png"
              alt="Katchipitasse Elavoko"
              className="mx-auto mb-4 max-w-[180px] bg-transparent"
              imgClassName="mx-auto max-h-16"
            />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay-500">Instalação</p>
            <h1 id="install-gate-title" className="mt-2 font-display text-2xl">
              Instale a aplicação
            </h1>
            <p className="mt-2 text-sm text-white/75">
              Para usar no telemóvel, instale a Katchipitasse Elavoko no ecrã principal. O acesso pelo browser fica
              bloqueado até instalar.
            </p>
          </div>

          <div className="space-y-4 px-6 py-5">
            {ios ? (
              <ol className="space-y-3 text-sm text-ink-700">
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-clay-500/10 text-clay-600">
                    <Share size={16} />
                  </span>
                  <span>
                    Toque em <strong>Partilhar</strong> (Safari).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-clay-500/10 text-clay-600">
                    <Smartphone size={16} />
                  </span>
                  <span>
                    Escolha <strong>Adicionar ao Ecrã Principal</strong> e confirme.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-clay-500/10 text-clay-600">
                    <Download size={16} />
                  </span>
                  <span>Abra a app pelo novo ícone e volte a esta página se necessário.</span>
                </li>
              </ol>
            ) : (
              <p className="text-sm text-ink-600">
                Toque em <strong>Instalar agora</strong> e confirme no diálogo do sistema. Sem instalação, as outras
                áreas permanecem bloqueadas.
              </p>
            )}

            {message ? <p className="rounded-2xl bg-sand-100 px-3 py-2 text-xs text-ink-700">{message}</p> : null}

            <div className="flex flex-col gap-2">
              {ios ? (
                <>
                  <Button onClick={handleInstall} className="w-full">
                    <Share size={16} /> Ver instruções
                  </Button>
                  <Button variant="secondary" onClick={handleVerifyInstall} className="w-full">
                    Já instalei — verificar
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleInstall} disabled={installing} className="w-full">
                    <Download size={16} /> {installing ? 'A abrir instalador…' : 'Instalar agora'}
                  </Button>
                  <Button variant="secondary" onClick={handleVerifyInstall} className="w-full">
                    Já instalei — verificar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
