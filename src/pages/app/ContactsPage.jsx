import { Clock3, ExternalLink, Mail, MapPin, Phone, Share2 } from 'lucide-react'
import PageCover from '@/components/PageCover'
import { Button } from '@/components/ui'
import { useCompany } from '@/contexts/CompanyContext'
import { useToast } from '@/contexts/ToastContext'
import { buildShareUrl, shareContent } from '@/lib/share'

function ContactRow({ icon: Icon, title, children, href }) {
  const content = (
    <div className="flex items-start gap-3 rounded-2xl bg-sand-100/80 p-3 transition hover:bg-sand-100">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-clay-500/10 text-clay-600">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-950">{title}</p>
        <div className="mt-0.5 text-sm text-ink-500">{children}</div>
      </div>
    </div>
  )
  if (!href) return content
  return (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
      {content}
    </a>
  )
}

export default function ContactsPage() {
  const { settings } = useCompany()
  const toast = useToast()

  async function handleShare() {
    const result = await shareContent({
      title: settings.company_name,
      text: `Contactos · ${settings.address} · ${settings.phone}`,
      url: buildShareUrl('/contactos'),
    })
    if (result.fallback === 'clipboard') toast.success('Ligação copiada')
    else if (result.ok) toast.success('Partilha iniciada')
  }

  return (
    <div className="animate-fade-up space-y-5">
      <PageCover
        image={settings.contacts_cover_url || null}
        eyebrow="Fale connosco"
        title="Contactos"
        description="Estamos prontos para o receber."
        actions={
          <Button variant="outlineLight" onClick={handleShare} aria-label="Partilhar contactos">
            <Share2 size={16} />
          </Button>
        }
      />

      <div className="space-y-2 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-950/5">
        <ContactRow icon={Phone} title="Telefone" href={`tel:${settings.phone}`}>
          {settings.phone}
        </ContactRow>
        {settings.whatsapp ? (
          <ContactRow
            icon={Phone}
            title="WhatsApp"
            href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`}
          >
            {settings.whatsapp}
          </ContactRow>
        ) : null}
        <ContactRow icon={MapPin} title="Morada" href={settings.maps_url || undefined}>
          <p>{settings.address}</p>
          {settings.maps_url ? <p className="mt-1 text-clay-600">Abrir no Google Maps</p> : null}
        </ContactRow>
        <ContactRow icon={Clock3} title="Horário">
          {settings.opening_hours}
        </ContactRow>
        <ContactRow icon={Mail} title="E-mail" href={`mailto:${settings.email}`}>
          {settings.email}
        </ContactRow>
      </div>

      <div className="flex flex-wrap gap-3">
        {settings.facebook_url ? (
          <a href={settings.facebook_url} target="_blank" rel="noreferrer">
            <Button variant="secondary">
              <ExternalLink size={16} /> Facebook
            </Button>
          </a>
        ) : null}
        {settings.instagram_url ? (
          <a href={settings.instagram_url} target="_blank" rel="noreferrer">
            <Button variant="secondary">
              <ExternalLink size={16} /> Instagram
            </Button>
          </a>
        ) : null}
      </div>
    </div>
  )
}
