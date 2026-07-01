import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, History, X } from 'lucide-react';
import { getClients, createClient, updateClient, deleteClient, getSales, getWorkOrders } from '../services/api';

const ClientManager = ({ companyId, addToast }) => {
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialForm = { id: '', nombre: '', rut: '', email: '', telefono: '' };
  const [formData, setFormData] = useState(initialForm);

  const [showHistoryModal, setShowHistoryModal] = useState(null);
  const [clientHistory, setClientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadClients();
  }, [companyId]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await getClients(companyId);
      setClients(data);
    } catch (error) {
      addToast('Error al cargar clientes: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const getExtraFieldLabel = () => 'RUT / Identificador';

  const handleEdit = (client) => {
    setFormData({
      id: client.id,
      nombre: client.nombre,
      rut: client.rut,
      email: client.email || '',
      telefono: client.telefono || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este cliente?')) return;
    try {
      await deleteClient(companyId, id);
      addToast('Cliente eliminado', 'success');
      loadClients();
    } catch (error) {
      addToast('Error al eliminar cliente: ' + error.message, 'danger');
    }
  };

  const handleViewHistory = async (client) => {
    setShowHistoryModal(client);
    setLoadingHistory(true);
    try {
      const [sales, orders] = await Promise.all([
        getSales(companyId),
        getWorkOrders(companyId)
      ]);

      const clientSales = sales.filter(s => s.cliente_nombre?.toLowerCase() === client.nombre?.toLowerCase() || s.rut_cliente === client.rut)
        .map(s => ({ ...s, tipo_registro: 'Venta', fecha_orden: s.fecha }));
      
      const clientOrders = orders.filter(o => o.cliente_nombre?.toLowerCase() === client.nombre?.toLowerCase() || o.cliente_rut === client.rut)
        .map(o => ({ ...o, tipo_registro: 'Orden de Trabajo', fecha_orden: o.fecha_ingreso }));

      const combined = [...clientSales, ...clientOrders].sort((a, b) => new Date(b.fecha_orden) - new Date(a.fecha_orden));
      setClientHistory(combined);
    } catch (error) {
      addToast('Error al cargar historial: ' + error.message, 'danger');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.rut) {
      addToast('Nombre y RUT son obligatorios', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      if (formData.id) {
        await updateClient(companyId, formData);
        addToast('Cliente actualizado con éxito', 'success');
      } else {
        await createClient(companyId, formData);
        addToast('Cliente registrado con éxito', 'success');
      }
      setShowForm(false);
      setFormData(initialForm);
      loadClients();
    } catch (error) {
      addToast('Error al guardar: ' + error.message, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter(c => 
    (c.nombre && c.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.rut && c.rut.toLowerCase().includes(searchTerm.toLowerCase()))
  );



  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="title-lg" style={{ marginBottom: 0 }}>Cartera de Clientes</h1>
          <p style={{ color: 'var(--text-muted)' }}>Administra la base de datos de tus clientes y clasifícalos.</p>
        </div>
        <button className="btn-primary" onClick={() => {
          setFormData(initialForm);
          setShowForm(!showForm);
        }}>
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      {showForm && (
        <div className="card animate-fade-in" style={{ marginBottom: '32px', borderLeft: '4px solid var(--accent)' , margin: 'auto' }}>
          <h2 className="title-md">{formData.id ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nombre Completo</label>
              <input type="text" placeholder="Ej: Juan Pérez" style={{ width: '100%' }} value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Teléfono</label>
              <input type="text" placeholder="+56 9..." style={{ width: '100%' }} value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Email</label>
              <input type="email" placeholder="correo@ejemplo.com" style={{ width: '100%' }} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 600 }}>{getExtraFieldLabel()}</label>
              <input type="text" placeholder="Ej: 11.111.111-1" style={{ width: '100%', borderColor: 'var(--accent)' }} value={formData.rut} onChange={e => setFormData({...formData, rut: e.target.value})} />
            </div>
          </div>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button style={{ padding: '10px 20px', borderRadius: '8px', color: 'var(--text-muted)' }} onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="btn-success" onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Cliente'}</button>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="title-md" style={{ marginBottom: 0 }}>Listado de Clientes</h2>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={20} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Buscar cliente..." style={{ width: '100%', paddingLeft: '40px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '16px' }}>Cliente</th>
                <th style={{ padding: '16px' }}>Contacto</th>
                <th style={{ padding: '16px' }}>{getExtraFieldLabel()}</th>
                <th style={{ padding: '16px' }}>Estado</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Cargando clientes...</td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No hay clientes registrados.</td>
                </tr>
              ) : filteredClients.map(client => (
                <tr key={client.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '16px', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                        <Users size={20} />
                      </div>
                      {client.nombre}
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Phone size={14}/> {client.telefono || 'N/A'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14}/> {client.email || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{client.rut}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success)', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '100px', fontSize: '0.875rem', fontWeight: 600 }}>
                      🟢 Normal
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button onClick={() => handleViewHistory(client)} style={{ padding: '8px', color: 'var(--success)', marginRight: '8px' }} title="Ver Historial"><History size={18} /></button>
                    <button onClick={() => handleEdit(client)} style={{ padding: '8px', color: 'var(--accent)', marginRight: '8px' }} title="Editar"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(client.id)} style={{ padding: '8px', color: 'var(--danger)' }} title="Eliminar"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showHistoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <div className="card animate-fade-in" style={{ width: '800px', maxWidth: '100%', display: 'flex', flexDirection: 'column' , margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 className="title-md" style={{ marginBottom: '4px' }}>Historial del Cliente</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{showHistoryModal.nombre} ({showHistoryModal.rut})</div>
              </div>
              <button onClick={() => setShowHistoryModal(null)} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingHistory ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando historial...</div>
              ) : clientHistory.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Este cliente no tiene ventas ni órdenes de trabajo registradas.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      <th style={{ padding: '12px' }}>Fecha</th>
                      <th style={{ padding: '12px' }}>Tipo</th>
                      <th style={{ padding: '12px' }}>Detalles</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Monto ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientHistory.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{new Date(item.fecha_orden).toLocaleDateString()}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: item.tipo_registro === 'Venta' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: item.tipo_registro === 'Venta' ? '#10b981' : '#3b82f6' }}>
                            {item.tipo_registro}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          {item.tipo_registro === 'Venta' ? (
                            <div>{(item.detalles ? JSON.parse(item.detalles) : []).map(d => `${d.cantidad}x ${d.nombre}`).join(', ')}</div>
                          ) : (
                            <div>Vehículo: {item.vehiculo} <br/><span style={{ fontSize: '0.75rem' }}>{item.problema_reportado}</span></div>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                          ${item.tipo_registro === 'Venta' ? parseFloat(item.total).toLocaleString() : parseFloat(item.presupuesto || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button className="btn-primary" onClick={() => setShowHistoryModal(null)}>Cerrar Historial</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManager;
