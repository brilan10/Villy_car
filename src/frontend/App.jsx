import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PointOfSale from './components/PointOfSale';
import ProductManager from './components/ProductManager';
import ExpenseManager from './components/ExpenseManager';
import CalendarManager from './components/CalendarManager';
import ClientManager from './components/ClientManager';
import FinancialManager from './components/FinancialManager';
import AccountsManager from './components/AccountsManager';
import HRManager from './components/HRManager';
import WorkOrderManager from './components/WorkOrderManager';
import AnalyticsManager from './components/AnalyticsManager';
import SettingsManager from './components/SettingsManager';
import Login from './components/Login';
import QuotationManager from './components/QuotationManager';

export const UserContext = React.createContext(null);

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('villy_car_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentCompany, setCurrentCompany] = useState(() => {
    const saved = localStorage.getItem('villy_car_company');
    return (saved && saved !== 'undefined' && saved !== 'null') ? saved : '1';
  });
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('villy_car_tab');
    const savedUserStr = localStorage.getItem('villy_car_user');
    let savedUser = null;
    try { savedUser = JSON.parse(savedUserStr); } catch(e){}
    
    if (savedUser && savedUser.rol === 'trabajador' && (!savedTab || savedTab === 'dashboard' || savedTab === 'settings' || savedTab === 'accounts' || savedTab === 'analytics')) {
      return 'workorders';
    }
    return savedTab || 'dashboard';
  });

  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  useEffect(() => {
    localStorage.setItem('villy_car_company', currentCompany);
  }, [currentCompany]);

  useEffect(() => {
    localStorage.setItem('villy_car_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('villy_car_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('villy_car_user');
    }
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    if (user.empresa_id) {
      setCurrentCompany(user.empresa_id.toString());
    } else {
      setCurrentCompany('1');
    }
    if (user.rol === 'trabajador') {
      setActiveTab('workorders');
    } else {
      setActiveTab('dashboard');
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} addToast={addToast} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard companyId={currentCompany} addToast={addToast} />;
      case 'analytics':
        return <AnalyticsManager companyId={currentCompany} addToast={addToast} />;
      case 'calendar':
        return <CalendarManager companyId={currentCompany} addToast={addToast} />;
      case 'pos':
        return <PointOfSale companyId={currentCompany} addToast={addToast} />;
      case 'quotes':
        return <QuotationManager companyId={currentCompany} addToast={addToast} />;
      case 'clients':
        return <ClientManager companyId={currentCompany} addToast={addToast} />;
      case 'products':
        return <ProductManager companyId={currentCompany} addToast={addToast} />;
      case 'expenses':
        return <ExpenseManager companyId={currentCompany} addToast={addToast} />;
      case 'financial':
        return <FinancialManager companyId={currentCompany} addToast={addToast} />;
      case 'accounts':
        return <AccountsManager companyId={currentCompany} addToast={addToast} />;
      case 'rrhh':
        return <HRManager companyId={currentCompany} addToast={addToast} />;
      case 'workorders':
        return <WorkOrderManager companyId={currentCompany} addToast={addToast} />;
      case 'settings':
        return <SettingsManager companyId={currentCompany} addToast={addToast} />;
      default:
        return <Dashboard companyId={currentCompany} addToast={addToast} />;
    }
  };

  const getThemeVars = () => {
    switch(currentCompany) {
      case '1': // Agencia Marketing (J2 Publicidad) - Royal Purple
        return { '--accent': '#8b5cf6', '--accent-hover': '#7c3aed', '--bg-main': '#120f1a', '--bg-card': '#1f1a2e', '--bg-gradient': 'linear-gradient(-45deg, #120f1a, #1f1a2e, #120f1a, #0a0812)' };
      case '2': // Dwork - Industrial Amber
        return { '--accent': '#f59e0b', '--accent-hover': '#d97706', '--bg-main': '#0f172a', '--bg-card': '#1e293b', '--bg-gradient': 'linear-gradient(-45deg, #0f172a, #1e293b, #0f172a, #0b0f19)' };
      case '3': // Automotriz (Villy Car) - Sleek Red/Crimson
        return { '--accent': '#ef4444', '--accent-hover': '#dc2626', '--bg-main': '#1a0f0f', '--bg-card': '#2e1a1a', '--bg-gradient': 'linear-gradient(-45deg, #1a0f0f, #2e1a1a, #1a0f0f, #0f0808)' };
      case '4': // Transportes - Slate Gray
        return { '--accent': '#64748b', '--accent-hover': '#475569', '--bg-main': '#0f1115', '--bg-card': '#1e222a', '--bg-gradient': 'linear-gradient(-45deg, #0f1115, #1e222a, #0f1115, #0a0b0e)' };
      default:
        return { '--accent': '#6366f1', '--accent-hover': '#4f46e5' };
    }
  };

  return (
    <UserContext.Provider value={{ currentUser, handleLogout }}>
      <div className="app-container animated-bg" style={{...getThemeVars(), background: 'var(--bg-gradient)'}}>
        <Sidebar 
          currentCompany={currentCompany} 
          setCurrentCompany={setCurrentCompany} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      <main className="main-content" style={{ transition: 'background-color 0.5s ease' }}>
        <div key={`${currentCompany}-${activeTab}`} className="animate-fade-in" style={{ animationDuration: '0.6s' }}>
          {renderContent()}
        </div>
      </main>

      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className="animate-fade-in"
            style={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.95)', 
              backdropFilter: 'blur(8px)',
              color: 'white', 
              padding: '16px 20px', 
              borderRadius: '12px', 
              borderLeft: `6px solid ${toast.type === 'error' || toast.type === 'danger' ? '#ef4444' : toast.type === 'success' ? '#10b981' : '#f59e0b'}`, 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
              minWidth: '340px',
              maxWidth: '420px',
              animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {toast.type === 'success' ? <CheckCircle size={24} color="#10b981" /> : 
               (toast.type === 'error' || toast.type === 'danger') ? <AlertTriangle size={24} color="#ef4444" /> : 
               <Info size={24} color="#f59e0b" />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
                  {toast.type === 'success' ? 'Éxito' : (toast.type === 'error' || toast.type === 'danger') ? 'Error' : 'Información'}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#cbd5e1', lineHeight: '1.4' }}>{toast.message}</span>
              </div>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} style={{ color: '#94a3b8', cursor: 'pointer', padding: '4px', background: 'transparent', border: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
    </UserContext.Provider>
  );
}

export default App;
