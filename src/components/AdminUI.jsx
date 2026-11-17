import { Button } from '@/components/ui'

export function AdminHero({
  eyebrow = 'Painel',
  title,
  description,
  icon: Icon,
  actions,
  tone = 'dark',
}) {
  const tones = {
    dark: 'from-brand-950 via-brand-900 to-brand-800 text-white',
    accent: 'from-brand-950 via-[#1a0909] to-clay-700 text-white',
    light: 'from-white via-sand-100 to-sand-200 text-brand-950 border border-brand-950/8',
  }

  return (
    <section
      className={`sticky top-0 z-30 mb-6 overflow-hidden rounded-3xl bg-gradient-to-br p-5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] md:p-7 ${tones[tone]}`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-clay-500/20 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-white/5 blur-2xl" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <div className="mb-2 flex items-center gap-3">
            {Icon ? (
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  tone === 'light' ? 'bg-clay-500/10 text-clay-600' : 'bg-white/10 text-white'
                }`}
              >
                <Icon size={18} />
              </div>
            ) : null}
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${
                tone === 'light' ? 'text-clay-600' : 'text-clay-500'
              }`}
            >
              {eyebrow}
            </p>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {description ? (
            <p className={`mt-2 max-w-xl text-sm leading-relaxed ${tone === 'light' ? 'text-ink-500' : 'text-white/75'}`}>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  )
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'default' }) {
  const tones = {
    default: 'bg-white',
    accent: 'bg-gradient-to-br from-clay-500 to-clay-600 text-white',
    dark: 'bg-brand-950 text-white',
  }
  const iconWrap =
    tone === 'default' ? 'bg-clay-500/10 text-clay-600' : 'bg-white/15 text-white'
  const labelClass = tone === 'default' ? 'text-ink-500' : 'text-white/70'
  const valueClass = tone === 'default' ? 'text-brand-950' : 'text-white'

  return (
    <div className={`rounded-3xl p-5 shadow-sm transition hover:-translate-y-0.5 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm ${labelClass}`}>{label}</p>
          <p className={`mt-2 font-display text-3xl font-semibold ${valueClass}`}>{value ?? 0}</p>
          {hint ? <p className={`mt-2 text-xs ${labelClass}`}>{hint}</p> : null}
        </div>
        {Icon ? (
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconWrap}`}>
            <Icon size={18} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function Panel({ title, description, icon: Icon, actions, children, className = '' }) {
  return (
    <section className={`overflow-hidden rounded-3xl bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-950/5 px-5 py-4">
          <div className="flex items-start gap-3">
            {Icon ? (
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-950 text-white">
                <Icon size={18} />
              </div>
            ) : null}
            <div>
              {title ? <h2 className="font-display text-xl text-brand-950">{title}</h2> : null}
              {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
            </div>
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

export function IconField({
  as = 'input',
  icon: Icon,
  label,
  error,
  className = '',
  children,
  ...props
}) {
  const shared =
    'w-full rounded-2xl border border-brand-950/10 bg-sand-100/80 py-3 pl-11 pr-3 text-sm outline-none transition focus:border-clay-500/40 focus:bg-white focus:ring-2 focus:ring-clay-500/20'

  return (
    <label className={`block space-y-1.5 ${className}`}>
      {label ? (
        <span className="text-sm font-medium text-ink-700">{label}</span>
      ) : null}
      <div className="relative">
        {Icon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500">
            <Icon size={16} />
          </span>
        ) : null}
        {as === 'textarea' ? (
          <textarea className={`${shared} min-h-28 resize-y`} {...props} />
        ) : as === 'select' ? (
          <select className={shared} {...props}>
            {children}
          </select>
        ) : (
          <input className={shared} {...props} />
        )}
      </div>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  )
}

export function ActionTile({ to, icon: Icon, title, description, onClick, dark = false }) {
  const Comp = to ? 'a' : 'button'
  const props = to ? { href: to } : { type: 'button', onClick }

  // Use Link via wrapper in pages when routing - here keep simple button/div look for admin hub
  return (
    <Comp
      {...props}
      className={`group block w-full rounded-3xl p-5 text-left shadow-sm transition hover:-translate-y-0.5 ${
        dark ? 'bg-brand-950 text-white' : 'bg-white text-brand-950'
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          dark ? 'bg-clay-500 text-white' : 'bg-clay-500/10 text-clay-600'
        }`}
      >
        {Icon ? <Icon size={18} /> : null}
      </div>
      <p className="mt-4 font-display text-xl">{title}</p>
      {description ? (
        <p className={`mt-2 text-sm ${dark ? 'text-white/70' : 'text-ink-500'}`}>{description}</p>
      ) : null}
      <span className={`mt-4 inline-flex text-sm font-semibold ${dark ? 'text-clay-500' : 'text-clay-600'}`}>
        Abrir →
      </span>
    </Comp>
  )
}

export function FormActions({ children, className = '' }) {
  return <div className={`flex flex-wrap gap-2 pt-2 ${className}`}>{children || <Button type="submit">Guardar</Button>}</div>
}
