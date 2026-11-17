import { useEffect, useMemo, useState } from 'react'
import { UtensilsCrossed } from 'lucide-react'
import { ClientSection, FilterChip, ProductCard } from '@/components/ClientUI'
import PageCover from '@/components/PageCover'
import { EmptyState, Spinner } from '@/components/ui'
import { useCompany } from '@/contexts/CompanyContext'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency } from '@/lib/format'
import { getCategories, getDishes } from '@/services/api'

export default function RestaurantPage() {
  const { settings } = useCompany()
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [dishes, setDishes] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [cats, items] = await Promise.all([getCategories(), getDishes()])
        if (!mounted) return
        setCategories(cats.filter((c) => c.is_active !== false))
        setDishes(items.filter((d) => d.is_active !== false))
      } catch (err) {
        toast.error(err.message || 'Erro ao carregar o menu')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [toast])

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return dishes
    return dishes.filter((d) => d.category_id === activeCategory)
  }, [activeCategory, dishes])

  return (
    <div className="animate-fade-up space-y-5">
      <PageCover
        image={settings.restaurant_cover_url || null}
        icon={UtensilsCrossed}
        eyebrow="Menu"
        title="Restaurante"
        description="Escolha o prato e solicite a refeição em segundos."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <ClientSection title="O nosso cardápio" subtitle={`${filtered.length} opções`}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterChip active={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>
              Todos
            </FilterChip>
            {categories.map((cat) => (
              <FilterChip
                key={cat.id}
                active={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </FilterChip>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Sem pratos" description="Ainda não há pratos nesta categoria." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((dish, index) => (
                <ProductCard
                  key={dish.id}
                  to={`/restaurante/${dish.id}`}
                  image={dish.image_url}
                  title={dish.name}
                  description={dish.description}
                  priceLabel={formatCurrency(dish.price)}
                  featured={dish.is_featured}
                  index={index}
                />
              ))}
            </div>
          )}
        </ClientSection>
      )}
    </div>
  )
}
