const DEFAULT_LOGO = '/logo.png'

export default function BrandLogo({
  src,
  alt = 'Katchipitasse Elavoko',
  className = '',
  imgClassName = '',
}) {
  const logoSrc = src || DEFAULT_LOGO

  return (
    <div className={className}>
      <img
        src={logoSrc}
        alt={alt}
        className={`h-auto w-full object-contain ${imgClassName}`}
        loading="eager"
      />
    </div>
  )
}
