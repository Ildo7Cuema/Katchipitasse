import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '@/components/AppShell'
import AdminShell from '@/components/AdminShell'
import RequireAuth from '@/components/RequireAuth'
import RequireStoreAdmin from '@/components/RequireStoreAdmin'
import RequireSuperAdmin from '@/components/RequireSuperAdmin'
import HomePage from '@/pages/app/HomePage'
import RestaurantPage from '@/pages/app/RestaurantPage'
import DishDetailPage from '@/pages/app/DishDetailPage'
import LodgingPage from '@/pages/app/LodgingPage'
import RoomDetailPage from '@/pages/app/RoomDetailPage'
import ContactsPage from '@/pages/app/ContactsPage'
import ProfilePage, { MyOrdersPage, MyReservationsPage } from '@/pages/app/ProfilePage'
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
} from '@/pages/app/AuthPages'
import PrivacyPage from '@/pages/PrivacyPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import CategoriesAdminPage from '@/pages/admin/CategoriesAdminPage'
import DishesAdminPage from '@/pages/admin/DishesAdminPage'
import RoomsAdminPage from '@/pages/admin/RoomsAdminPage'
import OrdersAdminPage from '@/pages/admin/OrdersAdminPage'
import ReservationsAdminPage from '@/pages/admin/ReservationsAdminPage'
import CustomersAdminPage from '@/pages/admin/CustomersAdminPage'
import SettingsAdminPage from '@/pages/admin/SettingsAdminPage'
import StaffAdminPage from '@/pages/admin/StaffAdminPage'
import SubscriptionsAdminPage from '@/pages/admin/SubscriptionsAdminPage'
import StoreSubscriptionPage from '@/pages/admin/StoreSubscriptionPage'
import PaymentGpoAdminPage from '@/pages/admin/PaymentGpoAdminPage'
import RulesAdminPage from '@/pages/admin/RulesAdminPage'
import PlatformSettingsPage from '@/pages/admin/PlatformSettingsPage'
import UsageMonitorPage from '@/pages/admin/UsageMonitorPage'
import UsageTracker from '@/components/UsageTracker'

function StoreOnly({ children }) {
  return <RequireStoreAdmin>{children}</RequireStoreAdmin>
}

function SuperOnly({ children }) {
  return <RequireSuperAdmin>{children}</RequireSuperAdmin>
}

export default function App() {
  return (
    <BrowserRouter>
      <UsageTracker />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="restaurante" element={<RestaurantPage />} />
          <Route path="restaurante/:id" element={<DishDetailPage />} />
          <Route path="hospedaria" element={<LodgingPage />} />
          <Route path="hospedaria/:id" element={<RoomDetailPage />} />
          <Route path="contactos" element={<ContactsPage />} />
          <Route path="perfil" element={<ProfilePage />} />
          <Route path="perfil/pedidos" element={<MyOrdersPage />} />
          <Route path="perfil/reservas" element={<MyReservationsPage />} />
          <Route path="entrar" element={<LoginPage />} />
          <Route path="registar" element={<RegisterPage />} />
          <Route path="recuperar-password" element={<ForgotPasswordPage />} />
          <Route path="redefinir-password" element={<ResetPasswordPage />} />
          <Route path="privacidade" element={<PrivacyPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAuth admin>
              <AdminShell />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />

          {/* Operação da loja — apenas admin (dono) */}
          <Route path="categorias" element={<StoreOnly><CategoriesAdminPage /></StoreOnly>} />
          <Route path="pratos" element={<StoreOnly><DishesAdminPage /></StoreOnly>} />
          <Route path="quartos" element={<StoreOnly><RoomsAdminPage /></StoreOnly>} />
          <Route path="pedidos" element={<StoreOnly><OrdersAdminPage /></StoreOnly>} />
          <Route path="reservas" element={<StoreOnly><ReservationsAdminPage /></StoreOnly>} />
          <Route path="clientes" element={<StoreOnly><CustomersAdminPage /></StoreOnly>} />
          <Route path="configuracoes" element={<StoreOnly><SettingsAdminPage /></StoreOnly>} />
          <Route path="assinatura" element={<StoreOnly><StoreSubscriptionPage /></StoreOnly>} />
          {/* GPO de pagamentos — Super Admin (plataforma) ou Admin (clientes) */}
          <Route path="pagamentos" element={<PaymentGpoAdminPage />} />

          {/* Plataforma — apenas super_admin */}
          <Route path="assinaturas" element={<SuperOnly><SubscriptionsAdminPage /></SuperOnly>} />
          <Route path="regras" element={<SuperOnly><RulesAdminPage /></SuperOnly>} />
          <Route path="utilizacao" element={<SuperOnly><UsageMonitorPage /></SuperOnly>} />
          <Route path="plataforma" element={<SuperOnly><PlatformSettingsPage /></SuperOnly>} />
          <Route path="utilizadores" element={<SuperOnly><StaffAdminPage /></SuperOnly>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
