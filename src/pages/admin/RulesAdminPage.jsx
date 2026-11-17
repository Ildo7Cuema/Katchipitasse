import { useEffect, useState } from 'react'
import { FilePenLine, ListChecks, Scale } from 'lucide-react'
import { AdminHero, Panel } from '@/components/AdminUI'
import { Button, EmptyState, Select, Spinner, TextArea } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { getRuleValueConfig, normalizeRuleValue } from '@/lib/systemRules'
import { getSystemRules, saveSystemRule } from '@/services/api'

export default function RulesAdminPage() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [drafts, setDrafts] = useState({})

  async function load() {
    const data = await getSystemRules()
    setItems(data)
    setDrafts(
      Object.fromEntries(
        data.map((rule) => [
          rule.id,
          {
            description: rule.description || '',
            value_text: normalizeRuleValue(rule.rule_key, rule.value_text),
            is_active: rule.is_active,
          },
        ]),
      ),
    )
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await load()
      } catch (err) {
        toast.error(err.message || 'Erro ao carregar regras. Execute a migration 003.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [toast])

  async function saveRule(rule) {
    setSavingId(rule.id)
    try {
      const draft = drafts[rule.id]
      const value_text = normalizeRuleValue(rule.rule_key, draft.value_text)
      await saveSystemRule(
        {
          title: rule.title,
          description: draft.description || null,
          value_text,
          is_active: Boolean(draft.is_active),
        },
        rule.id,
      )
      toast.success('Regra actualizada')
      await load()
    } catch (err) {
      toast.error(err.message || 'Erro ao guardar regra')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <AdminHero
        tone="dark"
        eyebrow="Plataforma"
        title="Regras do sistema"
        description="Políticas com valores pré-definidos para evitar erros de configuração."
        icon={Scale}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Sem regras"
          description="Execute a migration 003_platform_monitoring.sql no Supabase."
        />
      ) : (
        <div className="grid gap-4">
          {items.map((rule) => {
            const draft = drafts[rule.id] || {}
            const valueConfig = getRuleValueConfig(rule.rule_key)
            return (
              <Panel
                key={rule.id}
                title={rule.title}
                description={rule.rule_key}
                icon={ListChecks}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Select
                    label={valueConfig.label}
                    icon={ListChecks}
                    value={normalizeRuleValue(rule.rule_key, draft.value_text)}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [rule.id]: {
                          ...prev[rule.id],
                          value_text: normalizeRuleValue(rule.rule_key, e.target.value),
                        },
                      }))
                    }
                  >
                    {valueConfig.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>

                  <label className="flex items-center gap-3 rounded-2xl bg-sand-100/80 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-clay-500"
                      checked={Boolean(draft.is_active)}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [rule.id]: { ...prev[rule.id], is_active: e.target.checked },
                        }))
                      }
                    />
                    Regra activa na plataforma
                  </label>

                  <p className="text-xs text-ink-500 md:col-span-2">{valueConfig.helper}</p>

                  <TextArea
                    className="md:col-span-2"
                    label="Descrição (opcional)"
                    icon={FilePenLine}
                    value={draft.description || ''}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [rule.id]: { ...prev[rule.id], description: e.target.value },
                      }))
                    }
                  />

                  <div className="md:col-span-2">
                    <Button onClick={() => saveRule(rule)} disabled={savingId === rule.id}>
                      {savingId === rule.id ? 'A guardar...' : 'Guardar regra'}
                    </Button>
                  </div>
                </div>
              </Panel>
            )
          })}
        </div>
      )}
    </div>
  )
}
