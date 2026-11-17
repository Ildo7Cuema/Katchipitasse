import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Download, Globe, MoreVertical, Share, Smartphone } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import { Button } from '@/components/ui'
import {
  isAndroidDevice,
  isIosDevice,
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
 * No telemóvel (browser), bloqueia a app até o utilizador abrir pelo ícone instalado
 * (standalone). iOS nunca tem prompt nativo — só “Adicionar ao Ecrã Principal”.
 */
export default function InstallGate({ children }) {
  const [blocked, setBlocked] = useState(() => shouldForceInstall())
  const [canNativePrompt, setCanNativePrompt] = useState(() => Boolean(getDeferredInstallPrompt()))
  const [installing, setInstalling] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [pendingOpenFromIcon, setPendingOpenFromIcon] = useState(false)
  const [message, setMessage] = useState('')
  const [stepHint, setStepHint] = useState('')
  const ios = isIosDevice()
  const iosSafari = isIosSafari()
  const android = isAndroidDevice()

  const recheck = useCallback(() => {
    if (isStandaloneDisplay()) {
      markInstallUnlocked()
      setBlocked(false)
      setPendingOpenFromIcon(false)
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
      clearDeferredInstallPrompt()
      setCanNativePrompt(false)
      setPendingOpenFromIcon(true)
      setShowManual(false)
      setMessage(
        'Instalação concluída. Feche este separador e abra a app pelo ícone “Katchipitasse” na ecrã principal ou na lista de aplicações.',
      )
      // Não desbloqueia o browser — o utilizador deve abrir pelo ícone (standalone).
      if (isStandaloneDisplay()) {
        markInstallUnlocked()
        setBlocked(false)
        setPendingOpenFromIcon(false)
      }
    }

    window.addEventListener('appinstalled', onInstalled)
    const mq = window.matchMedia?.('(display-mode: standalone)')
    mq?.addEventListener?.('change', recheck)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') recheck()
    })
    window.addEventListener('pageshow', recheck)
    window.addEventListener('focus', recheck)

    return () => {
      unsub()
      window.removeEventListener('appinstalled', onInstalled)
      mq?.removeEventListener?.('change', recheck)
      window.removeEventListener('pageshow', recheck)
      window.removeEventListener('focus', recheck)
    }
  }, [recheck])

  async function handleInstall() {
    setMessage('')
    setStepHint('')

    if (ios) {
      setShowManual(true)
      setStepHint(
        iosSafari
          ? 'No iPhone o Safari não instala sozinho: use Partilhar → Adicionar ao Ecrã Principal.'
          : 'Neste browser no iPhone use o menu → Adicionar ao Ecrã de início (ou abra no Safari).',
      )
      return
    }

    setInstalling(true)
    try {
      const result = await promptInstall()
      if (result.ok) {
        setPendingOpenFromIcon(true)
        setMessage(
          'Confirme no diálogo do sistema. Depois procure o ícone na ecrã principal ou na gaveta de apps e abra por lá — este separador do browser continua bloqueado.',
        )
        // Se o Chrome abrir já em standalone, o recheck desbloqueia.
        window.setTimeout(() => recheck(), 800)
        return
      }
      setShowManual(true)
      setMessage(
        result.reason === 'unavailable'
          ? 'O browser não mostrou o diálogo automático. Siga os passos abaixo para criar o ícone.'
          : 'Instalação cancelada. Pode tentar outra vez ou seguir os passos manuais.',
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
    setPendingOpenFromIcon(true)
    setMessage(
      ios
        ? 'Ainda não detectámos o ícone. Em Safari: Partilhar → Adicionar ao Ecrã Principal → depois abra pelo ícone (não pelo Safari).'
        : 'Ainda não detectámos a app instalada. Conclua a instalação e abra pelo ícone na ecrã principal ou na lista de apps — não volte a este separador do browser.',
    )
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
              {pendingOpenFromIcon ? 'Abra pelo ícone' : 'Instale para continuar'}
            </h1>
            <p className="relative mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/75">
              {pendingOpenFromIcon
                ? 'A app só fica disponível quando a abrir pelo ícone no telemóvel — não pelo browser.'
                : 'No telemóvel a experiência é pela app instalada. Até criar o ícone e abrir por ele, o conteúdo permanece bloqueado.'}
            </p>
          </div>

          <div className="space-y-4 px-5 py-5">
            {!showManual && !ios && !pendingOpenFromIcon ? (
              <div className="rounded-2xl bg-sand-100/90 px-4 py-3 text-sm text-ink-700">
                {canNativePrompt ? (
                  <p>
                    Toque em <strong>Instalar agora</strong>, confirme no sistema e depois abra pelo novo ícone.
                  </p>
                ) : (
                  <p>
                    Toque em <strong>Instalar agora</strong>. Se o diálogo não abrir, mostramos os passos manuais do
                    Android.
                  </p>
                )}
              </div>
            ) : null}

            {(showManual || ios) && (
              <ol className="space-y-3">
                {ios ? (
                  iosSafari ? (
                    <>
                      <ManualStep icon={Share} title="1. Partilhar" text="No Safari, toque no ícone Partilhar (□↑) na barra inferior." />
                      <ManualStep
                        icon={Smartphone}
                        title="2. Ecrã principal"
                        text="Desça a lista e toque em “Adicionar ao Ecrã Principal”. Confirme com “Adicionar”."
                      />
                      <ManualStep
                        icon={CheckCircle2}
                        title="3. Abrir pelo ícone"
                        text="Saia do Safari e abra “Katchipitasse” no ecrã principal. Depois toque em “Já instalei — verificar”."
                      />
                    </>
                  ) : (
                    <>
                      <ManualStep
                        icon={MoreVertical}
                        title="1. Menu do browser"
                        text="Toque no menu (⋮ ou …) e escolha “Adicionar ao Ecrã de início” / “Add to Home Screen”."
                      />
                      <ManualStep
                        icon={Globe}
                        title="2. Ou use o Safari"
                        text="Se a opção não existir, abra este site no Safari e use Partilhar → Adicionar ao Ecrã Principal."
                      />
                      <ManualStep
                        icon={CheckCircle2}
                        title="3. Abrir pelo ícone"
                        text="Abra pelo novo ícone no ecrã principal (não pelo browser) e toque em “Já instalei — verificar”."
                      />
                    </>
                  )
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
                      text="Escolha “Instalar aplicação” ou “Adicionar à ecrã principal” e confirme."
                    />
                    <ManualStep
                      icon={Smartphone}
                      title="3. Abrir pelo ícone"
                      text="Feche o Chrome e abra “Katchipitasse” na ecrã principal ou na lista de apps. Depois verifique aqui."
                    />
                  </>
                )}
              </ol>
            )}

            {pendingOpenFromIcon && !showManual && !ios ? (
              <div className="rounded-2xl border border-clay-500/20 bg-clay-500/5 px-4 py-3 text-sm text-ink-700">
                <p className="font-semibold text-brand-950">Onde está o ícone?</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-600">
                  {android
                    ? 'No Android pode aparecer na ecrã principal ou só na gaveta de aplicações. Procure “Katchipitasse” e abra — não continue neste separador.'
                    : 'Procure “Katchipitasse” no telemóvel e abra pelo ícone instalado.'}
                </p>
              </div>
            ) : null}

            {stepHint ? <p className="text-xs font-medium text-clay-600">{stepHint}</p> : null}
            {message ? (
              <p className="rounded-2xl border border-clay-500/20 bg-clay-500/5 px-3 py-2.5 text-xs text-ink-700">
                {message}
              </p>
            ) : null}

            <div className="flex flex-col gap-2 pt-1">
              {!ios && !showManual && !pendingOpenFromIcon ? (
                <Button onClick={handleInstall} disabled={installing} className="w-full !py-3 text-base">
                  <Download size={18} /> {installing ? 'A abrir instalador…' : 'Instalar agora'}
                </Button>
              ) : null}

              {ios ? (
                <Button onClick={handleInstall} className="w-full !py-3 text-base">
                  <Share size={18} /> {iosSafari ? 'Ver passos no iPhone' : 'Ver passos neste iPhone'}
                </Button>
              ) : null}

              {pendingOpenFromIcon && !ios ? (
                <Button onClick={handleInstall} disabled={installing} variant="secondary" className="w-full">
                  <Download size={18} /> Tentar instalar outra vez
                </Button>
              ) : null}

              <Button variant={pendingOpenFromIcon || ios ? 'primary' : 'secondary'} onClick={handleVerifyInstall} className="w-full">
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
