/** Opções pré-definidas para valores de regras — evita erros de digitação. */

const BOOLEAN_YES_NO = [
  { value: 'true', label: 'Sim' },
  { value: 'false', label: 'Não' },
]

export const RULE_VALUE_CONFIG = {
  reserva_confirmacao_obrigatoria: {
    label: 'Confirmação administrativa',
    helper: 'Reservas só ficam confirmadas após validação do admin da loja.',
    options: [
      { value: 'true', label: 'Sim — confirmação obrigatória pelo admin' },
      { value: 'false', label: 'Não — confirmação automática' },
    ],
  },
  pedido_sem_pagamento_online: {
    label: 'Pagamento dos pedidos',
    helper: 'Define se os pedidos seguem sem pagamento electrónico na app.',
    options: [
      { value: 'true', label: 'Sem pagamento online (tratar com a empresa)' },
      { value: 'false', label: 'Permitir pagamento online' },
    ],
  },
  antecedencia_minima_reserva_horas: {
    label: 'Antecedência mínima',
    helper: 'Horas mínimas antes do check-in para aceitar uma reserva.',
    options: [
      { value: '0', label: '0 horas — sem antecedência' },
      { value: '6', label: '6 horas' },
      { value: '12', label: '12 horas' },
      { value: '24', label: '24 horas (1 dia)' },
      { value: '48', label: '48 horas (2 dias)' },
      { value: '72', label: '72 horas (3 dias)' },
      { value: '120', label: '120 horas (5 dias)' },
      { value: '168', label: '168 horas (7 dias)' },
    ],
  },
  cancelamento_cliente_permitido: {
    label: 'Cancelamento pelo cliente',
    helper: 'Se o cliente pode cancelar pedidos/reservas enquanto estiverem pendentes.',
    options: [
      { value: 'true', label: 'Sim — cliente pode cancelar' },
      { value: 'false', label: 'Não — apenas o admin pode cancelar' },
    ],
  },
}

export function getRuleValueConfig(ruleKey) {
  return (
    RULE_VALUE_CONFIG[ruleKey] || {
      label: 'Valor',
      helper: 'Seleccione uma opção válida.',
      options: BOOLEAN_YES_NO,
    }
  )
}

export function normalizeRuleValue(ruleKey, value) {
  const config = getRuleValueConfig(ruleKey)
  const current = String(value ?? '').trim()
  if (config.options.some((opt) => opt.value === current)) return current
  return config.options[0]?.value || 'false'
}
