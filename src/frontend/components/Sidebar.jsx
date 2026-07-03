import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  PackageSearch, 
  Wallet,
  Building2,
  Settings,
  Calendar,
  Users,
  LineChart,
  DollarSign,
  UserCheck,
  ClipboardList,
  BarChart2,
  FileText
} from 'lucide-react';
import billyCarLogo from "../../../Logo Villy Car.jpg";
import j2Logo from "../../../Logfo j2 publicidad.jpeg";
import tallerLogo from "../../../Logo taller.jpeg";
import transportesLogo from "../../../Logos/transportes.png";

const Sidebar = ({ currentCompany, setCurrentCompany, activeTab, setActiveTab, currentUser, onLogout }) => {
  const companies = [
    { id: '1', name: 'J2 Publicidad' },
    { id: '2', name: 'Dwork' },
    { id: '3', name: 'Villy Car Tuning' },
    { id: '4', name: 'Transportes J2' },
  ];

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analítica', icon: BarChart2 },
    { id: 'calendar', label: 'Agenda / Turnos', icon: Calendar },
    { id: 'quotes', label: 'Cotizaciones', icon: FileText },
    { id: 'clients', label: 'Cartera de Clientes', icon: Users },
    { id: 'products', label: 'Mantenedor Productos', icon: PackageSearch },
    { id: 'expenses', label: 'Egresos e Ingresos', icon: Wallet },
    { id: 'financial', label: 'Finanzas Centrales', icon: LineChart },
    { id: 'accounts', label: 'Cobros y Pagos', icon: DollarSign },
    { id: 'workorders', label: 'Órdenes de Trabajo', icon: ClipboardList },
    { id: 'rrhh', label: 'RRHH & Sueldos', icon: UserCheck },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const menuItems = currentUser?.rol === 'trabajador'
    ? allMenuItems.filter(item => ['calendar', 'workorders'].includes(item.id))
    : allMenuItems;

  const getCompanyHeader = () => {
    if (currentCompany === '3') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px', animation: 'fadeIn 0.5s ease' }}>
           <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '12px', border: '2px solid var(--accent)', marginBottom: '12px', width: '100%', display: 'flex', justifyContent: 'center' }}>
             <img src={billyCarLogo} alt="Villy Car Tuning Logo" style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '4px' }} />
           </div>
           <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
             Villy Car Tuning
           </span>
        </div>
      );
    }
    if (currentCompany === '1') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px', animation: 'fadeIn 0.5s ease' }}>
           <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '12px', border: '2px solid var(--accent)', marginBottom: '12px', width: '100%', display: 'flex', justifyContent: 'center' }}>
             <img src={j2Logo} alt="J2 Publicidad Logo" style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '4px' }} />
           </div>
           <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
             J2 Publicidad
           </span>
        </div>
      );
    }
    if (currentCompany === '2') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px', animation: 'fadeIn 0.5s ease' }}>
           <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '12px', border: '2px solid var(--accent)', marginBottom: '12px', width: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
             <img src={tallerLogo} alt="Dwork Logo" style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '4px' }} />
             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: currentCompany === '2' ? 1 : 0, transition: 'opacity 0.2s', fontWeight: 'bold', fontSize: '1.2rem', textShadow: '0px 2px 4px rgba(0,0,0,0.8)', color: 'white' }}>
             Dwork
             </div>
           </div>
           <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
             Dwork
           </span>
        </div>
      );
    }
    if (currentCompany === '4') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px', animation: 'fadeIn 0.5s ease' }}>
           <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '12px', border: '2px solid var(--accent)', marginBottom: '12px', width: '100%', display: 'flex', justifyContent: 'center' }}>
             <img src={transportesLogo} alt="Transportes J2 Logo" style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '4px' }} />
           </div>
           <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
             Transportes J2
           </span>
        </div>
      );
    }
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-muted)' }}>
        <Building2 size={20} />
        <span style={{ fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Empresa Activa
        </span>
      </div>
    );
  };

  return (
    <div style={{
      width: 'var(--sidebar-w)',
      height: '100vh',
      backgroundColor: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px'
    }}>
      {/* Company Selector */}
      <div style={{ marginBottom: '32px' }}>
        {getCompanyHeader()}
        
        <select 
          value={currentCompany}
          onChange={(e) => setCurrentCompany(e.target.value)}
          disabled={currentUser?.rol === 'trabajador'}
          style={{ width: '100%', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', color: 'white', fontWeight: 500, cursor: currentUser?.rol === 'trabajador' ? 'not-allowed' : 'pointer', opacity: currentUser?.rol === 'trabajador' ? 0.7 : 1 }}
        >
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0, padding: 0 }}>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? 'white' : 'var(--text-muted)',
                    textAlign: 'left',
                    fontWeight: isActive ? 600 : 500,
                  }}
                  onMouseEnter={(e) => {
                    if(!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                      e.currentTarget.style.color = 'var(--text-main)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if(!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Settings */}
      <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
        {currentUser && (
          <div style={{ padding: '0 16px 16px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>
            Sesión: <strong>{currentUser.nombre}</strong><br/>
            Rol: <strong>{currentUser.rol}</strong>
          </div>
        )}
        <button 
          onClick={onLogout}
          style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-main)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center', fontWeight: 600, transition: 'background-color 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
