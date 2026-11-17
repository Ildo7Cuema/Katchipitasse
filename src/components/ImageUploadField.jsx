import { useEffect, useMemo, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'

export default function ImageUploadField({
  label = 'Fotografia',
  file,
  existingUrl = '',
  onChange,
  className = '',
  required = false,
}) {
  const [preview, setPreview] = useState('')

  useEffect(() => {
    if (!file) {
      setPreview('')
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const shown = preview || existingUrl || ''
  const fileName = useMemo(() => file?.name || '', [file])

  return (
    <div className={`space-y-2 ${className}`}>
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <label className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-dashed border-brand-950/15 bg-sand-100/80 transition hover:border-clay-500/40 hover:bg-white">
        {shown ? (
          <div className="relative aspect-[16/10] w-full bg-brand-950/5">
            <img src={shown} alt="Pré-visualização" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 py-2 text-xs text-white">
              {fileName || 'Imagem actual — toque para substituir'}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay-500/10 text-clay-600">
              <ImagePlus size={22} />
            </div>
            <p className="text-sm font-medium text-brand-950">Carregar do dispositivo</p>
            <p className="text-xs text-ink-500">JPG, PNG ou WEBP</p>
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          capture="environment"
          className="sr-only"
          required={required && !shown}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </label>
      {file || existingUrl ? (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-danger"
          onClick={() => onChange(null, { clearExisting: true })}
        >
          <X size={14} /> Remover imagem
        </button>
      ) : null}
    </div>
  )
}
