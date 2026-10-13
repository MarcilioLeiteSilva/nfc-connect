import { useState, useEffect } from 'react';
import { storageService } from './services/storageService';
import { setAuthToken, api } from './services/api';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { OfflineBanner } from './components/OfflineBanner';
import { PwaInstallModal } from './components/PwaInstallModal';
import { SplashScreen } from './components/SplashScreen';
import { LoginPage } from './pages/auth/LoginPage';

// Páginas do Vendedor
import { SellerHome } from './pages/seller/SellerHome';
import { SellerStock } from './pages/seller/SellerStock';
import { SellerNewSale } from './pages/seller/SellerNewSale';
import { SellerHistory } from './pages/seller/SellerHistory';
import { SellerMaterials } from './pages/seller/SellerMaterials';

// Páginas do Administrador
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminStockManagement } from './pages/admin/AdminStockManagement';
import { AdminSellersManagement } from './pages/admin/AdminSellersManagement';
import { AdminCommissions } from './pages/admin/AdminCommissions';

import './App.css';

export function App() {
  const [, setTick] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Estado de Login (persiste no localStorage para não pedir senha a cada reload no celular)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('nfc_is_authenticated') === 'true';
  });

  // Assinatura ao Storage para re-renderizar quando houver qualquer alteração de dados
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setTick(t => t + 1);
    });
    return unsubscribe;
  }, []);

  // Monitoramento de conexão de rede (Online / Offline)
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      try {
        const synced = await storageService.syncPendingSales();
        if (synced > 0) {
          console.log(`[PWA] ${synced} venda(s) criptografada(s) sincronizada(s) com o PostgreSQL com sucesso!`);
        }
        await storageService.syncSellerDataFromApi();
      } catch (err) {
        console.error('Erro na sincronização:', err);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Validação da sessão no PostgreSQL ao iniciar
    if (isAuthenticated) {
      api.getMe().then((res: any) => {
        if (res.user) {

          storageService.setCurrentUser(res.user);
          if (res.user.role === 'ADMIN') {
            storageService.fetchAdminUsersFromApi();
          } else {
            storageService.syncSellerDataFromApi();
          }
        }
      }).catch(() => {
        handleLogout();
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated]);

  const currentUser = storageService.getCurrentUser();
  const [sellerTab, setSellerTab] = useState('home');
  const [adminTab, setAdminTab] = useState('overview');

  const pendingSales = storageService
    .getSales()
    .filter(s => s.status === 'PENDING_SYNC');

  const handleManualSync = async () => {
    const synced = await storageService.syncPendingSales();
    alert(synced > 0 ? `${synced} venda(s) sincronizada(s) com o banco!` : 'Nenhuma venda pendente para sincronizar.');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem('nfc_is_authenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('nfc_is_authenticated');
    setAuthToken(null);
    storageService.clearSession();
  };


  const currentTab = currentUser.role === 'ADMIN' ? adminTab : sellerTab;
  const setCurrentTab = (tab: string) => {
    if (currentUser.role === 'ADMIN') {
      setAdminTab(tab);
    } else {
      setSellerTab(tab);
    }
  };

  // Se a tela splash estiver ativa, exibe primeiro
  if (showSplash) {
    return (
      <SplashScreen
        durationMs={2500}
        onFinish={() => setShowSplash(false)}
      />
    );
  }

  // Se não estiver logado, exibe a tela de login oficial
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-wrapper">
      <div className={`app-container ${currentUser.role === 'ADMIN' ? 'admin-expanded' : ''}`}>
        {/* Cabeçalho */}
        <Header
          currentUser={currentUser}
          isOnline={isOnline}
          onOpenPwaModal={() => setShowPwaModal(true)}
          onShowSplash={() => setShowSplash(true)}
          onLogout={handleLogout}
          pendingSyncCount={pendingSales.length}
        />

        {/* Banner de status offline ou fila de sincronização */}
        <OfflineBanner
          isOnline={isOnline}
          pendingSyncCount={pendingSales.length}
          onSyncNow={handleManualSync}
        />

        {/* Conteúdo Dinâmico por Papel (Vendedor vs Administrador) */}
        {currentUser.role === 'SELLER' ? (
          <>
            {sellerTab === 'home' && (
              <SellerHome
                currentUser={currentUser}
                onNavigate={setSellerTab}
              />
            )}
            {sellerTab === 'stock' && (
              <SellerStock currentUser={currentUser} />
            )}
            {sellerTab === 'new_sale' && (
              <SellerNewSale
                currentUser={currentUser}
                isOnline={isOnline}
                onSaleSuccess={() => setSellerTab('home')}
              />
            )}
            {sellerTab === 'history' && (
              <SellerHistory currentUser={currentUser} />
            )}
            {sellerTab === 'materials' && (
              <SellerMaterials />
            )}
          </>
        ) : (
          <>
            {adminTab === 'overview' && (
              <AdminDashboard onNavigate={setAdminTab} />
            )}
            {adminTab === 'stock_mgmt' && (
              <AdminStockManagement />
            )}
            {adminTab === 'sellers' && (
              <AdminSellersManagement />
            )}
            {adminTab === 'commissions' && (
              <AdminCommissions />
            )}
          </>
        )}

        {/* Barra de Navegação Inferior (Mobile-First) */}
        <BottomNav
          role={currentUser.role}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
        />

        {/* Modal de Instruções de Instalação PWA (iPhone / Android) */}
        <PwaInstallModal
          isOpen={showPwaModal}
          onClose={() => setShowPwaModal(false)}
        />
      </div>
    </div>
  );
}

export default App;
