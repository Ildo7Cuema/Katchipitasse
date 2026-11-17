/** Ciclo de pagamento anual — calculado pelo sistema (sem input manual). */

export function toDateInputValue(value = new Date()) {
  const d = value instanceof Date ? value : new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function addOneYear(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  d.setFullYear(d.getFullYear() + 1)
  return toDateInputValue(d)
}

export function isPeriodExpired(endsAt, today = toDateInputValue()) {
  if (!endsAt) return true
  return String(endsAt).slice(0, 10) < today
}

/**
 * Define automaticamente o limite de pagamento anual.
 * - renew: novo ciclo de 12 meses a partir de hoje
 * - sem datas / expirado: inicia ciclo de 12 meses
 * - ciclo válido: mantém as datas já calculadas pelo sistema
 */
export function resolveAnnualPeriod(existing = null, { renew = false } = {}) {
  const today = toDateInputValue()
  const expired = isPeriodExpired(existing?.ends_at, today)

  if (renew || !existing?.starts_at || !existing?.ends_at || expired) {
    return {
      starts_at: today,
      ends_at: addOneYear(today),
      renewed: true,
    }
  }

  return {
    starts_at: String(existing.starts_at).slice(0, 10),
    ends_at: String(existing.ends_at).slice(0, 10),
    renewed: false,
  }
}
