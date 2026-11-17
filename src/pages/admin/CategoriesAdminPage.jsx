import { useEffect, useState } from 'react'
import { AlignLeft, FolderTree, Hash, Tags } from 'lucide-react'
import { AdminHero, FormActions, Panel } from '@/components/AdminUI'
import { Button, EmptyState, Input, Spinner, TextArea } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { deleteCategory, getCategories, saveCategory } from '@/services/api'
import { isSupabaseConfigured } from '@/lib/supabase'

const empty = { name: '', description: '', sort_order: 0, is_active: true }

export default function CategoriesAdminPage() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    const data = await getCategories()
    setItems(data)
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
      await saveCategory(
        {
          name: form.name.trim(),
          description: form.description || null,
          sort_order: Number(form.sort_order) || 0,
          is_active: Boolean(form.is_active),
        },
        editingId,
      )
      toast.success(editingId ? 'Categoria actualizada' : 'Categoria criada')
      setForm(empty)
      setEditingId(null)
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
        eyebrow="Restaurante"
        title="Categorias"
        description="Organize o menu com secções claras para pratos e bebidas."
        icon={FolderTree}
      />

      <Panel
        title={editingId ? 'Editar categoria' : 'Nova categoria'}
        description="Nome, ordem e estado de publicação."
        icon={Tags}
      >
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <Input
            label="Nome"
            icon={Tags}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Ordem"
            type="number"
            icon={Hash}
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
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
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Activa
          </label>
          <FormActions className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'A guardar...' : editingId ? 'Actualizar' : 'Criar categoria'}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingId(null)
                  setForm(empty)
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
        <EmptyState title="Sem categorias" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Panel
              key={item.id}
              title={item.name}
              description={`Ordem ${item.sort_order} · ${item.is_active ? 'Activa' : 'Inactiva'}`}
              icon={FolderTree}
              actions={
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingId(item.id)
                      setForm({
                        name: item.name,
                        description: item.description || '',
                        sort_order: item.sort_order,
                        is_active: item.is_active,
                      })
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      if (!confirm('Eliminar categoria?')) return
                      try {
                        await deleteCategory(item.id)
                        toast.success('Eliminada')
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
