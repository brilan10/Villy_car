import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';
import { getWorkers, setWorkerPassword, changeWorkerPassword, toggleWorkerStatus } from '../services/api';
import { Key, Shield, User, Users, Check, X as XIcon, Search } from 'lucide-react';

const SettingsManager = ({ companyId, addToast }) => {
  const { currentUser } = useContext(UserContext);
  const isAdmin = currentUser && currentUser.rol === 'admin';

  // State for Change Password (All Users)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State for Create User (Admin Only)
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [adminAssignPassword, setAdminAssignPassword] = useState('');
  const [adminAssignRole, setAdminAssignRole] = useState('trabajador');

  // State for Manage Users (Admin Only)
  const [searchTerm, setSearchTerm] = useState('');

  const loadWorkers = () => {
    if (isAdmin) {
      getWorkers(companyId, true).then(data => setWorkers(data || [])).catch(e => console.error(e));
    }
  };

  useEffect(() => {
    loadWorkers();
  }, [isAdmin, companyId]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('Las contraseñas no coinciden', 'danger');
      return;
    }
    try {
      await changeWorkerPassword(companyId, {
        id: currentUser.id,
        current_password: currentPassword,
        new_password: newPassword
      });
      addToast('Contraseña cambiada exitosamente', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      addToast('Error: ' + error.message, 'danger');
    }
  };

  const handleAdminAssignPassword = async (e) => {
    e.preventDefault();
    if (!selectedWorkerId || !adminAssignPassword) {
      addToast('Seleccione un trabajador y asigne una contraseña', 'warning');
      return;
    }
    try {
      await setWorkerPassword(companyId, {
        id: selectedWorkerId,
        password: adminAssignPassword,
        rol: adminAssignRole
      });
      addToast('Usuario habilitado y contraseña asignada con éxito', 'success');
      setSelectedWorkerId('');
      setAdminAssignPassword('');
      setAdminAssignRole('trabajador');
      loadWorkers();
    } catch (error) {
      addToast('Error: ' + error.message, 'danger');
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="title-lg" style={{ marginBottom: 0 }}>Configuración de la Cuenta</h1>
          <p style={{ color: 'var(--text-muted)' }}>Administra tu seguridad y accesos del sistema.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {/* Cambiar Mi Contraseña */}
        <div className="card" style={{ padding: '24px' , margin: 'auto' }}>
          <h2 className="title-md" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={20} /> Cambiar Mi Contraseña
          </h2>
          <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Contraseña Actual</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nueva Contraseña</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={4} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Confirmar Nueva Contraseña</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={4} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '12px', marginTop: '8px' }}>Actualizar Contraseña</button>
          </form>
        </div>

        {/* Admin: Asignar Usuario a Trabajador */}
        {isAdmin && (
          <div className="card" style={{ padding: '24px' , margin: 'auto' }}>
            <h2 className="title-md" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} color="var(--accent)" /> Habilitar Accesos (Crear Usuarios)
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.875rem' }}>Selecciona un trabajador existente para crearle una cuenta de usuario y asignarle una contraseña temporal.</p>
            <form onSubmit={handleAdminAssignPassword} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Seleccionar Trabajador</label>
                <select value={selectedWorkerId} onChange={e => setSelectedWorkerId(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }}>
                  <option value="">-- Seleccionar Trabajador por RUT --</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.rut} - {w.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Rol de Sistema</label>
                <select value={adminAssignRole} onChange={e => setAdminAssignRole(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }}>
                  <option value="trabajador">Trabajador (Rol Normal)</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Asignar Contraseña Inicial</label>
                <input type="text" value={adminAssignPassword} onChange={e => setAdminAssignPassword(e.target.value)} required minLength={4} placeholder="Ej: 1234" style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} />
              </div>
              <button type="submit" className="btn-success" style={{ padding: '12px', marginTop: '8px' }}>Crear / Actualizar Usuario</button>
            </form>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="card" style={{ padding: '24px', marginTop: '24px' , margin: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="title-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Users size={20} color="var(--accent)" /> Gestión de Usuarios y Trabajadores
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-main)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <Search size={16} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Buscar por RUT o Nombre..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ backgroundColor: 'transparent', border: 'none', color: 'white', outline: 'none' }}
              />
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <th style={{ padding: '12px' }}>RUT</th>
                  <th style={{ padding: '12px' }}>Nombre</th>
                  <th style={{ padding: '12px' }}>Cargo</th>
                  <th style={{ padding: '12px' }}>Rol (Sistema)</th>
                  <th style={{ padding: '12px' }}>Estado</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {workers
                  .filter(w => w.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || w.rut.includes(searchTerm))
                  .map(w => (
                  <tr key={w.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '12px' }}>{w.rut}</td>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'white' }}>{w.nombre}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{w.cargo}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 8px', 
                        borderRadius: '100px', 
                        backgroundColor: w.rol === 'admin' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: w.rol === 'admin' ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: w.rol === 'admin' ? 700 : 400
                      }}>
                        {w.rol?.toUpperCase() || 'TRABAJADOR'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 8px', 
                        borderRadius: '100px', 
                        backgroundColor: parseInt(w.activo) === 1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: parseInt(w.activo) === 1 ? 'var(--success)' : 'var(--danger)',
                        fontWeight: 600
                      }}>
                        {parseInt(w.activo) === 1 ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button 
                        onClick={async () => {
                          try {
                            await toggleWorkerStatus(companyId, w.id, parseInt(w.activo) === 1 ? 0 : 1);
                            addToast(`Estado de ${w.nombre} actualizado.`, 'success');
                            loadWorkers();
                          } catch (err) {
                            addToast('Error al cambiar estado: ' + err.message, 'danger');
                          }
                        }}
                        style={{
                          backgroundColor: parseInt(w.activo) === 1 ? 'var(--bg-main)' : 'var(--success)',
                          border: `1px solid ${parseInt(w.activo) === 1 ? 'var(--danger)' : 'transparent'}`,
                          color: parseInt(w.activo) === 1 ? 'var(--danger)' : 'white',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {parseInt(w.activo) === 1 ? <XIcon size={14} /> : <Check size={14} />}
                        {parseInt(w.activo) === 1 ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
                {workers.length === 0 && (
                  <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay trabajadores registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsManager;
