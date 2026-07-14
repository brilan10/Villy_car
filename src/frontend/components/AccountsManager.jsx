import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, FileText, User, DollarSign, CheckCircle2, ChevronRight, X, AlertTriangle, Download, Trash2 } from 'lucide-react';
import { getAccounts, createAccount, updateAccount, addPayment, createFinanceTx, getWorkers, getFinances, deleteAccount } from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AccountsManager = ({ companyId, addToast }) => {
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(null);
  const [showAbonoModal, setShowAbonoModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [finances, setFinances] = useState([]);
  const [isRutFocused, setIsRutFocused] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [viewFilter, setViewFilter] = useState('ambas'); // 'ambas', 'cobrar', 'pagar'
  const [editingAccount, setEditingAccount] = useState(null);
  
  // Form states
  const [newType, setNewType] = useState('cobrar');
  const [newEntityType, setNewEntityType] = useState('cliente');
  const [newRut, setNewRut] = useState('');
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDocNumber, setNewDocNumber] = useState('');

  // Abono input
  const [abonoValue, setAbonoValue] = useState('');

  // EDP (Estado de Pago Consolidado) states
  const [selectedEdpRut, setSelectedEdpRut] = useState(null);
  const [selectedEdpType, setSelectedEdpType] = useState('cobrar');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAccounts(companyId);
      setAccounts(data);
      const workersData = await getWorkers(companyId);
      setWorkers(workersData);
      const financesData = await getFinances(companyId);
      setFinances(Array.isArray(financesData) ? financesData : []);
    } catch (error) {
      addToast('Error al cargar datos: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  const getDaysRemaining = (dueDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0,0,0,0);
    const timeDiff = due.getTime() - today.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return days;
  };

  const renderCountdown = (dueDateStr) => {
    const days = getDaysRemaining(dueDateStr);
    
    let color = 'var(--success)';
    let text = `⏳ Faltan ${days} días`;
    
    if (days < 0) {
      color = 'var(--danger)';
      text = `🚨 Vencido por ${Math.abs(days)} días`;
    } else if (days <= 5) {
      color = 'var(--danger)';
      text = `⏳ ¡Vence en ${days} días!`;
    } else if (days <= 15) {
      color = 'var(--accent)';
      text = `⏳ Faltan ${days} días`;
    }

    return (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px', 
        backgroundColor: `${color}15`, 
        color: color, 
        padding: '4px 12px', 
        borderRadius: '100px',
        fontSize: '0.8rem',
        fontWeight: 600
      }}>
        {text}
      </span>
    );
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newRut || !newName || !newAmount || !newDueDate) {
      addToast('Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    const docNumber = newDocNumber || (newType === 'cobrar' && newEntityType === 'trabajador' ? `VALE-${Math.floor(100 + Math.random() * 900)}` : `F-${Math.floor(10000 + Math.random() * 90000)}`);
    
    try {
      await createAccount(companyId, {
        tipo: newType,
        tipo_entidad: newEntityType,
        rut: newRut,
        numero_documento: docNumber,
        nombre_entidad: newName,
        monto_total: parseFloat(newAmount),
        fecha_vencimiento: newDueDate,
        estado: 'debe'
      });

      // Add transaction to finance log (optional: proyeccion o registro)
      // Como estamos trabajando con cuentas por pagar/cobrar a futuro, no deberia ir a finanzas hasta que se pague,
      // Pero el original insertaba en finance. Lo dejaremos para que sea coherente o lo omitimos.
      // Omitiremos la inserción de finanzas aquí y solo lo haremos en abonos para tener flujo de caja real.

      addToast('Deuda registrada correctamente.', 'success');
      setShowAddModal(false);
      setNewRut('');
      setNewName('');
      setNewAmount('');
      setNewDueDate('');
      setNewDocNumber('');
      loadData();
    } catch (error) {
      addToast('Error al guardar cuenta: ' + error.message, 'danger');
    }
  };
  const handleEditAccount = async (e) => {
    e.preventDefault();
    if (!editingAccount.nombre_entidad || !editingAccount.monto_total || !editingAccount.fecha_vencimiento) {
      addToast('Complete los campos obligatorios.', 'warning');
      return;
    }
    try {
      await updateAccount(companyId, {
        id: editingAccount.id,
        nombre_entidad: editingAccount.nombre_entidad,
        monto_total: parseFloat(editingAccount.monto_total),
        fecha_vencimiento: editingAccount.fecha_vencimiento
      });
      addToast('Cuenta editada correctamente.', 'success');
      setEditingAccount(null);
      loadData();
    } catch (error) {
      addToast('Error al editar cuenta: ' + error.message, 'danger');
    }
  };

  const handleDeleteAccount = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta cuenta? Esta acción no se puede deshacer.')) {
      try {
        await deleteAccount(companyId, id);
        addToast('Cuenta eliminada correctamente', 'success');
        loadData();
      } catch (error) {
        addToast('Error al eliminar cuenta: ' + error.message, 'danger');
      }
    }
  };

  const handleRegisterAbono = async () => {
    const value = parseFloat(abonoValue);
    if (isNaN(value) || value <= 0) {
      addToast('Ingrese un monto válido', 'warning');
      return;
    }

    const account = showAbonoModal;
    const pending = account.monto_total - (account.monto_pagado || 0);
    if (value > pending) {
      addToast(`El abono no puede superar la deuda pendiente de $${pending.toLocaleString()}`, 'warning');
      return;
    }

    try {
      await addPayment(companyId, {
        cuenta_id: account.id,
        monto: value,
        metodo_pago: 'transferencia'
      });

      // Register actual cash flow in Finance module
      await createFinanceTx(companyId, {
        date: new Date().toISOString().split('T')[0],
        type: account.tipo === 'cobrar' ? 'ingreso' : 'egreso',
        category: account.tipo === 'cobrar' ? 'Abono Recibido' : 'Pago Realizado',
        description: `Abono a Deuda ID ${account.id} - ${account.nombre_entidad}`,
        amount: value,
        paymentMethod: 'Transferencia'
      });

      addToast('Abono registrado con éxito.', 'success');
      setShowAbonoModal(false);
      setAbonoValue('');
      loadData();
    } catch (error) {
      addToast('Error al registrar abono: ' + error.message, 'danger');
    }
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.nombre_entidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.rut.includes(searchTerm)
  );

  const cobrarAccounts = filteredAccounts.filter(acc => acc.tipo === 'cobrar');
  const pagarAccounts = filteredAccounts.filter(acc => acc.tipo === 'pagar');

  const getEdpData = () => {
    if (!selectedEdpRut) return null;
    const clientDocs = accounts.filter(acc => acc.rut === selectedEdpRut && acc.tipo === selectedEdpType);
    if (clientDocs.length === 0) return null;
    
    const firstDoc = clientDocs[0];
    const totalCargos = clientDocs.reduce((sum, doc) => sum + parseFloat(doc.monto_total), 0);
    const totalAbonos = clientDocs.reduce((sum, doc) => sum + parseFloat(doc.monto_pagado || 0), 0);
    const totalSaldo = totalCargos - totalAbonos;
    
    const docIds = clientDocs.map(d => String(d.id));
    const relatedAbonos = finances.filter(f => 
      docIds.some(id => f.description && f.description.includes(`Abono a Deuda ID ${id}`))
    );
    
    return {
      name: firstDoc.nombre_entidad,
      rut: selectedEdpRut,
      entityType: firstDoc.tipo_entidad,
      type: selectedEdpType,
      documents: clientDocs,
      abonos: relatedAbonos,
      totalCargos,
      totalAbonos,
      totalSaldo
    };
  };

  const edpData = getEdpData();

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="title-lg" style={{ marginBottom: 0 }}>Cuentas por Cobrar & Pagar</h1>
          <p style={{ color: 'var(--text-muted)' }}>Control de créditos, facturas vencidas y vales del personal.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Nuevo Registro Deuda
        </button>
      </div>

      {/* Search and Summary */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', padding: '16px 24px' , margin: 'auto' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o rut..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            style={{ width: '100%', paddingLeft: '40px' }} 
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Ficha EDP:</span>
          <select 
            value={selectedEdpRut ? `${selectedEdpRut}|${selectedEdpType}` : ''} 
            onChange={async e => {
              if (e.target.value) {
                const [rut, type] = e.target.value.split('|');
                await loadData();
                setSelectedEdpRut(rut);
                setSelectedEdpType(type);
              } else {
                setSelectedEdpRut(null);
              }
            }}
            style={{ padding: '8px 12px', fontSize: '0.875rem', minWidth: '180px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer' }}
          >
            <option value="">-- Seleccionar Persona --</option>
            {/* Clientes (Cuentas por Cobrar) */}
            {Array.from(new Map(accounts.filter(a => a.tipo === 'cobrar').map(a => [a.rut, a])).values()).map(a => (
              <option key={`edp-c-${a.rut}`} value={`${a.rut}|cobrar`}>{a.nombre_entidad} ({a.rut})</option>
            ))}
            {/* Proveedores (Cuentas por Pagar) */}
            {Array.from(new Map(accounts.filter(a => a.tipo === 'pagar').map(a => [a.rut, a])).values()).map(a => (
              <option key={`edp-p-${a.rut}`} value={`${a.rut}|pagar`}>[Prov] {a.nombre_entidad} ({a.rut})</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderRight: '1px solid var(--border)', paddingRight: '16px', marginRight: 'auto' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Mostrar:</span>
          <select 
            value={viewFilter}
            onChange={e => setViewFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.875rem', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer' }}
          >
            <option value="ambas">Ambas Tablas</option>
            <option value="cobrar">Solo Por Cobrar</option>
            <option value="pagar">Solo Por Pagar</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '32px' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Por Cobrar Activo (Clientes/Empleados):</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
              ${cobrarAccounts.filter(a => a.estado === 'debe').reduce((sum, a) => sum + (parseFloat(a.monto_total) - parseFloat(a.monto_pagado || 0)), 0).toLocaleString()}
            </div>
          </div>
          <div style={{ borderRight: '1px solid var(--border)' }}></div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Por Pagar Activo (Proveedores):</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>
              ${pagarAccounts.filter(a => a.estado === 'debe').reduce((sum, a) => sum + (parseFloat(a.monto_total) - parseFloat(a.monto_pagado || 0)), 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando cuentas...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
          
          {/* Cuentas por Cobrar */}
          {(viewFilter === 'ambas' || viewFilter === 'cobrar') && (
          <div className="card" style={{ padding: '24px 0' , margin: 'auto', width: '100%' }}>
            <h2 className="title-md" style={{ padding: '0 24px 16px 24px', borderBottom: '1px solid var(--border)', marginBottom: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
              Cuentas por Cobrar (Créditos Otorgados y Vales de Empleados)
            </h2>
            
            <div style={{ overflowX: 'auto' }}>
              <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '16px 24px' }}>Entidad / Persona</th>
                    <th style={{ padding: '16px' }}>Plazo Límite</th>
                    <th style={{ padding: '16px' }}>Monto Deuda</th>
                    <th style={{ padding: '16px' }}>Abonado</th>
                    <th style={{ padding: '16px' }}>Saldo Restante</th>
                    <th style={{ padding: '16px 24px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cobrarAccounts.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay deudas por cobrar registradas.</td>
                    </tr>
                  ) : (
                    cobrarAccounts.map(acc => {
                      const total = parseFloat(acc.monto_total);
                      const pagado = parseFloat(acc.monto_pagado || 0);
                      return (
                        <tr key={acc.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s', opacity: acc.estado === 'pagada' ? 0.6 : 1 }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontWeight: 600, color: 'white' }}>{acc.nombre_entidad}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <span style={{ textTransform: 'uppercase', backgroundColor: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>{acc.tipo_entidad}</span>
                              RUT: {acc.rut}
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {acc.estado === 'pagada' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontWeight: 600 }}>
                                <CheckCircle2 size={16} /> Pagado
                              </span>
                            ) : renderCountdown(acc.fecha_vencimiento)}
                          </td>
                          <td style={{ padding: '16px', fontWeight: 500 }}>${total.toLocaleString()}</td>
                          <td style={{ padding: '16px', color: 'var(--success)' }}>${pagado.toLocaleString()}</td>
                          <td style={{ padding: '16px', fontWeight: 700, color: acc.estado === 'pagada' ? 'var(--text-muted)' : 'var(--danger)' }}>
                            ${(total - pagado).toLocaleString()}
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button 
                                className="btn-primary" 
                                style={{ padding: '6px 12px', fontSize: '0.875rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white' }}
                                onClick={async () => {
                                  await loadData();
                                  setSelectedEdpRut(acc.rut);
                                  setSelectedEdpType(acc.tipo);
                                }}
                              >
                                <FileText size={14} /> Historial
                              </button>
                              <button
                                className="btn-primary"
                                style={{ padding: '6px 12px', fontSize: '0.875rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white' }}
                                onClick={() => setEditingAccount(acc)}
                              >
                                Editar
                              </button>
                              {acc.estado !== 'pagada' && (
                                <button 
                                  className="btn-primary" 
                                  style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                                  onClick={() => setShowAbonoModal(acc)}
                                >
                                  <DollarSign size={14} /> Abonar
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteAccount(acc.id)} 
                                style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                                title="Eliminar cuenta"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
</div>
            </div>
          </div>
          )}

          {/* Cuentas por Pagar */}
          {(viewFilter === 'ambas' || viewFilter === 'pagar') && (
          <div className="card" style={{ padding: '24px 0' , margin: 'auto', width: '100%' }}>
            <h2 className="title-md" style={{ padding: '0 24px 16px 24px', borderBottom: '1px solid var(--border)', marginBottom: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--danger)' }}></span>
              Cuentas por Pagar (Facturas de Compra Pendientes a Proveedores)
            </h2>
            
            <div style={{ overflowX: 'auto' }}>
              <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '16px 24px' }}>Proveedor / Empresa</th>
                    <th style={{ padding: '16px' }}>Plazo Límite</th>
                    <th style={{ padding: '16px' }}>Monto Deuda</th>
                    <th style={{ padding: '16px' }}>Abonado</th>
                    <th style={{ padding: '16px' }}>Saldo Restante</th>
                    <th style={{ padding: '16px 24px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagarAccounts.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay deudas por pagar registradas.</td>
                    </tr>
                  ) : (
                    pagarAccounts.map(acc => {
                      const total = parseFloat(acc.monto_total);
                      const pagado = parseFloat(acc.monto_pagado || 0);
                      return (
                        <tr key={acc.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s', opacity: acc.estado === 'pagada' ? 0.6 : 1 }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontWeight: 600, color: 'white' }}>{acc.nombre_entidad}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>RUT: {acc.rut}</div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {acc.estado === 'pagada' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontWeight: 600 }}>
                                <CheckCircle2 size={16} /> Pagado
                              </span>
                            ) : renderCountdown(acc.fecha_vencimiento)}
                          </td>
                          <td style={{ padding: '16px', fontWeight: 500 }}>${total.toLocaleString()}</td>
                          <td style={{ padding: '16px', color: 'var(--success)' }}>${pagado.toLocaleString()}</td>
                          <td style={{ padding: '16px', fontWeight: 700, color: acc.estado === 'pagada' ? 'var(--text-muted)' : 'var(--danger)' }}>
                            ${(total - pagado).toLocaleString()}
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button 
                                className="btn-primary" 
                                style={{ padding: '6px 12px', fontSize: '0.875rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white' }}
                                onClick={async () => {
                                  await loadData();
                                  setSelectedEdpRut(acc.rut);
                                  setSelectedEdpType(acc.tipo);
                                }}
                              >
                                <FileText size={14} /> Historial
                              </button>
                              <button
                                className="btn-primary"
                                style={{ padding: '6px 12px', fontSize: '0.875rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white' }}
                                onClick={() => setEditingAccount(acc)}
                              >
                                Editar
                              </button>
                              {acc.estado !== 'pagada' && (
                                <button 
                                  className="btn-primary" 
                                  style={{ padding: '6px 12px', fontSize: '0.875rem', backgroundColor: 'var(--danger)' }}
                                  onClick={() => setShowAbonoModal(acc)}
                                >
                                  <DollarSign size={14} /> Pagar / Abonar
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteAccount(acc.id)} 
                                style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                                title="Eliminar cuenta"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
</div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* Modal: Add Account */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <form onSubmit={handleAddAccount} className="card animate-fade-in" style={{ width: '480px', borderTop: '4px solid var(--accent)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="title-md" style={{ marginBottom: 0 }}>Nuevo Registro de Deuda</h2>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              
              {/* Type selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Tipo de Flujo</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => { setNewType('cobrar'); setNewEntityType('cliente'); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: newType === 'cobrar' ? '2px solid var(--success)' : '1px solid var(--border)', backgroundColor: newType === 'cobrar' ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: newType === 'cobrar' ? 'white' : 'var(--text-muted)' }}>Por Cobrar (+)</button>
                  <button type="button" onClick={() => { setNewType('pagar'); setNewEntityType('proveedor'); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: newType === 'pagar' ? '2px solid var(--danger)' : '1px solid var(--border)', backgroundColor: newType === 'pagar' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', color: newType === 'pagar' ? 'white' : 'var(--text-muted)' }}>Por Pagar (-)</button>
                </div>
              </div>

              {/* Entity Type (Only for Cobrar) */}
              {newType === 'cobrar' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Deudor</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => setNewEntityType('cliente')} style={{ flex: 1, padding: '6px', borderRadius: '8px', border: newEntityType === 'cliente' ? '1px solid var(--accent)' : '1px solid var(--border)', backgroundColor: newEntityType === 'cliente' ? 'var(--bg-main)' : 'transparent', color: 'white' }}>Cliente / Empresa</button>
                    <button type="button" onClick={() => setNewEntityType('trabajador')} style={{ flex: 1, padding: '6px', borderRadius: '8px', border: newEntityType === 'trabajador' ? '1px solid var(--accent)' : '1px solid var(--border)', backgroundColor: newEntityType === 'trabajador' ? 'var(--bg-main)' : 'transparent', color: 'white' }}>Trabajador (Vale)</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', zIndex: 10 }}>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>RUT / Identificador</label>
                  <input 
                    type="text" 
                    placeholder="12.345.678-9" 
                    value={newRut} 
                    onChange={e => setNewRut(e.target.value)} 
                    onFocus={() => setIsRutFocused(true)}
                    onBlur={() => setTimeout(() => setIsRutFocused(false), 200)}
                    required 
                    style={{ width: '100%' }} 
                  />
                  {isRutFocused && (
                    <div className="animate-fade-in" style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)',
                      borderRadius: '8px', marginTop: '4px', zIndex: 50,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                      maxHeight: '150px', overflowY: 'auto'
                    }}>
                      {(newEntityType === 'trabajador' ? workers.map(w => ({rut: w.rut, name: w.name, sub: w.cargo})) : Array.from(new Map(accounts.filter(a => a.tipo_entidad === newEntityType).map(a => [a.rut, {rut: a.rut, name: a.nombre_entidad, sub: a.tipo_entidad}])).values()))
                        .filter(e => e.rut.includes(newRut) || e.name.toLowerCase().includes(newRut.toLowerCase()))
                        .map((e, idx, arr) => (
                          <div
                            key={e.rut}
                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}
                            onClick={() => {
                              setNewRut(e.rut);
                              setNewName(e.name);
                              setIsRutFocused(false);
                            }}
                            onMouseEnter={ev => ev.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                            onMouseLeave={ev => ev.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <span style={{ fontWeight: 600, color: 'white', fontSize: '0.875rem' }}>{e.rut}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'capitalize' }}>{e.name} {e.sub ? `- ${e.sub}` : ''}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nombre / Razón Social</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Juan Pérez" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setTimeout(() => setIsNameFocused(false), 200)}
                    required 
                    style={{ width: '100%' }} 
                  />
                  {isNameFocused && (
                    <div className="animate-fade-in" style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)',
                      borderRadius: '8px', marginTop: '4px', zIndex: 50,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                      maxHeight: '150px', overflowY: 'auto'
                    }}>
                      {(newEntityType === 'trabajador' ? workers.map(w => ({rut: w.rut, name: w.name, sub: w.cargo})) : Array.from(new Map(accounts.filter(a => a.tipo_entidad === newEntityType).map(a => [a.rut, {rut: a.rut, name: a.nombre_entidad, sub: a.tipo_entidad}])).values()))
                        .filter(e => e.rut.includes(newName) || e.name.toLowerCase().includes(newName.toLowerCase()))
                        .map((e, idx, arr) => (
                          <div
                            key={e.rut}
                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}
                            onClick={() => {
                              setNewRut(e.rut);
                              setNewName(e.name);
                              setIsNameFocused(false);
                            }}
                            onMouseEnter={ev => ev.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                            onMouseLeave={ev => ev.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <span style={{ fontWeight: 600, color: 'white', fontSize: '0.875rem' }}>{e.rut}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'capitalize' }}>{e.name} {e.sub ? `- ${e.sub}` : ''}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Monto Total ($)</label>
                  <input type="number" placeholder="0" value={newAmount} onChange={e => setNewAmount(e.target.value)} required style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>N° Factura / Vale (Opcional)</label>
                  <input type="text" placeholder="Ej: F-90312" value={newDocNumber} onChange={e => setNewDocNumber(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Fecha de Vencimiento</label>
                <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} required style={{ width: '100%' }} />
              </div>

            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" style={{ flex: 1, padding: '10px', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button type="submit" className="btn-success" style={{ flex: 2, justifyContent: 'center' }}>Guardar Registro</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Register Abono */}
      {showAbonoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <div className="card animate-fade-in" style={{ width: '400px', borderTop: '4px solid var(--success)', padding: '24px', margin: '0 auto auto auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="title-md" style={{ marginBottom: 0 }}>Registrar Abono / Pago</h2>
              <button onClick={() => setShowAbonoModal(null)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Deudor/Acreedor: <strong style={{ color: 'white' }}>{showAbonoModal.nombre_entidad}</strong></div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>ID Documento: <strong style={{ color: 'white' }}>{showAbonoModal.id}</strong></div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Saldo Pendiente: <strong style={{ color: 'var(--danger)' }}>${(parseFloat(showAbonoModal.monto_total) - parseFloat(showAbonoModal.monto_pagado || 0)).toLocaleString()}</strong></div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Monto del Abono ($)</label>
              <input 
                type="number" 
                placeholder="0" 
                value={abonoValue} 
                onChange={e => setAbonoValue(e.target.value)} 
                style={{ width: '100%', fontSize: '1.25rem', padding: '12px', fontWeight: 600, color: 'var(--success)' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1, padding: '10px', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setShowAbonoModal(null)}>Cancelar</button>
              <button className="btn-success" style={{ flex: 2, justifyContent: 'center' }} onClick={handleRegisterAbono}>Confirmar Abono</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Cuenta */}
      {editingAccount && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <form onSubmit={handleEditAccount} className="card animate-fade-in" style={{ width: '500px', maxWidth: '95%', margin: '0 auto auto auto' }}>
            <h2 className="title-md" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>Editar Cuenta</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nombre / Razón Social</label>
                <input type="text" value={editingAccount.nombre_entidad} onChange={e => setEditingAccount({...editingAccount, nombre_entidad: e.target.value})} required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Monto Total ($)</label>
                <input type="number" value={editingAccount.monto_total} onChange={e => setEditingAccount({...editingAccount, monto_total: e.target.value})} required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Fecha de Vencimiento</label>
                <input type="date" value={editingAccount.fecha_vencimiento} onChange={e => setEditingAccount({...editingAccount, fecha_vencimiento: e.target.value})} required style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" style={{ flex: 1, padding: '10px', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setEditingAccount(null)}>Cancelar</button>
              <button type="submit" className="btn-success" style={{ flex: 2, justifyContent: 'center' }}>Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Estado de Pago Consolidado (EDP) */}
      {edpData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <div className="card animate-fade-in" style={{ width: '800px', maxWidth: '95%', borderTop: `4px solid ${edpData.type === 'cobrar' ? 'var(--success)' : 'var(--danger)'}`, padding: '28px', margin: '0 auto auto auto' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <span style={{ 
                  display: 'inline-block', 
                  backgroundColor: edpData.type === 'cobrar' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                  color: edpData.type === 'cobrar' ? 'var(--success)' : 'var(--danger)', 
                  padding: '4px 10px', 
                  borderRadius: '6px', 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase',
                  marginBottom: '8px'
                }}>
                  {edpData.type === 'cobrar' ? `EDP Cliente (${edpData.entityType})` : 'EDP Proveedor'}
                </span>
                <h2 className="title-lg" style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={24} style={{ color: 'var(--accent)' }} /> {edpData.name}
                </h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <strong>RUT / Identificador:</strong> {edpData.rut}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  onClick={() => {
                    const doc = new jsPDF();
                    doc.setFontSize(20);
                    doc.text('Estado de Pago Consolidado (EDP)', 14, 22);
                    doc.setFontSize(12);
                    doc.text(`Entidad: ${edpData.name}`, 14, 32);
                    doc.text(`RUT: ${edpData.rut}`, 14, 38);
                    doc.text(`Tipo: ${edpData.type === 'cobrar' ? 'Cliente' : 'Proveedor'}`, 14, 44);
                    doc.text(`Total Cargos: $${edpData.totalCargos.toLocaleString()}`, 130, 32);
                    doc.text(`Total Abonos: $${edpData.totalAbonos.toLocaleString()}`, 130, 38);
                    doc.text(`Saldo Restante: $${edpData.totalSaldo.toLocaleString()}`, 130, 44);
                    
                    const tableData = edpData.documents.map(d => [
                      d.numero_documento || d.id,
                      d.fecha_vencimiento,
                      `$${parseFloat(d.monto_total).toLocaleString()}`,
                      `$${parseFloat(d.monto_pagado || 0).toLocaleString()}`,
                      `$${(parseFloat(d.monto_total) - parseFloat(d.monto_pagado || 0)).toLocaleString()}`,
                      d.estado === 'pagada' ? 'PAGADO' : 'PENDIENTE'
                    ]);
                    
                    autoTable(doc, {
                      startY: 55,
                      head: [['N° Doc', 'Vence', 'Total', 'Abonado', 'Saldo', 'Estado']],
                      body: tableData,
                      theme: 'striped',
                      headStyles: { fillColor: edpData.type === 'cobrar' ? [16, 185, 129] : [239, 68, 68] }
                    });
                    
                    doc.save(`EDP_${edpData.name.replace(/ /g, '_')}_${edpData.rut}.pdf`);
                    addToast('Generando PDF de Estado de Pago consolidado...', 'success');
                  }}
                  className="btn-primary" 
                  style={{ padding: '8px 12px', fontSize: '0.875rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white' }}
                  title="Descargar Ficha"
                >
                  <Download size={16} /> Descargar
                </button>
                <button 
                  onClick={() => setSelectedEdpRut(null)} 
                  style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', background: 'transparent', border: 'none' }}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* KPI Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>TOTAL FACTURADO (CARGOS)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                  ${edpData.totalCargos.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {edpData.documents.length} documentos asociados
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>TOTAL ABONADO / PAGADO</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                  ${edpData.totalAbonos.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px', fontWeight: 500 }}>
                  {edpData.totalCargos > 0 ? `${Math.round((edpData.totalAbonos / edpData.totalCargos) * 100)}% pagado` : '0%'}
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>SALDO NETO PENDIENTE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: edpData.totalSaldo > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                  ${edpData.totalSaldo.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: edpData.totalSaldo > 0 ? 'var(--danger)' : 'var(--success)', marginTop: '4px', fontWeight: 500 }}>
                  {edpData.totalSaldo > 0 ? 'Saldo pendiente de cobro' : 'Sin saldo deudor'}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>Progreso de Pago</span>
                <span>${edpData.totalAbonos.toLocaleString()} de ${edpData.totalCargos.toLocaleString()}</span>
              </div>
              <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--bg-main)', borderRadius: '100px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ 
                  width: edpData.totalCargos > 0 ? `${(edpData.totalAbonos / edpData.totalCargos) * 100}%` : '0%', 
                  height: '100%', 
                  backgroundColor: 'var(--success)', 
                  borderRadius: '100px',
                  transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }}></div>
              </div>
            </div>

            {/* Document Breakdown */}
            <div>
              <h3 className="title-md" style={{ marginBottom: '12px', fontSize: '1.1rem', color: 'white' }}>Desglose de Documentos</h3>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px 16px' }}>N° Documento (ID)</th>
                      <th style={{ padding: '12px 16px' }}>Fecha Vence</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Abonado</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Saldo</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {edpData.documents.map(doc => {
                      const dTotal = parseFloat(doc.monto_total);
                      const dAbono = parseFloat(doc.monto_pagado || 0);
                      const dSaldo = dTotal - dAbono;
                      return (
                        <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)', opacity: doc.estado === 'pagada' ? 0.6 : 1 }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: 'white' }}>{doc.numero_documento || doc.id}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{doc.fecha_vencimiento}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500 }}>${dTotal.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--success)' }}>${dAbono.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: dSaldo > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>${dSaldo.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {doc.estado === 'pagada' ? (
                              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>PAGADO</span>
                            ) : (
                              <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>PENDIENTE</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
</div>
              </div>
            </div>

            {/* Detailed History Table (Abonos) */}
            <h3 className="title-md" style={{ marginTop: '24px', marginBottom: '12px', fontSize: '1.1rem', color: 'white' }}>Historial de Abonos Registrados</h3>
            {edpData.abonos && edpData.abonos.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No hay abonos registrados en finanzas para este {edpData.type === 'cobrar' ? 'cliente' : 'proveedor'}.</div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: 'var(--bg-main)', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px 16px' }}>Fecha</th>
                      <th style={{ padding: '12px 16px' }}>Descripción</th>
                      <th style={{ padding: '12px 16px' }}>Método</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {edpData.abonos && edpData.abonos.map((abono, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px' }}>{abono.date}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{abono.description}</td>
                        <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: 'var(--bg-card)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{abono.paymentMethod}</span></td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>${parseFloat(abono.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
</div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default AccountsManager;
