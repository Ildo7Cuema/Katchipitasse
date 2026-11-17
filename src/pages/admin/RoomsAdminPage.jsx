import { useEffect, useState } from 'react'
import { AlignLeft, Banknote, BedDouble, Sparkles, Users } from 'lucide-react'
import { AdminHero, FormActions, Panel } from '@/components/AdminUI'
import ImageUploadField from '@/components/ImageUploadField'
import { Button, EmptyState, Input, Spinner, TextArea } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency } from '@/lib/format'
import { isSupabaseConfigured } from '@/lib/supabase'
import { deleteRoom, getRooms, saveRoom, uploadImage } from '@/services/api'

const empty = {
  name: '',
  description: '',
  features: '',
  price_per_night: '',
  max_guests: 2,
  image_url: '',
  is_featured: false,
  is_active: true,
}

export default function RoomsAdminPage() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setItems(await getRooms())
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await load()
      } catch (err) {
        toast.error(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [toast])

  async function onSubmit(e) {
    e.preventDefault()
    if (!isSupabaseConfigured) return toast.error('Configure o Supabase')
    setSaving(true)
    try {
      let imageUrl = form.image_url || null
      if (file) imageUrl = await uploadImage('rooms', file)
      await saveRoom(
        {
          name: form.name.trim(),
          description: form.description || null,
          features: form.features || null,
          price_per_night: Number(form.price_per_night),
          max_guests: Number(form.max_guests),
          image_url: imageUrl,
          is_featured: Boolean(form.is_featured),
          is_active: Boolean(form.is_active),
        },
        editingId,
      )
      toast.success(editingId ? 'Quarto actualizado' : 'Quarto criado')
      setForm(empty)
      setEditingId(null)
      setFile(null)
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <AdminHero
        tone="dark"
        eyebrow="Hospedaria"
        title="Quartos"
        description="Gestão de tipologias, preços por noite e capacidade."
        icon={BedDouble}
      />

      <Panel
        title={editingId ? 'Editar quarto' : 'Novo quarto'}
        description="Dados apresentados na página da hospedaria."
        icon={BedDouble}
      >
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <Input
            label="Nome"
            icon={BedDouble}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Preço / noite"
            type="number"
            min="0"
            icon={Banknote}
            value={form.price_per_night}
            onChange={(e) => setForm({ ...form, price_per_night: e.target.value })}
            required
          />
          <Input
            label="Capacidade"
            type="number"
            min="1"
            icon={Users}
            value={form.max_guests}
            onChange={(e) => setForm({ ...form, max_guests: e.target.value })}
            required
          />
          <ImageUploadField
            className="md:col-span-2"
            label="Fotografia (do dispositivo)"
            file={file}
            existingUrl={form.image_url}
            onChange={(nextFile, opts = {}) => {
              setFile(nextFile)
              if (opts.clearExisting || nextFile === null) {
                setForm((prev) => ({ ...prev, image_url: nextFile ? prev.image_url : '' }))
              }
            }}
          />
          <TextArea
            className="md:col-span-2"
            label="Descrição"
            icon={AlignLeft}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextArea
            className="md:col-span-2"
            label="Características"
            icon={Sparkles}
            value={form.features}
            onChange={(e) => setForm({ ...form, features: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              className="rounded border-brand-950/20"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            />
            Destaque
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              className="rounded border-brand-950/20"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Activo
          </label>
          <FormActions className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'A guardar...' : editingId ? 'Actualizar quarto' : 'Criar quarto'}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingId(null)
                  setForm(empty)
                  setFile(null)
                }}
              >
                Cancelar
              </Button>
            ) : null}
          </FormActions>
        </form>
      </Panel>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="Sem quartos" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Panel
              key={item.id}
              title={item.name}
              description={`${formatCurrency(item.price_per_night)} / noite · até ${item.max_guests} hóspedes`}
              icon={BedDouble}
              actions={
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingId(item.id)
                      setForm({
                        name: item.name,
                        description: item.description || '',
                        features: item.features || '',
                        price_per_night: item.price_per_night,
                        max_guests: item.max_guests,
                        image_url: item.image_url || '',
                        is_featured: item.is_featured,
                        is_active: item.is_active,
                      })
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      if (!confirm('Eliminar quarto?')) return
                      try {
                        await deleteRoom(item.id)
                        toast.success('Eliminado')
                        await load()
                      } catch (err) {
                        toast.error(err.message)
                      }
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              }
            >
              <p className="text-sm text-ink-500">{item.description || 'Sem descrição.'}</p>
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}
