import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const FALLBACK_SLIDES = [
  {
    id: 'fallback-room-1',
    image:
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1600&q=80',
    label: 'Quartos',
    caption: 'Conforto para a sua estadia',
  },
  {
    id: 'fallback-food-1',
    image:
      'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1600&q=80',
    label: 'Comidas',
    caption: 'Sabores da nossa cozinha',
  },
  {
    id: 'fallback-drink-1',
    image:
      'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=1600&q=80',
    label: 'Bebidas',
    caption: 'Refrescantes e naturais',
  },
  {
    id: 'fallback-room-2',
    image:
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1600&q=80',
    label: 'Quartos',
    caption: 'Ambientes acolhedores',
  },
  {
    id: 'fallback-food-2',
    image:
      'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1600&q=80',
    label: 'Comidas',
    caption: 'Pratos preparados com cuidado',
  },
]

export default function HeroCarousel({ slides = [], intervalMs = 5000, children }) {
  const items = useMemo(() => (slides.length > 0 ? slides : FALLBACK_SLIDES), [slides])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setIndex(0)
  }, [items.length])

  useEffect(() => {
    if (paused || items.length <= 1) return undefined
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % items.length)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [items.length, intervalMs, paused])

  function goTo(next) {
    setIndex((next + items.length) % items.length)
  }

  const active = items[index] || items[0]

  return (
    <section
      className="relative -mx-4 overflow-hidden md:mx-0 md:rounded-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false)
      }}
    >
      <div className="absolute inset-0">
        {items.map((slide, i) => (
          <img
            key={slide.id}
            src={slide.image}
            alt={slide.caption || slide.label || ''}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${
              i === index ? 'scale-105 opacity-100' : 'scale-100 opacity-0'
            }`}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        ))}
        {/* Gradientes só nas extremidades — o centro da foto fica visível */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/55 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="relative flex min-h-[78vh] flex-col justify-between px-5 pb-10 pt-10 md:min-h-[560px] md:px-10">
        {children}

        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-clay-500">
              {active?.label}
            </p>
            <p className="mt-1 text-sm text-white/85">{active?.caption}</p>
          </div>

          {items.length > 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Imagem anterior"
                onClick={() => goTo(index - 1)}
                className="rounded-full bg-black/35 p-2 text-white backdrop-blur transition hover:bg-black/50"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1.5 px-1">
                {items.map((slide, i) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`Ir para slide ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === index ? 'w-6 bg-clay-500' : 'w-2 bg-white/55 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Próxima imagem"
                onClick={() => goTo(index + 1)}
                className="rounded-full bg-black/35 p-2 text-white backdrop-blur transition hover:bg-black/50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function buildHeroSlides({ dishes = [], rooms = [], categories = [], heroImages = [] }) {
  const custom = (Array.isArray(heroImages) ? heroImages : [])
    .filter((item) => item?.url)
    .map((item, index) => ({
      id: `custom-hero-${index}`,
      image: item.url,
      label: item.label || 'Destaque',
      caption: item.caption || '',
    }))

  // Se o admin carregou slides, usam-se esses; senão, pratos/quartos; senão FALLBACK no carrossel
  if (custom.length > 0) return custom

  const categoryNameById = Object.fromEntries(categories.map((c) => [c.id, (c.name || '').toLowerCase()]))

  function isDrink(dish) {
    const name = `${dish.name || ''} ${dish.description || ''} ${categoryNameById[dish.category_id] || ''}`.toLowerCase()
    return /bebida|sumo|drink|refresco|cocktail|cerveja|vinho|água|agua/.test(name)
  }

  const roomSlides = rooms
    .filter((r) => r.is_active !== false && r.image_url)
    .slice(0, 4)
    .map((room) => ({
      id: `room-${room.id}`,
      image: room.image_url,
      label: 'Quartos',
      caption: room.name,
    }))

  const foodSlides = dishes
    .filter((d) => d.is_active !== false && d.image_url && !isDrink(d))
    .slice(0, 4)
    .map((dish) => ({
      id: `food-${dish.id}`,
      image: dish.image_url,
      label: 'Comidas',
      caption: dish.name,
    }))

  const drinkSlides = dishes
    .filter((d) => d.is_active !== false && d.image_url && isDrink(d))
    .slice(0, 3)
    .map((dish) => ({
      id: `drink-${dish.id}`,
      image: dish.image_url,
      label: 'Bebidas',
      caption: dish.name,
    }))

  // Intercalar categorias para o carrossel variar: quarto → comida → bebida…
  const pooled = []
  const max = Math.max(roomSlides.length, foodSlides.length, drinkSlides.length)
  for (let i = 0; i < max; i += 1) {
    if (roomSlides[i]) pooled.push(roomSlides[i])
    if (foodSlides[i]) pooled.push(foodSlides[i])
    if (drinkSlides[i]) pooled.push(drinkSlides[i])
  }

  return pooled
}
