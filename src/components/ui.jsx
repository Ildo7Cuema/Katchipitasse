import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled,
  ...props
}) {
  const variants = {
    primary: 'bg-clay-500 text-white hover:bg-clay-600 shadow-sm',
    secondary: 'bg-brand-950 text-white hover:bg-brand-800',
    light: 'bg-white text-brand-950 hover:bg-sand-100 shadow-sm',
    outline: 'border border-brand-950/25 text-brand-950 hover:bg-brand-950/5',
    outlineLight: 'border border-white/35 text-white hover:bg-white/10',
    danger: 'bg-danger text-white hover:opacity-90',
    ghost: 'text-brand-950 hover:bg-brand-950/5',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input({ label, error, className = '', icon: Icon, ...props }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      {label ? <span className="text-sm font-medium text-ink-700">{label}</span> : null}
      <div className="relative">
        {Icon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500">
            <Icon size={16} />
          </span>
        ) : null}
        <input
          className={`w-full rounded-2xl border border-brand-950/10 bg-sand-100/80 py-2.5 text-sm outline-none transition focus:border-clay-500/40 focus:bg-white focus:ring-2 focus:ring-clay-500/20 ${
            Icon ? 'pl-11 pr-3' : 'px-3'
          }`}
          {...props}
        />
      </div>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  )
}

export function PasswordInput({ label = 'Palavra-passe', error, className = '', id, ...props }) {
  const [visible, setVisible] = useState(false)
  const autoId = useId()
  const inputId = id || autoId

  return (
    <div className={`block space-y-1.5 ${className}`}>
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className="w-full rounded-2xl border border-brand-950/10 bg-sand-100/80 py-2.5 pl-3 pr-11 text-sm outline-none transition focus:border-clay-500/40 focus:bg-white focus:ring-2 focus:ring-clay-500/20"
          {...props}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink-500 transition hover:bg-brand-950/5 hover:text-brand-950"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  )
}

export function TextArea({ label, error, className = '', icon: Icon, ...props }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      {label ? <span className="text-sm font-medium text-ink-700">{label}</span> : null}
      <div className="relative">
        {Icon ? (
          <span className="pointer-events-none absolute left-3.5 top-3.5 text-ink-500">
            <Icon size={16} />
          </span>
        ) : null}
        <textarea
          className={`min-h-24 w-full rounded-2xl border border-brand-950/10 bg-sand-100/80 py-2.5 text-sm outline-none transition focus:border-clay-500/40 focus:bg-white focus:ring-2 focus:ring-clay-500/20 ${
            Icon ? 'pl-11 pr-3' : 'px-3'
          }`}
          {...props}
        />
      </div>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  )
}

export function Select({ label, error, children, className = '', icon: Icon, ...props }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      {label ? <span className="text-sm font-medium text-ink-700">{label}</span> : null}
      <div className="relative">
        {Icon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500">
            <Icon size={16} />
          </span>
        ) : null}
        <select
          className={`w-full rounded-2xl border border-brand-950/10 bg-sand-100/80 py-2.5 text-sm outline-none transition focus:border-clay-500/40 focus:bg-white focus:ring-2 focus:ring-clay-500/20 ${
            Icon ? 'pl-11 pr-3' : 'px-3'
          }`}
          {...props}
        >
          {children}
        </select>
      </div>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  )
}

export function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  )
}

export function Spinner({ className = '' }) {
  return (
    <div
      className={`h-8 w-8 animate-spin rounded-full border-2 border-brand-800/20 border-t-brand-800 ${className}`}
      role="status"
      aria-label="A carregar"
    />
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300/60 bg-white/60 px-6 py-12 text-center">
      <h3 className="font-display text-lg text-brand-900">{title}</h3>
      {description ? <p className="mt-2 text-sm text-ink-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-950">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function CardMedia({ src, alt, className = '' }) {
  return (
    <div className={`overflow-hidden bg-sand-200 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 hover:scale-105"
        />
      ) : (
        <div className="flex h-full min-h-40 items-center justify-center text-sm text-ink-500">Sem imagem</div>
      )}
    </div>
  )
}
