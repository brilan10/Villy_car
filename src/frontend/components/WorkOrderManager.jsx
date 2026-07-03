import React, { useState, useEffect, useContext } from 'react';
import { Plus, Search, Calendar, User, Tag, ArrowRight, ArrowLeft, CheckCircle2, Clock, Edit, Trash2, X, Paperclip } from 'lucide-react';
import { getWorkOrders, createWorkOrder, updateWorkOrder, deleteWorkOrder, getWorkers } from '../services/api';
import { UserContext } from '../App';

const WorkOrderManager = ({ companyId, addToast }) => {
  const { currentUser } = useContext(UserContext);
  const isWorker = currentUser?.rol === 'trabajador';
  const isAdmin = currentUser?.rol === 'admin';
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [serviceFilter, setServiceFilter] = useState('Todos');
  const [dateFilter, setDateFilter] = useState('todas'); // 'hoy' o 'todas'
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showBitacoraModal, setShowBitacoraModal] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [bitacoraText, setBitacoraText] = useState('');
  const [bitacoraProgress, setBitacoraProgress] = useState(0);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editFiles, setEditFiles] = useState([]);

  // Form states
  const [newClient, setNewClient] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPatent, setNewPatent] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newProblem, setNewProblem] = useState('');
  const [newFiles, setNewFiles] = useState([]);
  const [newWorker, setNewWorker] = useState('');
  const [newArea, setNewArea] = useState('Ambas');

  // Custom Dropdown states
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showEditModelDropdown, setShowEditModelDropdown] = useState(false);
  const modelOptions = ["Servicio", "Diseño", "Impresión", "Instalación", "Corte"];

  const getLabels = () => {
    switch (companyId) {
      case '1': return { patente: 'Ubicación / Ref.', modelo: 'Tipo de Servicio', labelCard: 'Servicio' }; // J2 Publicidad
      case '2': return { patente: 'Código Equipo', modelo: 'Tipo Máquina', labelCard: 'Equipo' }; // Dwork
      case '3': return { patente: 'Patente Vehículo', modelo: 'Modelo Vehículo / Descripción', labelCard: 'Vehículo' }; // Villy Car Tuning
      case '4': return { patente: 'Patente Camión', modelo: 'Ruta / Detalle', labelCard: 'Camión' }; // Transportes J2
      default: return { patente: 'Identificador', modelo: 'Detalle', labelCard: 'Item' };
    }
  };
  const labels = getLabels();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getWorkOrders(companyId);
      setOrders(data);
      const workersData = await getWorkers(companyId, false, false);
      setWorkers(workersData.filter(w => w.rol === 'trabajador'));
    } catch (error) {
      addToast('Error al cargar datos: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  const moveOrder = async (id, direction) => {
    const statusFlow = ['ingresado', 'en_revision', 'en_reparacion', 'completado', 'entregado'];
    const ord = orders.find(o => o.id === id);
    if (!ord) return;
    
    let currentIndex = statusFlow.indexOf(ord.estado);
    if (currentIndex === -1) currentIndex = 0; // Fallback
    
    let nextIndex = currentIndex + direction;
    
    // Solo el admin puede retroceder
    if (direction === -1 && !isAdmin) {
      addToast('Solo los administradores pueden retroceder una orden', 'danger');
      return;
    }
    
    // Skip 'en_revision' to ensure visual column change (since ingresado and en_revision are in the same column)
    if (direction === 1 && (ord.estado === 'ingresado' || ord.estado === 'en_revision')) {
      nextIndex = statusFlow.indexOf('en_reparacion');
    } else if (direction === -1 && ord.estado === 'en_reparacion') {
      nextIndex = statusFlow.indexOf('ingresado');
    }
    
    if (nextIndex >= 0 && nextIndex < statusFlow.length) {
      const newStatus = statusFlow[nextIndex];
      const progressMap = {
        'ingresado': 0,
        'en_revision': 25,
        'en_reparacion': 50,
        'completado': 75,
        'entregado': 100
      };
      
      try {
        await updateWorkOrder(companyId, { 
          id, 
          estado: newStatus,
          porcentaje_avance: progressMap[newStatus]
        });
        loadData();
      } catch (error) {
        addToast('Error al actualizar estado', 'danger');
      }
    }
  };

  const handleDeleteAttachment = (ordId, attachIdx) => {
    setConfirmAction({
      message: '¿Estás seguro de que deseas eliminar este adjunto?',
      onConfirm: async () => {
        try {
          const ord = orders.find(o => o.id === ordId);
          let adjuntos = [];
          if (typeof ord.archivos === 'string') adjuntos = JSON.parse(ord.archivos);
          else if (Array.isArray(ord.archivos)) adjuntos = ord.archivos;
          
          adjuntos.splice(attachIdx, 1);
          
          await updateWorkOrder(companyId, { id: ordId, archivos: JSON.stringify(adjuntos) });
          addToast('Adjunto eliminado con éxito.', 'success');
          loadData();
        } catch (e) {
          addToast('Error al eliminar adjunto', 'danger');
        }
      }
    });
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    if (!newClient || !newProblem) {
      addToast('Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    try {
      let archivosUrls = [];
      if (newFiles.length > 0) {
        // Asumiendo que existe import { uploadDocument } from '../services/api'; 
        // pero necesitamos importarlo arriba si no está.
        // Lo añadiremos en el siguiente chunk de imports si falta, pero ya está exportado en api.js.
        // Wait, I must import uploadDocument!
        for (let file of newFiles) {
           const formData = new FormData();
           formData.append('documento', file);
           const uploadRes = await fetch('/backend/upload_document.php', { method: 'POST', body: formData });
           const resJson = await uploadRes.json();
           if (resJson.success) {
               archivosUrls.push(resJson.archivo_url);
           }
        }
      }

      let targetCompanyId = null;
      if (newWorker) {
        const workerObj = workers.find(w => w.nombre === newWorker);
        if (workerObj && workerObj.empresa_id && workerObj.empresa_id != companyId) {
          targetCompanyId = workerObj.empresa_id;
        }
      }

      await createWorkOrder(companyId, {
        cliente_nombre: newClient,
        cliente_telefono: newPhone,
        vehiculo_patente: newPatent,
        vehiculo_modelo: newModel,
        problema_reportado: newProblem,
        archivos: archivosUrls,
        empresa_derivada_id: targetCompanyId,
        trabajador_asignado: newWorker || null,
        area_asignada: newArea,
        estado: 'ingresado',
        porcentaje_avance: 0
      });
      addToast('Orden creada exitosamente.', 'success');
      setShowAddForm(false);
      setNewClient('');
      setNewPhone('');
      setNewPatent('');
      setNewModel('');
      setNewProblem('');
      setNewFiles([]);
      setNewWorker('');
      setNewArea('Ambas');
      loadData();
    } catch (error) {
      addToast('Error al crear orden: ' + error.message, 'danger');
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      let updatedOrder = { ...editingOrder };
      
      if (editFiles && editFiles.length > 0) {
        let newArchivosUrls = [];
        for (let file of editFiles) {
           const formData = new FormData();
           formData.append('documento', file);
           const uploadRes = await fetch('/backend/upload_document.php', { method: 'POST', body: formData });
           const resJson = await uploadRes.json();
           if (resJson.success) {
               newArchivosUrls.push(resJson.archivo_url);
           }
        }
        
        let existingArchivos = [];
        if (typeof updatedOrder.archivos === 'string') {
          try { existingArchivos = JSON.parse(updatedOrder.archivos) || []; } catch(e){}
        } else if (Array.isArray(updatedOrder.archivos)) {
          existingArchivos = updatedOrder.archivos;
        }
        
        updatedOrder.archivos = JSON.stringify([...existingArchivos, ...newArchivosUrls]);
      }

      await updateWorkOrder(companyId, updatedOrder);
      addToast('Orden actualizada exitosamente.', 'success');
      setEditingOrder(null);
      setEditFiles([]);
      loadData();
    } catch (error) {
      addToast('Error al actualizar orden: ' + error.message, 'danger');
    }
  };

  const handleDeleteOrder = (id) => {
    setConfirmAction({
      message: '¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          await deleteWorkOrder(companyId, id);
          addToast('Orden eliminada exitosamente.', 'success');
          loadData();
        } catch(error) {
          addToast('Error al eliminar orden: ' + error.message, 'danger');
        }
      }
    });
  };

  const handleSaveBitacora = async (e) => {
    e.preventDefault();
    try {
      let currentBitacora = [];
      try { currentBitacora = JSON.parse(showBitacoraModal.bitacora) || []; } catch(e){}
      
      const newEntry = {
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
        autor: currentUser?.nombre || 'Desconocido',
        texto: bitacoraText
      };

      const updatedBitacora = [...currentBitacora, newEntry];

      await updateWorkOrder(companyId, {
        id: showBitacoraModal.id,
        bitacora: JSON.stringify(updatedBitacora),
        porcentaje_avance: parseInt(bitacoraProgress),
        trabajador_asignado: showBitacoraModal.trabajador_asignado
      });
      addToast('Bitácora actualizada.', 'success');
      setBitacoraText('');
      setShowBitacoraModal(null);
      loadData();
    } catch (error) {
      addToast('Error al actualizar bitácora: ' + error.message, 'danger');
    }
  };

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dateStr.startsWith(today) || dateStr.startsWith('2026-06-05'); // Using fixed date for simulation matching calendar
  };

  const filteredOrders = orders.filter(ord => {
    // 1. Role-based worker filter (worker only sees their tasks, admin sees all)
    if (currentUser?.rol === 'trabajador' && ord.trabajador_asignado !== currentUser?.nombre) {
      return false;
    }

    // 2. Date filter (today vs all)
    if (dateFilter === 'hoy' && !isToday(ord.fecha_ingreso)) {
      return false;
    }

    // 3. Status/Area filters
    const passArea = roleFilter === 'Todos' || ord.area_asignada === roleFilter || ord.area_asignada === 'Ambas' || !ord.area_asignada;
    
    // 4. Service filter (vehiculo_modelo)
    const passService = serviceFilter === 'Todos' || (ord.vehiculo_modelo && ord.vehiculo_modelo.toLowerCase().includes(serviceFilter.toLowerCase()));

    return passArea && passService &&
      (
        searchTerm.trim() === '' ||
        (ord.cliente_nombre && ord.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ord.vehiculo_patente && ord.vehiculo_patente.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ord.problema_reportado && ord.problema_reportado.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  });

  const renderColumn = (statusList, title, accentColor) => {
    let colOrders = filteredOrders.filter(o => statusList.includes(o.estado));

    // Si la columna es "Entregados (Historial)", solo mostrar los que se entregaron o ingresaron hoy para limpiar el tablero
    if (statusList.includes('entregado') && dateFilter === 'todas') {
      colOrders = colOrders.filter(o => isToday(o.fecha_entrega) || isToday(o.fecha_ingreso));
    }

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: '250px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingBottom: '12px', 
          borderBottom: `3px solid ${accentColor}`,
          marginBottom: '16px' 
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: 0 }}>{title}</h3>
          <span style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '2px 8px', borderRadius: '100px', fontWeight: 600 }}>{colOrders.length}</span>
        </div>

        {/* Card Container */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px', 
          overflowY: 'auto',
          flex: 1,
          paddingRight: '4px'
        }}>
          {colOrders.map(ord => (
            <div key={ord.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border)', transition: 'transform 0.15s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>OT-#{ord.id.toString().padStart(4, '0')}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ord.fecha_ingreso ? ord.fecha_ingreso.split(' ')[0] : ''}</span>
              </div>

              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', margin: '4px 0 0 0' }}>{ord.problema_reportado}</h4>
              {ord.trabajador_asignado && (
                <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)', color: 'var(--text-main)', marginTop: '4px', display: 'inline-block', width: 'fit-content' }}>
                  Colaborador: {ord.trabajador_asignado}
                </span>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={12} /> Cliente: <strong style={{ color: 'var(--text-main)' }}>{ord.cliente_nombre}</strong></div>
                {((ord.vehiculo_modelo && ord.vehiculo_modelo !== 'N/A') || (ord.vehiculo_patente && ord.vehiculo_patente !== 'N/A')) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Tag size={12} /> {getLabels().labelCard}: <strong style={{ color: 'var(--text-main)' }}>{ord.vehiculo_modelo !== 'N/A' ? ord.vehiculo_modelo : ''} {ord.vehiculo_patente && ord.vehiculo_patente !== 'N/A' ? `(${ord.vehiculo_patente})` : ''}</strong></div>
                )}
                {ord.estado === 'completado' || ord.estado === 'entregado' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}>
                    <CheckCircle2 size={12} /> {ord.estado === 'entregado' ? 'Entregado' : 'Completado'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)' }}>
                    <Clock size={12} /> {ord.estado.replace('_', ' ').toUpperCase()}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Avance</span>
                  <span>{ord.porcentaje_avance || 0}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-main)', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${ord.porcentaje_avance || 0}%`, 
                    height: '100%', 
                    backgroundColor: ord.porcentaje_avance === 100 ? 'var(--success)' : 'var(--accent)', 
                    borderRadius: '100px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

              {(() => {
                let adjuntos = [];
                try {
                  if (typeof ord.archivos === 'string') adjuntos = JSON.parse(ord.archivos);
                  else if (Array.isArray(ord.archivos)) adjuntos = ord.archivos;
                } catch(e){}
                
                if (adjuntos && adjuntos.length > 0) {
                  return (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {adjuntos.map((url, idx) => (
                        <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--bg-main)', border: '1px solid var(--accent)', padding: '4px 8px', borderRadius: '6px', gap: '6px', transition: 'all 0.2s ease', cursor: 'pointer' }} className="hover-brightness">
                          <a href={url} target="_blank" rel="noopener noreferrer" download style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                            <Paperclip size={12} />
                            Adjunto {idx + 1}
                          </a>
                          {!isWorker && (
                            <button 
                              onClick={(e) => { e.preventDefault(); handleDeleteAttachment(ord.id, idx); }} 
                              style={{ marginLeft: '2px', background: 'var(--bg-card)', border: '1px solid var(--danger)', borderRadius: '50%', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', padding: 0 }}
                              title="Eliminar adjunto"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setShowBitacoraModal(ord)} style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--accent)', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>Ver Detalle</button>
                  {!isWorker && (
                    <>
                      <button onClick={() => setEditingOrder(ord)} style={{ padding: '4px', borderRadius: '4px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)' }} title="Editar">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDeleteOrder(ord.id)} style={{ padding: '4px', borderRadius: '4px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--danger)', color: 'var(--danger)' }} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => moveOrder(ord.id, -1)} style={{ padding: '4px', borderRadius: '4px', backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)' }} disabled={ord.estado === 'ingresado' || !isAdmin}>
                    <ArrowLeft size={16} />
                  </button>
                  <button 
                    onClick={() => moveOrder(ord.id, 1)} 
                    style={{ padding: '4px', borderRadius: '4px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }} 
                    disabled={ord.estado === 'entregado'}
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="title-lg" style={{ marginBottom: 0 }}>Órdenes de Trabajo</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de flujos de trabajo</p>
        </div>
        {!isWorker && (
          <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={18} />
            Nueva OT
          </button>
        )}
      </div>

      {/* Search and Form */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', border: '1px solid var(--border)', padding: '4px', borderRadius: '8px', backgroundColor: 'var(--bg-card)' }}>
          <button 
            onClick={() => setDateFilter('hoy')}
            style={{ 
              padding: '6px 16px', fontSize: '0.875rem', borderRadius: '6px', fontWeight: 600, border: 'none', 
              backgroundColor: dateFilter === 'hoy' ? 'var(--accent)' : 'transparent', 
              color: dateFilter === 'hoy' ? 'white' : 'var(--text-muted)', cursor: 'pointer' 
            }}
          >
            Tareas de Hoy
          </button>
          <button 
            onClick={() => setDateFilter('todas')}
            style={{ 
              padding: '6px 16px', fontSize: '0.875rem', borderRadius: '6px', fontWeight: 600, border: 'none', 
              backgroundColor: dateFilter === 'todas' ? 'var(--accent)' : 'transparent', 
              color: dateFilter === 'todas' ? 'white' : 'var(--text-muted)', cursor: 'pointer' 
            }}
          >
            Todas
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', border: '1px solid var(--border)', padding: '4px', borderRadius: '8px', backgroundColor: 'var(--bg-card)' }}>
          {['Todos', 'Diseño', 'Producción'].map(role => (
            <button 
              key={role}
              onClick={() => setRoleFilter(role)}
              style={{ 
                padding: '6px 16px', fontSize: '0.875rem', borderRadius: '6px', fontWeight: 600, border: 'none', 
                backgroundColor: roleFilter === role ? 'var(--accent)' : 'transparent', 
                color: roleFilter === role ? 'white' : 'var(--text-muted)', cursor: 'pointer' 
              }}
            >
              {role === 'Todos' ? 'Todas las Áreas' : `Ver ${role}`}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', border: '1px solid var(--border)', padding: '4px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', overflowX: 'auto' }}>
          {['Todos', ...modelOptions].map(service => (
            <button 
              key={service}
              onClick={() => setServiceFilter(service)}
              style={{ 
                padding: '6px 12px', fontSize: '0.875rem', borderRadius: '6px', fontWeight: 600, border: 'none', 
                backgroundColor: serviceFilter === service ? 'var(--accent)' : 'transparent', 
                color: serviceFilter === service ? 'white' : 'var(--text-muted)', cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {service === 'Todos' ? 'Todos los Servicios' : service}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por cliente, patente o problema..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            style={{ width: '100%', paddingLeft: '40px' }} 
          />
        </div>
      </div>

      {showAddForm && (
        <div className="card animate-fade-in" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent)', padding: '20px' , margin: 'auto' }}>
          <h3 className="title-md">Nueva Orden de Trabajo</h3>
          <form onSubmit={handleAddOrder} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Nombre Cliente *</label>
              <input type="text" placeholder="Ej: Juan Pérez" value={newClient} onChange={e => setNewClient(e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Teléfono</label>
              <input type="text" placeholder="Ej: +569..." value={newPhone} onChange={e => setNewPhone(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{labels.patente}</label>
              <input type="text" placeholder="..." value={newPatent} onChange={e => setNewPatent(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{labels.modelo}</label>
              <input 
                type="text" 
                placeholder="..." 
                value={newModel} 
                onChange={e => setNewModel(e.target.value)} 
                onFocus={() => setShowModelDropdown(true)}
                onBlur={() => setTimeout(() => setShowModelDropdown(false), 200)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} 
              />
              {showModelDropdown && (
                <ul style={{ 
                  position: 'absolute', top: '100%', left: 0, right: 0, 
                  backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', 
                  borderRadius: '8px', marginTop: '4px', padding: '0', 
                  listStyle: 'none', zIndex: 50, maxHeight: '200px', overflowY: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)' 
                }}>
                  {modelOptions.filter(opt => opt.toLowerCase().includes((newModel || '').toLowerCase())).map((opt, i, arr) => (
                    <li 
                      key={i} 
                      onClick={() => { setNewModel(opt); setShowModelDropdown(false); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', color: 'white', borderBottom: i === arr.length - 1 && newModel && !modelOptions.some(o => o.toLowerCase() === newModel.toLowerCase()) ? '1px solid var(--border)' : (i === arr.length - 1 ? 'none' : '1px solid var(--border)') }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-lighter)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      {opt}
                    </li>
                  ))}
                  {newModel && !modelOptions.some(opt => opt.toLowerCase() === newModel.toLowerCase()) && (
                    <li 
                      onClick={() => { setShowModelDropdown(false); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', color: 'var(--accent)', fontStyle: 'italic' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-lighter)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      Usar "{newModel}"
                    </li>
                  )}
                </ul>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Área Asignada *</label>
              <select value={newArea} onChange={e => setNewArea(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }}>
                <option value="Ambas">Ambas (Diseño y Producción)</option>
                <option value="Diseño">Solo Diseño</option>
                <option value="Producción">Solo Producción</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Adjuntar Archivos / PDFs</label>
              <input type="file" multiple onChange={e => setNewFiles(Array.from(e.target.files))} style={{ width: '100%', color: 'white' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Colaborador Asignado</label>
              <select value={newWorker} onChange={e => setNewWorker(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }}>
                <option value="">-- Sin Asignar --</option>
                {workers.map(w => (
                  <option key={w.id} value={w.nombre}>{w.nombre} ({w.cargo || 'Trabajador'}) - {w.empresa_id == 1 ? 'J2' : w.empresa_id == 2 ? 'Dwork' : w.empresa_id == 3 ? 'VillyCar' : 'Transp.'}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Problema Reportado / Trabajo a realizar *</label>
              <textarea placeholder="Ej: Afinamiento completo, cambio de aceite..." value={newProblem} onChange={e => setNewProblem(e.target.value)} required style={{ width: '100%', height: '80px', padding: '10px' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button type="button" style={{ padding: '10px 20px', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setShowAddForm(false)}>Cancelar</button>
              <button type="submit" className="btn-success">Crear Orden</button>
            </div>
          </form>
        </div>
      )}

      {editingOrder && (
        <div className="card animate-fade-in" style={{ marginBottom: '24px', borderLeft: '4px solid #f59e0b', padding: '20px' , margin: 'auto' }}>
          <h3 className="title-md">Editar Orden de Trabajo #{editingOrder.id}</h3>
          <form onSubmit={handleUpdateOrder} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Nombre Cliente *</label>
              <input type="text" value={editingOrder.cliente_nombre || ''} onChange={e => setEditingOrder({...editingOrder, cliente_nombre: e.target.value})} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Teléfono</label>
              <input type="text" value={editingOrder.cliente_telefono || ''} onChange={e => setEditingOrder({...editingOrder, cliente_telefono: e.target.value})} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{labels.patente}</label>
              <input type="text" value={editingOrder.vehiculo_patente || ''} onChange={e => setEditingOrder({...editingOrder, vehiculo_patente: e.target.value})} style={{ width: '100%' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{labels.modelo}</label>
              <input 
                type="text" 
                value={editingOrder.vehiculo_modelo || ''} 
                onChange={e => setEditingOrder({...editingOrder, vehiculo_modelo: e.target.value})} 
                onFocus={() => setShowEditModelDropdown(true)}
                onBlur={() => setTimeout(() => setShowEditModelDropdown(false), 200)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} 
              />
              {showEditModelDropdown && (
                <ul style={{ 
                  position: 'absolute', top: '100%', left: 0, right: 0, 
                  backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', 
                  borderRadius: '8px', marginTop: '4px', padding: '0', 
                  listStyle: 'none', zIndex: 50, maxHeight: '200px', overflowY: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)' 
                }}>
                  {modelOptions.filter(opt => opt.toLowerCase().includes((editingOrder.vehiculo_modelo || '').toLowerCase())).map((opt, i, arr) => (
                    <li 
                      key={i} 
                      onClick={() => { setEditingOrder({...editingOrder, vehiculo_modelo: opt}); setShowEditModelDropdown(false); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', color: 'white', borderBottom: i === arr.length - 1 && editingOrder.vehiculo_modelo && !modelOptions.some(o => o.toLowerCase() === editingOrder.vehiculo_modelo.toLowerCase()) ? '1px solid var(--border)' : (i === arr.length - 1 ? 'none' : '1px solid var(--border)') }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-lighter)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      {opt}
                    </li>
                  ))}
                  {editingOrder.vehiculo_modelo && !modelOptions.some(opt => opt.toLowerCase() === (editingOrder.vehiculo_modelo || '').toLowerCase()) && (
                    <li 
                      onClick={() => setShowEditModelDropdown(false)}
                      style={{ padding: '10px 14px', cursor: 'pointer', color: 'var(--accent)', fontStyle: 'italic' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-lighter)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      Usar "{editingOrder.vehiculo_modelo}"
                    </li>
                  )}
                </ul>
              )}
            </div>
            {isAdmin && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Colaborador Asignado</label>
                  <select value={editingOrder.trabajador_asignado || ''} onChange={e => setEditingOrder({...editingOrder, trabajador_asignado: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }}>
                    <option value="">-- Sin Asignar --</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.nombre}>{w.nombre} ({w.cargo || 'Trabajador'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Adjuntar Nuevos Archivos</label>
                  <input type="file" multiple onChange={e => setEditFiles(Array.from(e.target.files))} style={{ width: '100%', color: 'white' }} />
                </div>
              </>
            )}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Problema Reportado / Trabajo a realizar *</label>
              <textarea value={editingOrder.problema_reportado || ''} onChange={e => setEditingOrder({...editingOrder, problema_reportado: e.target.value})} required style={{ width: '100%', height: '80px', padding: '10px' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button type="button" style={{ padding: '10px 20px', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => { setEditingOrder(null); setEditFiles([]); }}>Cancelar</button>
              <button type="submit" style={{ color: 'white', backgroundColor: '#f59e0b', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Cargando órdenes de trabajo...</div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', flex: 1 }}>
          {renderColumn(['ingresado', 'en_revision'], 'Recepción', '#4caf50')}
          {renderColumn(['en_reparacion'], 'En Proceso', '#2196f3')}
          {renderColumn(['completado'], 'Finalizado', '#9c27b0')}
          {renderColumn(['entregado'], 'Entregado', '#607d8b')}
        </div>
      )}

      {showBitacoraModal && (() => {
        let bitacoraArr = [];
        try { bitacoraArr = JSON.parse(showBitacoraModal.bitacora) || []; } catch(e){}
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
            <div className="card animate-fade-in" style={{ width: '600px', maxWidth: '95%', margin: '0 auto auto auto' }}>
              <h2 className="title-md" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>Detalle y Bitácora - OT #{showBitacoraModal.id}</h2>
              
              <form onSubmit={handleSaveBitacora} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}><strong>Cliente:</strong> {showBitacoraModal.cliente_nombre} {showBitacoraModal.cliente_telefono ? `(${showBitacoraModal.cliente_telefono})` : ''}</p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}><strong>Problema:</strong> {showBitacoraModal.problema_reportado}</p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Reasignar Trabajador</label>
                  <select 
                    value={showBitacoraModal.trabajador_asignado || ''} 
                    onChange={e => setShowBitacoraModal({...showBitacoraModal, trabajador_asignado: e.target.value})} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }}
                  >
                    <option value="">-- Sin Asignar --</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.nombre}>{w.nombre} ({w.cargo || 'Trabajador'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Porcentaje de Avance ({bitacoraProgress || showBitacoraModal.porcentaje_avance || 0}%)</label>
                  <input type="range" min="0" max="100" value={bitacoraProgress || showBitacoraModal.porcentaje_avance || 0} onChange={e => setBitacoraProgress(e.target.value)} style={{ width: '100%' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Agregar a Bitácora</label>
                  <textarea placeholder="Detalle el trabajo realizado..." value={bitacoraText} onChange={e => setBitacoraText(e.target.value)} style={{ width: '100%', height: '80px', padding: '10px' }} />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="button" style={{ flex: 1, padding: '10px', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setShowBitacoraModal(null)}>Cerrar</button>
                  <button type="submit" className="btn-success" style={{ flex: 2, justifyContent: 'center' }}>Guardar Bitácora y Avance</button>
                </div>
              </form>

              <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <h3 className="title-md" style={{ fontSize: '1rem', marginBottom: '16px' }}>Historial de Bitácora</h3>
                {bitacoraArr.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>No hay registros en la bitácora aún.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {bitacoraArr.map((entry, idx) => (
                      <div key={idx} style={{ padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <strong>{entry.autor}</strong>
                          <span>{entry.fecha}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'white', whiteSpace: 'pre-wrap' }}>{entry.texto}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {confirmAction && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 2000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <div className="card animate-fade-in" style={{ width: '400px', borderTop: '4px solid var(--danger)', position: 'relative', padding: '24px' , margin: 'auto' }}>
            <button onClick={() => setConfirmAction(null)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            <h3 className="title-md" style={{ marginBottom: '16px', color: 'white' }}>Confirmar Acción</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>{confirmAction.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setConfirmAction(null)} style={{ padding: '8px 16px', borderRadius: '8px', color: 'white', border: '1px solid var(--border)', background: 'transparent' }}>Cancelar</button>
              <button onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} className="btn-danger" style={{ padding: '8px 16px', borderRadius: '8px' }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WorkOrderManager;
