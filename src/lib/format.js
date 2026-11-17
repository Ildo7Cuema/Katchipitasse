export function formatCurrency(value) {
  const amount = Number(value) || 0
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function statusLabel(status) {
  const map = {
    pendente: 'Pendente',
    confirmado: 'Confirmado',
    confirmada: 'Confirmada',
    em_preparacao: 'Em preparação',
    concluido: 'Concluído',
    concluida: 'Concluída',
    cancelado: 'Cancelado',
    cancelada: 'Cancelada',
    ocupada: 'Ocupada',
  }
  return map[status] || status
}

export function statusTone(status) {
  if (status?.startsWith('cancel')) return 'bg-danger/15 text-danger'
  if (status?.startsWith('conclu')) return 'bg-success/15 text-success'
  if (status === 'pendente') return 'bg-warning/15 text-warning'
  if (status === 'em_preparacao' || status === 'ocupada') return 'bg-clay-500/15 text-clay-600'
  return 'bg-brand-700/15 text-brand-800'
}
