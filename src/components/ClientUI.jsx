import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Badge, CardMedia } from '@/components/ui'
import { formatCurrency } from '@/lib/format'

export function ClientSection({
  title,
  subtitle,
  actionLabel,
  actionTo,
  children,
  className = '',
}) {
  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-end justify-between gap-3">
        <div>
          {subtitle ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay-600">{subtitle}</p>
          ) : null}
          <h2 className="font-display text-2xl text-brand-950">{title}</h2>
        </div>
        {actionTo && actionLabel ? (
          <Link
            to={actionTo}
            className="inline-flex items-center gap-1 text-sm font-semibold text-clay-600 transition hover:text-clay-700"
          >
            {actionLabel} <ArrowUpRight size={14} />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition active:scale-[0.97] ${
        active
          ? 'bg-brand-950 text-white shadow-sm'
          : 'bg-white text-ink-700 ring-1 ring-brand-950/8 hover:bg-sand-100'
      }`}
    >
      {children}
    </button>
  )
}

export function ProductCard({
  to,
  image,
  title,
  description,
  priceLabel,
  badge,
  meta,
  featured = false,
  index = 0,
}) {
  return (
    <Link
      to={to}
      className="group animate-fade-up overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-brand-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-md"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="relative overflow-hidden">
        <CardMedia
          src={image}
          alt={title}
          className="h-44 transition duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/35 via-transparent to-transparent opacity-80" />
        {badge || featured ? (
          <div className="absolute left-3 top-3">
            <Badge className="bg-white/95 text-clay-600 shadow-sm">{badge || 'Destaque'}</Badge>
          </div>
        ) : null}
        {priceLabel ? (
          <p className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-brand-950 shadow-sm">
            {priceLabel}
          </p>
        ) : null}
      </div>
      <div className="space-y-1.5 p-4">
        <h3 className="font-display text-lg leading-snug text-brand-950">{title}</h3>
        {description ? <p className="line-clamp-2 text-sm text-ink-500">{description}</p> : null}
        {meta ? <div className="text-xs font-medium text-ink-500">{meta}</div> : null}
      </div>
    </Link>
  )
}

export function MediaThumb({ src, alt, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-sand-200 ${className}`}>
      {src ? (
        <img src={src} alt={alt || ''} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full min-h-16 items-center justify-center text-[10px] text-ink-500">Sem imagem</div>
      )}
    </div>
  )
}

export function OrderHistoryCard({ dateLabel, status, statusClass, phone, items = [], totalLabel, notes }) {
  return (
    <article className="animate-fade-up overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-brand-950/5">
      <div className="flex items-start justify-between gap-3 border-b border-brand-950/5 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-brand-950">{dateLabel}</p>
          {phone ? <p className="mt-0.5 text-xs text-ink-500">{phone}</p> : null}
        </div>
        <Badge className={statusClass}>{status}</Badge>
      </div>
      <ul className="divide-y divide-brand-950/5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-4 py-3">
            <MediaThumb src={item.image} alt={item.name} className="h-14 w-14 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-brand-950">
                {item.quantity}× {item.name}
              </p>
              <p className="text-xs text-ink-500">{formatCurrency(item.unitPrice)} / un.</p>
            </div>
            <p className="text-sm font-semibold text-clay-600">
              {formatCurrency(item.unitPrice * item.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3 bg-sand-100/70 px-4 py-3">
        <p className="text-xs text-ink-500">{notes || 'Sem observações'}</p>
        {totalLabel ? <p className="text-sm font-semibold text-brand-950">{totalLabel}</p> : null}
      </div>
    </article>
  )
}

export function ReservationHistoryCard({
  title,
  image,
  dateRange,
  guests,
  status,
  statusClass,
  to,
}) {
  const body = (
    <article className="animate-fade-up flex gap-3 overflow-hidden rounded-3xl bg-white p-3 shadow-sm ring-1 ring-brand-950/5 transition hover:-translate-y-0.5">
      <MediaThumb src={image} alt={title} className="h-24 w-24 shrink-0 sm:h-28 sm:w-32" />
      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg text-brand-950">{title}</h3>
          <Badge className={statusClass}>{status}</Badge>
        </div>
        <p className="mt-1 text-sm text-ink-500">{dateRange}</p>
        <p className="mt-2 text-xs font-medium text-ink-700">{guests} hóspede(s)</p>
      </div>
    </article>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

export function QuickAction({ to, icon: Icon, title, description, tone = 'light' }) {
  const tones = {
    light: 'bg-white text-brand-950 ring-brand-950/5',
    dark: 'bg-brand-950 text-white ring-brand-950',
    accent: 'bg-gradient-to-br from-brand-950 to-clay-700 text-white ring-clay-600/30',
  }
  return (
    <Link
      to={to}
      className={`group rounded-3xl p-4 shadow-sm ring-1 transition hover:-translate-y-0.5 ${tones[tone]}`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
          tone === 'light' ? 'bg-clay-500/10 text-clay-600' : 'bg-white/15 text-white'
        }`}
      >
        <Icon size={18} />
      </div>
      <p className="mt-3 font-display text-lg">{title}</p>
      <p className={`mt-1 text-sm ${tone === 'light' ? 'text-ink-500' : 'text-white/70'}`}>{description}</p>
    </Link>
  )
}
