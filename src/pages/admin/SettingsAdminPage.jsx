import { useEffect, useState } from 'react'
import {
  Building2,
  Clock3,
  Globe,
  ImagePlus,
  Mail,
  MapPin,
  Phone,
  Settings2,
} from 'lucide-react'
import { AdminHero, FormActions, Panel } from '@/components/AdminUI'
import ImageUploadField from '@/components/ImageUploadField'
import { Button, Input, TextArea } from '@/components/ui'
import { useCompany } from '@/contexts/CompanyContext'
import { useToast } from '@/contexts/ToastContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import { updateCompanySettings, uploadImage } from '@/services/api'

const HERO_SLOT_META = [
  { label: 'Hero 1 — slide principal', defaultLabel: 'Destaque', defaultCaption: 'Katchipitasse Elavoko' },
  { label: 'Hero 2 — slide secundário', defaultLabel: 'Experiência', defaultCaption: 'Restaurante & Hospedaria' },
  { label: 'Hero 3 — slide opcional', defaultLabel: 'Ambiente', defaultCaption: 'Bem-vindo' },
]

function toHeroSlots(raw) {
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(raw)
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        })()
      : []
  return [0, 1, 2].map((i) => {
    const item = list[i]
    if (!item?.url) return null
    return {
      url: item.url,
      label: item.label || HERO_SLOT_META[i].defaultLabel,
      caption: item.caption || HERO_SLOT_META[i].defaultCaption,
    }
  })
}

export default function SettingsAdminPage() {
  const { settings, setSettings } = useCompany()
  const toast = useToast()
  const [form, setForm] = useState(settings)
  const [heroSlots, setHeroSlots] = useState([null, null, null])
  const [logoFile, setLogoFile] = useState(null)
  const [restaurantCoverFile, setRestaurantCoverFile] = useState(null)
  const [lodgingCoverFile, setLodgingCoverFile] = useState(null)
  const [contactsCoverFile, setContactsCoverFile] = useState(null)
  const [heroFiles, setHeroFiles] = useState([null, null, null])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(settings)
    setHeroSlots(toHeroSlots(settings.hero_images))
    setLogoFile(null)
    setRestaurantCoverFile(null)
    setLodgingCoverFile(null)
    setContactsCoverFile(null)
    setHeroFiles([null, null, null])
  }, [settings])

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!isSupabaseConfigured) return toast.error('Configure o Supabase')
    setSaving(true)
    try {
      let logoUrl = form.logo_url || '/logo.png'
      if (logoFile) logoUrl = await uploadImage('branding', logoFile)

      let restaurantCover = form.restaurant_cover_url || null
      if (restaurantCoverFile) restaurantCover = await uploadImage('branding', restaurantCoverFile)

      let lodgingCover = form.lodging_cover_url || null
      if (lodgingCoverFile) lodgingCover = await uploadImage('branding', lodgingCoverFile)

      let contactsCover = form.contacts_cover_url || null
      if (contactsCoverFile) contactsCover = await uploadImage('branding', contactsCoverFile)

      const nextHero = []
      for (let i = 0; i < 3; i += 1) {
        const existing = heroSlots[i]
        const file = heroFiles[i]
        if (file) {
          const url = await uploadImage('branding', file)
          nextHero.push({
            url,
            label: existing?.label || HERO_SLOT_META[i].defaultLabel,
            caption: existing?.caption || HERO_SLOT_META[i].defaultCaption,
          })
        } else if (existing?.url) {
          nextHero.push(existing)
        }
      }

      const payload = {
        company_name: form.company_name,
        tagline: form.tagline,
        description: form.description,
        logo_url: logoUrl || '/logo.png',
        phone: form.phone,
        whatsapp: form.whatsapp,
        email: form.email,
        address: form.address,
        maps_url: form.maps_url,
        opening_hours: form.opening_hours,
        facebook_url: form.facebook_url || null,
        instagram_url: form.instagram_url || null,
        privacy_policy_url: form.privacy_policy_url || null,
        restaurant_cover_url: restaurantCover || null,
        lodging_cover_url: lodgingCover || null,
        contacts_cover_url: contactsCover || null,
        hero_images: nextHero,
      }

      const data = await updateCompanySettings(payload)
      setSettings(data)
      toast.success('Páginas públicas actualizadas')
    } catch (err) {
      if (err.code === 'MEDIA_MIGRATION_REQUIRED' && err.partialData) {
        setSettings((prev) => ({ ...prev, ...err.partialData }))
        toast.error(err.message)
      } else {
        toast.error(err.message || 'Erro ao guardar. Execute a migration 010 se ainda não o fez.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <AdminHero
        tone="dark"
        eyebrow="Loja"
        title="Páginas públicas"
        description="Altere contactos, morada e imagens. Sem novos uploads, mantêm-se as imagens padrão."
        icon={Settings2}
      />

      <form onSubmit={onSubmit} className="space-y-6">
        <Panel title="Identidade e contactos" description="Dados visíveis no site e na app." icon={Building2}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Nome da empresa"
              icon={Building2}
              value={form.company_name || ''}
              onChange={update('company_name')}
              required
            />
            <Input label="Slogan" icon={Building2} value={form.tagline || ''} onChange={update('tagline')} />
            <TextArea
              className="md:col-span-2"
              label="Descrição"
              value={form.description || ''}
              onChange={update('description')}
            />
            <Input label="Telefone" icon={Phone} value={form.phone || ''} onChange={update('phone')} />
            <Input label="WhatsApp" icon={Phone} value={form.whatsapp || ''} onChange={update('whatsapp')} />
            <Input label="E-mail" icon={Mail} value={form.email || ''} onChange={update('email')} />
            <Input label="Horário" icon={Clock3} value={form.opening_hours || ''} onChange={update('opening_hours')} />
            <Input
              className="md:col-span-2"
              label="Morada / endereço"
              icon={MapPin}
              value={form.address || ''}
              onChange={update('address')}
            />
            <Input
              className="md:col-span-2"
              label="Link Google Maps"
              icon={MapPin}
              value={form.maps_url || ''}
              onChange={update('maps_url')}
              placeholder="https://maps.google.com/..."
            />
            <Input label="Facebook" icon={Globe} value={form.facebook_url || ''} onChange={update('facebook_url')} />
            <Input label="Instagram" icon={Globe} value={form.instagram_url || ''} onChange={update('instagram_url')} />
          </div>
        </Panel>

        <Panel
          title="Imagens públicas (upload)"
          description="Carregue do dispositivo. Sem upload, ficam as imagens padrão da aplicação."
          icon={ImagePlus}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <ImageUploadField
              label="Logotipo"
              file={logoFile}
              existingUrl={form.logo_url || '/logo.png'}
              onChange={(nextFile, opts = {}) => {
                setLogoFile(nextFile)
                if (opts.clearExisting || nextFile === null) {
                  setForm((prev) => ({ ...prev, logo_url: '/logo.png' }))
                }
              }}
            />
            <ImageUploadField
              label="Capa — Restaurante"
              file={restaurantCoverFile}
              existingUrl={form.restaurant_cover_url || ''}
              onChange={(nextFile, opts = {}) => {
                setRestaurantCoverFile(nextFile)
                if (opts.clearExisting || nextFile === null) {
                  setForm((prev) => ({ ...prev, restaurant_cover_url: '' }))
                }
              }}
            />
            <ImageUploadField
              label="Capa — Hospedaria"
              file={lodgingCoverFile}
              existingUrl={form.lodging_cover_url || ''}
              onChange={(nextFile, opts = {}) => {
                setLodgingCoverFile(nextFile)
                if (opts.clearExisting || nextFile === null) {
                  setForm((prev) => ({ ...prev, lodging_cover_url: '' }))
                }
              }}
            />
            <ImageUploadField
              label="Capa — Contactos"
              file={contactsCoverFile}
              existingUrl={form.contacts_cover_url || ''}
              onChange={(nextFile, opts = {}) => {
                setContactsCoverFile(nextFile)
                if (opts.clearExisting || nextFile === null) {
                  setForm((prev) => ({ ...prev, contacts_cover_url: '' }))
                }
              }}
            />
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {HERO_SLOT_META.map((slot, index) => (
              <ImageUploadField
                key={slot.label}
                label={slot.label}
                file={heroFiles[index]}
                existingUrl={heroSlots[index]?.url || ''}
                onChange={(nextFile, opts = {}) => {
                  setHeroFiles((prev) => {
                    const next = [...prev]
                    next[index] = nextFile
                    return next
                  })
                  if (opts.clearExisting || nextFile === null) {
                    setHeroSlots((prev) => {
                      const next = [...prev]
                      next[index] = null
                      return next
                    })
                  }
                }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Sem slides de hero carregados, o carrossel usa fotos dos pratos e quartos (ou imagens padrão).
          </p>
        </Panel>

        <FormActions>
          <Button type="submit" disabled={saving}>
            {saving ? 'A guardar...' : 'Guardar páginas públicas'}
          </Button>
        </FormActions>
      </form>
    </div>
  )
}
