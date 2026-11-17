import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import InstallGate from '@/components/InstallGate'
import PwaUpdateToast from '@/components/PwaUpdateToast'
import { AuthProvider } from '@/contexts/AuthContext'
import { CompanyProvider } from '@/contexts/CompanyContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { PlatformAccessProvider } from '@/contexts/PlatformAccessContext'
import { ToastProvider } from '@/contexts/ToastContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <CompanyProvider>
          <PlatformAccessProvider>
            <NotificationProvider>
              <InstallGate>
                <App />
                <PwaUpdateToast />
              </InstallGate>
            </NotificationProvider>
          </PlatformAccessProvider>
        </CompanyProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
