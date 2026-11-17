export default function PageCover({
  image,
  eyebrow,
  title,
  description,
  actions,
  icon: Icon,
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] text-white shadow-sm">
      {image ? (
        <>
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950/85 via-brand-950/70 to-clay-700/75" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-clay-700" />
      )}
      <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3 p-5">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Icon size={18} />
            </div>
          ) : null}
          <div>
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay-500">{eyebrow}</p>
            ) : null}
            <h1 className="font-display text-2xl">{title}</h1>
            {description ? <p className="mt-1 text-sm text-white/75">{description}</p> : null}
          </div>
        </div>
        {actions || null}
      </div>
    </div>
  )
}
