import { PageHeader } from '@/components/ui'
import { useCompany } from '@/contexts/CompanyContext'

export default function PrivacyPage() {
  const { settings } = useCompany()

  return (
    <div className="animate-fade-up mx-auto max-w-3xl space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <PageHeader title="Política de Privacidade" subtitle={settings.company_name} />
      <p className="text-sm leading-relaxed text-ink-700">
        A {settings.company_name} recolhe e trata dados pessoais necessários à prestação dos serviços
        de restaurante e hospedaria, nomeadamente nome, telefone, e-mail e histórico de pedidos/reservas.
      </p>
      <p className="text-sm leading-relaxed text-ink-700">
        Os dados são utilizados exclusivamente para gestão de solicitações, comunicação com o cliente e
        melhoria do serviço. Não vendemos dados a terceiros. O acesso administrativo é restrito a
        utilizadores autorizados.
      </p>
      <p className="text-sm leading-relaxed text-ink-700">
        Pode solicitar a actualização ou eliminação dos seus dados através dos contactos oficiais da
        empresa: {settings.email} · {settings.phone}.
      </p>
      <p className="text-xs text-ink-500">Documento base para publicação nas lojas. Adapte com aconselhamento jurídico local antes do lançamento.</p>
    </div>
  )
}
