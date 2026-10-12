import React, { useState, useEffect, useCallback } from 'react';
import type { User, Sale, StockSummary } from './types';
import { api, getAuthToken } from './services/api';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewPage } from './pages/overview/OverviewPage';
import { SellersPage } from './pages/sellers/SellersPage';
import { CommissionsPage } from './pages/commissions/CommissionsPage';
import { SalesPage } from './pages/sales/SalesPage';
import { StockPage } from './pages/stock/StockPage';
import { ExtraModulesPage } from './pages/modules/ExtraModulesPage';
import { LoginPage } from './pages/auth/LoginPage';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  
  // Dados centrais compartilhados
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stockSummaries, setStockSummaries] = useState<Record<string, StockSummary[]>>({});
  const [isLoadingData, setIsLoadingData] = useState(false);

  // 1. Carrega dados do backend
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // Busca usuários
      const usersRes = await api.getUsers().catch(() => ({ users: [] }));
      setUsers(usersRes.users || []);

      // Busca vendas
      const salesRes = await api.getSales().catch(() => ({ sales: [] }));
      setSales(salesRes.sales || []);

      // Busca estoques dos vendedores
      const summariesMap: Record<string, StockSummary[]> = {};
      const sellers = (usersRes.users || []).filter((u: User) => u.role === 'SELLER');

      await Promise.all(
        sellers.map(async (s: User) => {
          try {
            const res = await api.getStockSummary(s.id);
            summariesMap[s.id] = res.summary || res.summaries || [];
          } catch {
            summariesMap[s.id] = [];
          }
        })
      );

      setStockSummaries(summariesMap);
    } catch (err) {
      console.error('Erro ao carregar dados do painel:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // 2. Verifica autenticação inicial
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsCheckingAuth(false);
      return;
    }

    api.getMe()
      .then(res => {
        if (res.user && res.user.role === 'ADMIN') {
          setCurrentUser(res.user);
          loadData();
        } else {
          api.logout();
        }
      })
      .catch(() => {
        api.logout();
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, [loadData]);

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    loadData();
  };

  if (isCheckingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-light)', marginBottom: 8 }}>
            NFC CONNECT
          </div>
          <div>Carregando painel executivo...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="dashboard-container">
      {/* Menu Lateral com 9 Módulos */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onLogout={handleLogout}
        userName={currentUser.name}
      />

      {/* Área Central */}
      <div className="dashboard-main">
        {/* Cabeçalho */}
        <Header
          currentTab={currentTab}
          onRefresh={loadData}
          isLoading={isLoadingData}
        />

        {/* Módulos */}
        <main>
          {currentTab === 'overview' && (
            <OverviewPage
              sales={sales}
              users={users}
              stockSummaries={stockSummaries}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'sellers' && (
            <SellersPage
              users={users}
              sales={sales}
              stockSummaries={stockSummaries}
              onRefreshData={loadData}
            />
          )}

          {currentTab === 'commissions' && (
            <CommissionsPage
              users={users}
              sales={sales}
              onRefreshData={loadData}
            />
          )}

          {currentTab === 'sales' && (
            <SalesPage
              sales={sales}
              users={users}
              onRefreshData={loadData}
            />
          )}

          {currentTab === 'stock' && (
            <StockPage
              users={users}
              stockSummaries={stockSummaries}
              onRefreshData={loadData}
            />
          )}

          {(currentTab === 'crm' || currentTab === 'nfc' || currentTab === 'materials' || currentTab === 'security') && (
            <ExtraModulesPage
              currentTab={currentTab}
              sales={sales}
              users={users}
            />
          )}
        </main>
      </div>
    </div>
  );
};
