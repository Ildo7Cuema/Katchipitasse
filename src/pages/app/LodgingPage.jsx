import { useEffect, useState } from 'react'
import { BedDouble, Users } from 'lucide-react'
import { ClientSection, ProductCard } from '@/components/ClientUI'
import PageCover from '@/components/PageCover'
import { EmptyState, Spinner } from '@/components/ui'
import { useCompany } from '@/contexts/CompanyContext'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency } from '@/lib/format'
import { getRooms } from '@/services/api'

export default function LodgingPage() {
  const { settings } = useCompany()
  const toast = useToast()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getRooms()
        if (mounted) setRooms(data.filter((r) => r.is_active !== false))
      } catch (err) {
        toast.error(err.message || 'Erro ao carregar quartos')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [toast])

  return (
    <div className="animate-fade-up space-y-5">
      <PageCover
        image={settings.lodging_cover_url || null}
        icon={BedDouble}
        eyebrow="Estadia"
        title="Hospedaria"
        description="Quartos acolhedores para descansar com conforto."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState title="Sem quartos" description="Ainda não há quartos disponíveis." />
      ) : (
        <ClientSection title="Escolha o seu quarto" subtitle={`${rooms.length} tipologias`}>
          <div className="grid gap-4 sm:grid-cols-2">
            {rooms.map((room, index) => (
              <ProductCard
                key={room.id}
                to={`/hospedaria/${room.id}`}
                image={room.image_url}
                title={room.name}
                description={room.description}
                meta={
                  <span className="inline-flex items-center gap-1">
                    <Users size={12} /> Até {room.max_guests} hóspedes
                  </span>
                }
                priceLabel={`${formatCurrency(room.price_per_night)} / noite`}
                featured={room.is_featured}
                index={index}
              />
            ))}
          </div>
        </ClientSection>
      )}
    </div>
  )
}
