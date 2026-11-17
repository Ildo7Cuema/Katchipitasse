import { Link } from 'react-router-dom'
import { BedDouble, MapPin, Phone, Share2, Sparkles, UtensilsCrossed } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import BrandLogo from '@/components/BrandLogo'
import { ClientSection, ProductCard, QuickAction } from '@/components/ClientUI'
import HeroCarousel, { buildHeroSlides } from '@/components/HeroCarousel'
import { Button, Spinner } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency } from '@/lib/format'
import { buildShareUrl, shareContent } from '@/lib/share'
import { getCategories, getDishes, getRooms } from '@/services/api'

export default function HomePage() {
  const { settings } = useCompany()
  const { profile, user } = useAuth()
  const toast = useToast()
  const [dishes, setDishes] = useState([])
  const [rooms, setRooms] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [dishList, roomList, categoryList] = await Promise.all([
          getDishes(),
          getRooms(),
          getCategories(),
        ])
        if (!mounted) return
        setDishes(dishList.filter((d) => d.is_active !== false))
        setRooms(roomList.filter((r) => r.is_active !== false))
        setCategories(categoryList.filter((c) => c.is_active !== false))
      } catch (err) {
        toast.error(err.message || 'Erro ao carregar destaques')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [toast])

  async function handleShare() {
    const result = await shareContent({
      title: settings.company_name,
      text: `${settings.tagline}. ${settings.description || ''}`,
      url: buildShareUrl('/'),
    })
    if (result.fallback === 'clipboard') toast.success('Ligação copiada')
    else if (result.ok) toast.success('Partilha iniciada')
    else if (!result.aborted) toast.error('Não foi possível partilhar')
  }

  const featuredDishes = useMemo(
    () => dishes.filter((d) => d.is_featured).slice(0, 3),
    [dishes],
  )
  const featuredRooms = useMemo(
    () => rooms.filter((r) => r.is_featured).slice(0, 2),
    [rooms],
  )
  const heroSlides = useMemo(
    () =>
      buildHeroSlides({
        dishes,
        rooms,
        categories,
        heroImages: settings.hero_images,
      }),
    [dishes, rooms, categories, settings.hero_images],
  )

  const firstName = (profile?.full_name || '').trim().split(/\s+/)[0]
  const logoSrc = settings.logo_url || '/logo.png'

  return (
    <div className="animate-fade-up space-y-8">
      <HeroCarousel slides={heroSlides}>
        <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center md:mx-0 md:max-w-none md:items-start md:text-left">
          <BrandLogo
            src={logoSrc}
            alt={settings.company_name}
            className="mb-5 max-w-[220px] bg-transparent md:max-w-[320px]"
            imgClassName="mx-auto max-h-24 md:mx-0 md:max-h-36"
          />
          {user && firstName ? (
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-brand-950 shadow-sm backdrop-blur">
              <Sparkles size={12} className="text-clay-500" /> Olá, {firstName}
            </p>
          ) : null}
          <p className="max-w-md text-base font-medium text-brand-950">{settings.tagline}</p>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-700">{settings.description}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link to="/restaurante">
              <Button>
                <UtensilsCrossed size={16} /> Pedir refeição
              </Button>
            </Link>
            <Link to="/hospedaria">
              <Button variant="secondary">
                <BedDouble size={16} /> Reservar quarto
              </Button>
            </Link>
          </div>
        </div>
      </HeroCarousel>

      <section className="grid gap-3 sm:grid-cols-3">
        <a
          href={`tel:${settings.phone}`}
          className="animate-scale-in rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-950/5 transition hover:-translate-y-0.5"
        >
          <Phone className="text-clay-500" size={18} />
          <p className="mt-3 text-sm font-semibold text-brand-950">Ligar agora</p>
          <p className="text-xs text-ink-500">{settings.phone}</p>
        </a>
        <a
          href={settings.maps_url}
          target="_blank"
          rel="noreferrer"
          className="animate-scale-in rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-950/5 transition hover:-translate-y-0.5"
          style={{ animationDelay: '60ms' }}
        >
          <MapPin className="text-clay-500" size={18} />
          <p className="mt-3 text-sm font-semibold text-brand-950">Como chegar</p>
          <p className="text-xs text-ink-500">{settings.address}</p>
        </a>
        <button
          type="button"
          onClick={handleShare}
          className="animate-scale-in rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-brand-950/5 transition hover:-translate-y-0.5"
          style={{ animationDelay: '120ms' }}
        >
          <Share2 className="text-clay-500" size={18} />
          <p className="mt-3 text-sm font-semibold text-brand-950">Partilhar</p>
          <p className="text-xs text-ink-500">Com amigos e família</p>
        </button>
      </section>

      {user ? (
        <section className="grid gap-3 sm:grid-cols-2">
          <QuickAction
            to="/perfil/pedidos"
            icon={UtensilsCrossed}
            title="Os meus pedidos"
            description="Acompanhe o estado das refeições"
            tone="accent"
          />
          <QuickAction
            to="/perfil/reservas"
            icon={BedDouble}
            title="As minhas reservas"
            description="Consulte as suas estadias"
            tone="dark"
          />
        </section>
      ) : null}

      <ClientSection title="Pratos em destaque" subtitle="Restaurante" actionLabel="Ver menu" actionTo="/restaurante">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {featuredDishes.map((dish, index) => (
              <ProductCard
                key={dish.id}
                to={`/restaurante/${dish.id}`}
                image={dish.image_url}
                title={dish.name}
                description={dish.description}
                priceLabel={formatCurrency(dish.price)}
                featured
                index={index}
              />
            ))}
          </div>
        )}
      </ClientSection>

      <ClientSection title="Quartos em destaque" subtitle="Hospedaria" actionLabel="Ver quartos" actionTo="/hospedaria">
        <div className="grid gap-4 sm:grid-cols-2">
          {featuredRooms.map((room, index) => (
            <ProductCard
              key={room.id}
              to={`/hospedaria/${room.id}`}
              image={room.image_url}
              title={room.name}
              description={room.description}
              meta={`Até ${room.max_guests} hóspedes`}
              priceLabel={`${formatCurrency(room.price_per_night)} / noite`}
              featured
              index={index}
            />
          ))}
        </div>
      </ClientSection>

      <section className="relative overflow-hidden rounded-[2rem] bg-brand-950 px-5 py-7 text-white">
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-clay-500/30 blur-2xl" />
        <div className="relative">
          <div className="mb-3 h-1 w-12 rounded-full bg-clay-500" />
          <h2 className="font-display text-2xl">Visite-nos</h2>
          <p className="mt-2 max-w-md text-sm text-white/70">{settings.opening_hours}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/contactos">
              <Button variant="outlineLight">Contactos</Button>
            </Link>
            {settings.whatsapp ? (
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="light">WhatsApp</Button>
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
