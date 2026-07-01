import React, { useState } from 'react';
import { User, Lock, LogIn } from 'lucide-react';
import { loginUser } from '../services/api';

const Login = ({ onLogin, addToast }) => {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rut || !password) {
      addToast('Por favor ingrese RUT y contraseña.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const response = await loginUser(rut, password);
      if (response && response.success && response.user) {
        onLogin(response.user);
        addToast(`Bienvenido ${response.user.nombre}`, 'success');
      } else {
        addToast('Credenciales incorrectas.', 'danger');
      }
    } catch (error) {
      addToast('Error al iniciar sesión: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.9)), url('/825749.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <div className="animate-fade-in" style={{ 
        width: '100%', 
        maxWidth: '420px', 
        padding: '40px', 
        background: 'rgba(30, 41, 59, 0.6)', 
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        borderRadius: '24px', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.05)' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img 
            src="/logo.jpg" 
            alt="Villy Car Logo" 
            style={{ 
              width: '120px', 
              height: '120px', 
              objectFit: 'cover', 
              borderRadius: '50%', 
              marginBottom: '16px',
              border: '4px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }} 
          />
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.5px' }}>MULTI EMPRESA</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>Gestión Integral</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 600 }}>RUT del Trabajador</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Ej: 11.111.111-1" 
                value={rut}
                onChange={e => setRut(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '14px 14px 14px 44px', 
                  backgroundColor: 'rgba(15, 23, 42, 0.6)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: 'white', 
                  borderRadius: '12px', 
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }} 
                onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 600 }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94a3b8' }} />
              <input 
                type="password" 
                placeholder="Ingresa tu contraseña" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '14px 14px 14px 44px', 
                  backgroundColor: 'rgba(15, 23, 42, 0.6)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: 'white', 
                  borderRadius: '12px', 
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }} 
                onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center', 
              padding: '14px', 
              marginTop: '12px', 
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.2s, transform 0.1s',
              boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)'
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = '#4f46e5')}
            onMouseLeave={e => !loading && (e.currentTarget.style.backgroundColor = '#6366f1')}
            onMouseDown={e => !loading && (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={e => !loading && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {loading ? 'Verificando...' : <><LogIn size={20} style={{ marginRight: '8px' }} /> Ingresar al Sistema</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
