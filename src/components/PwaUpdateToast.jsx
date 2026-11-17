import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui'
import { isNativeApp } from '@/lib/pwa'

/**
 * Avisa o utilizador quando existe uma nova versão da app (service worker).
 */
export default function PwaUpdateToast() {
  const [dismissed, setDismissed] = useState(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return
      // Verificar actualizações periodicamente
      window.setInterval(() => {
        void registration.update()
      }, 60_000)
    },
    onRegisterError(error) {
      console.warn('PWA register error', error)
    },
  })

  useEffect(() => {
    if (!needRefresh || isNativeApp()) return
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'granted') {
      try {
        const n = new Notification('Katchipitasse Elavoko', {
          body: 'Há uma nova actualização disponível. Toque para actualizar.',
          icon: '/pwa/icon-192.png',
          tag: 'ke-pwa-update',
        })
        n.onclick = () => {
          window.focus()
          void updateServiceWorker(true)
          n.close()
        }
      } catch {
        /* ignore */
      }
    } else if (Notification.permission === 'default') {
      void Notification.requestPermission()
    }
  }, [needRefresh, updateServiceWorker])

  if (isNativeApp() || !needRefresh || dismissed) return null

  return (
    <div className="fixed inset-x-3 bottom-[5.5rem] z-[80] mx-auto max-w-md animate-fade-up md:bottom-6">
      <div className="flex items-start gap-3 rounded-2xl bg-brand-950 p-4 text-white shadow-xl ring-1 ring-white/10">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clay-500/20 text-clay-500">
          <RefreshCw size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Nova actualização</p>
          <p className="mt-0.5 text-xs text-white/70">Há uma versão nova da aplicação. Actualize para continuar.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              className="!py-2"
              onClick={() => {
                void updateServiceWorker(true)
              }}
            >
              Actualizar agora
            </Button>
            <Button
              variant="outlineLight"
              className="!py-2"
              onClick={() => {
                setDismissed(true)
                setNeedRefresh(false)
              }}
            >
              Mais tarde
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
