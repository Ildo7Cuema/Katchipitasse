import { useEffect, useState } from 'react'
import { AlignLeft, Banknote, Tags, UtensilsCrossed } from 'lucide-react'
import { AdminHero, FormActions, Panel } from '@/components/AdminUI'
import ImageUploadField from '@/components/ImageUploadField'
import { Button, EmptyState, Input, Select, Spinner, TextArea } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency } from '@/lib/format'
import { isSupabaseConfigured } from '@/lib/supabase'
import { deleteDish, getCategories, getDishes, saveDish, uploadImage } from '@/services/api'

const empty = {
  name: '',
  description: '',
  price: '',
  category_id: '',
  image_url: '',
  is_featured: false,
  is_active: true,
}

export default function DishesAdminPage() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    const [dishes, cats] = await Promise.all([getDishes(), getCategories()])
    setItems(dishes)
    setCategories(cats)
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
      if (file) imageUrl = await uploadImage('dishes', file)
      await saveDish(
        {
          name: form.name.trim(),
          description: form.description || null,
          price: Number(form.price),
          category_id: form.category_id || null,
          image_url: imageUrl,
          is_featured: Boolean(form.is_featured),
          is_active: Boolean(form.is_active),
        },
        editingId,
      )
      toast.success(editingId ? 'Prato actualizado' : 'Prato criado')
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
        tone="accent"
        eyebrow="Restaurante"
        title="Pratos"
        description="Catálogo de comida e bebidas com preço, categoria e destaque."
        icon={UtensilsCrossed}
      />

      <Panel
        title={editingId ? 'Editar prato' : 'Novo prato'}
        description="Preencha os detalhes e publique no menu."
        icon={UtensilsCrossed}
      >
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <Input
            label="Nome"
            icon={UtensilsCrossed}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Preço"
            type="number"
            min="0"
            step="1"
            icon={Banknote}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <Select
            label="Categoria"
            icon={Tags}
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
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
              {saving ? 'A guardar...' : editingId ? 'Actualizar prato' : 'Criar prato'}
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
        <EmptyState title="Sem pratos" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Panel
              key={item.id}
              title={item.name}
              description={`${formatCurrency(item.price)} · ${item.is_active ? 'Activo' : 'Inactivo'}${item.is_featured ? ' · Destaque' : ''}`}
              icon={UtensilsCrossed}
              actions={
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingId(item.id)
                      setForm({
                        name: item.name,
                        description: item.description || '',
                        price: item.price,
                        category_id: item.category_id || '',
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
                      if (!confirm('Eliminar prato?')) return
                      try {
                        await deleteDish(item.id)
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
