/** Compatibilidade — comprovativos de assinatura usam a GPO platform. */
export {
  displayProofPhone as subscriptionProofPhone,
  buildSubscriptionProofWhatsAppUrl,
  methodLabel,
  PAYMENT_METHOD_OPTIONS,
} from '@/lib/paymentGpo'

/** Fallback local se a GPO ainda não existir na base (antes da migration 007). */
export const SUBSCRIPTION_PROOF_PHONE = '921923232'
export const SUBSCRIPTION_PROOF_WHATSAPP = '244921923232'

export function fallbackPlatformGpo() {
  return {
    scope: 'platform',
    enabled: true,
    proof_phone: SUBSCRIPTION_PROOF_PHONE,
    proof_whatsapp: SUBSCRIPTION_PROOF_WHATSAPP,
    account_name: '',
    bank_name: '',
    iban: '',
    multicaixa_entity: '',
    multicaixa_reference: '',
    methods: ['transferencia', 'multicaixa', 'cash'],
    instructions:
      'Envie o comprovativo da assinatura anual para este WhatsApp. Após validação, a aplicação é reactivada.',
  }
}
