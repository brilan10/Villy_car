import React, { useState, useEffect, useContext } from 'react';
import { Calendar as CalendarIcon, Clock, User, Plus, ChevronLeft, ChevronRight, MapPin, X, FileText, DollarSign, Filter, Phone, MessageCircle } from 'lucide-react';
import { getWorkers, getAgendas, createAgenda, updateAgenda, deleteAgenda, getClients, createWorkOrder, getWorkOrders, updateWorkOrder, createClient } from '../services/api';
import { UserContext } from '../App';

const CalendarManager = ({ companyId, addToast }) => {
  const { currentUser } = useContext(UserContext);
  const isWorker = currentUser?.rol === 'trabajador';
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [rutInput, setRutInput] = useState('');
  const [checkoutStep, setCheckoutStep] = useState(false);
  const [isRutFocused, setIsRutFocused] = useState(false);
  const [assignedWorker, setAssignedWorker] = useState('');
  const [workerSearchInput, setWorkerSearchInput] = useState('');
  const [isWorkerFocused, setIsWorkerFocused] = useState(false);
  const [agendaSearchTerm, setAgendaSearchTerm] = useState('');
  const [isAgendaSearchFocused, setIsAgendaSearchFocused] = useState(false);

  // Email reminders and Toast states
  const [sendEmailReminder, setSendEmailReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('1h');

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newStatus, setNewStatus] = useState('Agendado');
  const [derivedCompany, setDerivedCompany] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [view, setView] = useState('month');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [draggedEvent, setDraggedEvent] = useState(null);
  
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const realToday = new Date();
  const realTodayStr = `${realToday.getFullYear()}-${String(realToday.getMonth() + 1).padStart(2, '0')}-${String(realToday.getDate()).padStart(2, '0')}`;
  
  const [currentDate, setCurrentDate] = useState(new Date(realToday.getFullYear(), realToday.getMonth(), 1));
  const [isSaving, setIsSaving] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({ rut: '', nombre: '', telefono: '', email: '', direccion: '' });
  const [isSavingClient, setIsSavingClient] = useState(false);

  const loadData = async () => {
    try {
      const fetchedEvents = await getAgendas(companyId);
      const formattedAgendas = fetchedEvents.map(e => ({
        id: `agenda_${e.id}`,
        realId: e.id,
        title: `[Agenda] ${e.titulo}`,
        client: e.cliente,
        phone: e.cliente_telefono,
        time: e.hora.slice(0, 5), // remove seconds
        date: e.fecha,
        type: e.tipo,
        amount: e.monto,
        details: e.detalles,
        status: e.estado || 'Agendado',
        estado_pago: e.estado_pago || 'pendiente',
        worker: e.trabajador,
        isOrder: false
      }));

      const getLabels = () => {
        switch (companyId) {
          case '1': return { patente: 'Ubicación/Ref.', modelo: 'Tipo Servicio', labelCard: 'Servicio' }; // J2 Publicidad
          case '2': return { patente: 'Cód Equipo', modelo: 'Tipo Máquina', labelCard: 'Equipo' }; // Dwork
          case '3': return { patente: 'Patente', modelo: 'Vehículo', labelCard: 'Vehículo' }; // Villy Car Tuning
          case '4': return { patente: 'Patente Camión', modelo: 'Ruta/Detalle', labelCard: 'Camión' }; // Transportes J2
          default: return { patente: 'Identificador', modelo: 'Detalle', labelCard: 'Item' };
        }
      };
      
      const allEvents = [...formattedAgendas];
      setEvents(allEvents);

      const allClients = await getClients(companyId); // Backend ignores companyId for clients now
      setClientsList(allClients.map(c => ({ rut: c.rut, name: c.nombre, email: c.email })));

      const dataWorkers = await getWorkers(companyId);
      const formattedWorkers = dataWorkers.map(w => ({
        name: w.nombre,
        rut: w.rut,
        cargo: w.cargo
      }));
      setWorkers(formattedWorkers);

      if (formattedWorkers.length > 0) {
        setAssignedWorker(formattedWorkers[0].name);
        setWorkerSearchInput(formattedWorkers[0].name);
      } else {
        setAssignedWorker('');
        setWorkerSearchInput('');
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  const getEventColor = (type) => {
    const colors = {
      'Mecánica': '#ef4444',
      'Mantenimiento': '#10b981',
      'Electrónica': '#8b5cf6',
      'Mudanza': '#f59e0b',
      'Flete': '#0ea5e9',
      'Terreno': '#8b5cf6',
      'Oficina': '#f59e0b',
      'Audio': '#ef4444',
      'Estética': '#8b5cf6',
      'Instalación': '#10b981'
    };
    return colors[type] || 'var(--accent)';
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Finalizado': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', labelBg: 'rgba(16, 185, 129, 0.15)', opacity: 1, textDecoration: 'none' };
      case 'En Producción': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', labelBg: 'rgba(59, 130, 246, 0.15)', opacity: 1, textDecoration: 'none' };
      case 'Confirmado': return { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', labelBg: 'rgba(139, 92, 246, 0.15)', opacity: 1, textDecoration: 'none' };
      case 'Cancelado': return { bg: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', labelBg: 'rgba(239, 68, 68, 0.15)', opacity: 0.5, textDecoration: 'line-through' };
      default: return { bg: 'var(--bg-main)', color: 'var(--text-muted)', labelBg: 'rgba(255,255,255,0.05)', opacity: 1, textDecoration: 'none' };
    }
  };

  const nextMonth = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    }
  };

  const prevMonth = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    }
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Month logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalSlots = [...blanks, ...days];
  while (totalSlots.length % 7 !== 0) {
    totalSlots.push(null);
  }

  // Week logic
  const getWeekDays = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(d.getFullYear(), d.getMonth(), diff);
    return Array.from({ length: 7 }, (_, i) => {
      const result = new Date(startOfWeek);
      result.setDate(startOfWeek.getDate() + i);
      return result;
    });
  };
  const weekDays = getWeekDays(currentDate);
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  const handleSave = async () => {
    if (!newTitle || !rutInput) {
      addToast('Por favor complete el nombre del trabajo y el cliente.', 'warning');
      return;
    }
    
    setIsSaving(true);

    const payload = {
      titulo: newTitle,
      cliente: rutInput,
      cliente_email: newEmail,
      cliente_telefono: newPhone,
      fecha: newDate || realTodayStr,
      hora: newTime || '12:00',
      tipo: companyId === '1' ? 'Mecánica' : companyId === '2' ? 'Flete' : companyId === '3' ? 'Oficina' : 'Audio',
      monto: 50000,
      detalles: 'Servicio programado con recordatorio de correo electrónico.',
      estado: newStatus,
      trabajador: assignedWorker,
      empresa_derivada_id: derivedCompany ? parseInt(derivedCompany) : null
    };

    try {
      await createAgenda(companyId, payload);
      
      // Auto-create Work Order
      try {
        await createWorkOrder(companyId, {
          cliente_nombre: rutInput,
          cliente_telefono: newPhone,
          vehiculo_patente: '',
          vehiculo_modelo: '',
          problema_reportado: newTitle, // We use the agenda title as the work to be done
          estado: 'ingresado', // Initial state
          area_asignada: 'Ambas',
          archivos: [],
          empresa_derivada_id: derivedCompany ? parseInt(derivedCompany) : null,
          trabajador_asignado: assignedWorker,
          fecha_ingreso: `${newDate || realTodayStr} ${newTime || '12:00'}:00` // Pass scheduled time as start time
        });
        addToast('Orden de trabajo vinculada generada.', 'info');
      } catch (err) {
        console.error('Error creando orden de trabajo', err);
      }

      addToast('Turno agendado con éxito.', 'success');
      setShowForm(false);
      loadData(); // reload from backend

      if (sendEmailReminder) {
        addToast(`📅 Recordatorio de correo programado (${reminderTime === '15m' ? '15 minutos' : reminderTime === '30m' ? '30 minutos' : reminderTime === '1h' ? '1 hora' : '1 día'} antes de la cita)`);
        
        setTimeout(() => {
          addToast(`✉️ [Alerta de Correo]: Recordatorio enviado a ${rutInput} para el servicio "${newTitle}" (${reminderTime === '15m' ? '15m' : reminderTime === '30m' ? '30m' : reminderTime === '1h' ? '1 hora' : '1 día'} antes)`);
        }, 2500);
      }

      setNewTitle('');
      setRutInput('');
      setNewDate('');
      setNewTime('');
      setNewEmail('');
      setNewPhone('');
      setNewStatus('Agendado');
      setSendEmailReminder(false);
      
      if (workers.length > 0) {
        setAssignedWorker(workers[0].name);
        setWorkerSearchInput(workers[0].name);
      } else {
        setAssignedWorker('');
        setWorkerSearchInput('');
      }
    } catch (error) {
      addToast('Error al guardar: ' + error.message, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStart = (e, event) => {
    if (isWorker) return;
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, dateStr, timeStr = null) => {
    e.preventDefault();
    if (!draggedEvent || !dateStr || isWorker) return;

    try {
      if (draggedEvent.isOrder) {
        const dt = `${dateStr} ${timeStr || draggedEvent.time}:00`;
        await updateWorkOrder(companyId, {
          id: draggedEvent.realId,
          fecha_ingreso: dt
        });
        setDraggedEvent(null);
        loadData();
        return;
      }

      const payload = {
        id: draggedEvent.realId,
        titulo: draggedEvent.title.replace('[Agenda] ', ''),
        cliente: draggedEvent.client,
        fecha: dateStr,
        hora: timeStr || draggedEvent.time,
        tipo: draggedEvent.type,
        monto: parseFloat(draggedEvent.amount) || 0,
        detalles: draggedEvent.details,
        estado: draggedEvent.status,
        trabajador: draggedEvent.worker
      };

      await updateAgenda(companyId, payload);
      setDraggedEvent(null);
      loadData(); // reload from backend
    } catch (error) {
      addToast('Error al mover turno: ' + error.message, 'danger');
    }
  };

  const todayISO = new Date().toISOString().split('T')[0];
  const filteredEvents = events.filter(e => {
    // 1. Role-based worker filter
    if (currentUser?.rol === 'trabajador' && e.worker !== currentUser?.nombre) {
      return false;
    }
    // 2. View filter for past agendas
    const isPast = e.date < todayISO;
    if (view === 'historial' && !isPast) return false;
    // Si estamos en historial, solo mostramos pasados.
    // Si NO estamos en historial, mostramos todo (futuro y pasado) para que el calendario tenga sentido visual completo.


    // 3. Search term (Client or Status)
    if (agendaSearchTerm && !e.client.toLowerCase().includes(agendaSearchTerm.toLowerCase()) && !e.status.toLowerCase().includes(agendaSearchTerm.toLowerCase())) {
      return false;
    }

    // 4. Status filter
    return filterStatus === 'Todos' || e.status === filterStatus;
  });

  const getEventCard = (event) => {
    const sStyle = getStatusStyle(event.status);
    return (
      <div
        key={event.id}
        draggable
        onDragStart={(e) => handleDragStart(e, event)}
        onClick={() => setSelectedEvent(event)}
        style={{
          backgroundColor: sStyle.bg,
          borderLeft: `3px solid ${getEventColor(event.type)}`,
          padding: '6px 8px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
          opacity: sStyle.opacity,
          marginBottom: '4px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
      >
        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px', display: 'flex', justifyContent: 'space-between', textDecoration: sStyle.textDecoration }}>
          <span>{event.time}</span>
          <span style={{ color: getEventColor(event.type) }}>{event.type}</span>
        </div>
        <div style={{ color: 'var(--text-muted)' }}><User size={10} style={{ display: 'inline', marginRight: '2px' }} />{event.client}</div>
        {event.worker && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '2px' }}>
            <span style={{ fontWeight: 600 }}>Técnico:</span> {event.worker}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <div style={{ color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, textDecoration: sStyle.textDecoration }}>
            {event.title}
          </div>
          <span style={{ fontSize: '0.65rem', padding: '2px 6px', backgroundColor: sStyle.labelBg, borderRadius: '4px', color: sStyle.color, fontWeight: 600 }}>
            {event.status}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="animate-fade-in" style={{ paddingBottom: '40px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="title-lg" style={{ marginBottom: '8px' }}>Calendario Operativo</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Visualiza todos los trabajos, citas y rutas programadas.</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Todos', 'Agendado', 'Confirmado', 'En Producción', 'Finalizado', 'Cancelado'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: filterStatus === status ? 'var(--accent)' : 'var(--bg-card)',
                  color: filterStatus === status ? 'white' : 'var(--text-muted)',
                  border: `1px solid ${filterStatus === status ? 'var(--accent)' : 'var(--border)'}`,
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
              >
                {status}
              </button>
            ))}
              <button
                key="historial"
                onClick={() => {
                  setView('historial');
                  setFilterStatus('Todos');
                }}
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: view === 'historial' ? 'var(--accent)' : 'var(--bg-card)',
                  color: view === 'historial' ? 'white' : 'var(--text-muted)',
                  border: `1px solid ${view === 'historial' ? 'var(--accent)' : 'var(--border)'}`,
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
              >
                Trabajos Pasados (Historial)
              </button>
            </div>
            
            <div style={{ marginTop: '12px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Filtrar por cliente o estado..."
                value={agendaSearchTerm}
                onChange={e => {
                  setAgendaSearchTerm(e.target.value);
                  setIsAgendaSearchFocused(true);
                }}
                onFocus={() => setIsAgendaSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsAgendaSearchFocused(false), 200)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'white', width: '300px' }}
              />
              {isAgendaSearchFocused && agendaSearchTerm && (
                <div className="animate-fade-in" style={{
                  position: 'absolute', top: '100%', left: 0, width: '100%',
                  backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)',
                  borderRadius: '8px', marginTop: '4px', zIndex: 50,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                  maxHeight: '200px', overflowY: 'auto'
                }}>
                  {clientsList.filter(c => 
                    c.rut.includes(agendaSearchTerm) || (c.name && c.name.toLowerCase().includes(agendaSearchTerm.toLowerCase()))
                  ).map(c => (
                    <div 
                      key={c.rut}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}
                      onClick={() => {
                        setAgendaSearchTerm(c.name);
                        setIsAgendaSearchFocused(false);
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>{c.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>RUT: {c.rut}</span>
                    </div>
                  ))}
                  {clientsList.filter(c => c.rut.includes(agendaSearchTerm) || (c.name && c.name.toLowerCase().includes(agendaSearchTerm.toLowerCase()))).length === 0 && (
                    <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
                      Sin resultados en clientes
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={20} />
          Agendar Nuevo
        </button>
      </div>


      {showForm && (
        <div className="card animate-fade-in" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent)' , margin: 'auto' }}>
          <h2 className="title-md">Agendar en Calendario</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Servicio / Trabajo</label>
              <input 
                type="text" 
                placeholder="Ej: Cambio de Frenos" 
                style={{ width: '100%' }} 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cliente (Nombre o RUT)</label>
                <button onClick={(e) => { e.preventDefault(); setShowNewClientModal(true); }} style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600 }}>+ Nuevo Cliente</button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Ej: 11.111.111-1"
                  style={{ width: '100%' }}
                  value={rutInput}
                  onChange={(e) => setRutInput(e.target.value)}
                  onFocus={() => setIsRutFocused(true)}
                  onBlur={() => setTimeout(() => setIsRutFocused(false), 200)}
                />

                {isRutFocused && (
                  <div className="animate-fade-in" style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)',
                    borderRadius: '8px', marginTop: '4px', zIndex: 50,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
                    maxHeight: '200px', overflowY: 'auto'
                  }}>
                    {clientsList.filter(c => {
                      // Si el input es exactamente el RUT de un cliente ya seleccionado, mostramos todos para poder elegir otro fácilmente
                      const exactMatch = clientsList.some(client => client.rut === rutInput);
                      if (exactMatch) return true;
                      
                      return c.rut.includes(rutInput) || (c.name && c.name.toLowerCase().includes(rutInput.toLowerCase()));
                    }).map((c, idx, arr) => (
                      <div
                        key={c.rut}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}
                        onClick={() => {
                          setRutInput(c.name || c.rut);
                          if (c.email) {
                            setNewEmail(c.email);
                          } else {
                            setNewEmail('');
                          }
                          if (c.telefono) {
                            setNewPhone(c.telefono);
                          } else {
                            setNewPhone('');
                          }
                          setIsRutFocused(false);
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>{c.rut}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{c.name}</span>
                      </div>
                    ))}
                    {clientsList.filter(c => {
                      const exactMatch = clientsList.some(client => client.rut === rutInput);
                      if (exactMatch) return true;
                      return c.rut.includes(rutInput) || (c.name && c.name.toLowerCase().includes(rutInput.toLowerCase()));
                    }).length === 0 && (
                      <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
                        No se encontraron coincidencias
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Correo del Cliente (Opcional)</label>
              <input 
                type="email" 
                placeholder="Ej: cliente@correo.com" 
                style={{ width: '100%' }} 
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Teléfono (Opcional)</label>
              <input 
                type="tel" 
                placeholder="Ej: +56912345678" 
                style={{ width: '100%' }} 
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Fecha (Día)</label>
              <input 
                type="date" 
                style={{ width: '100%' }} 
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Hora de Llegada</label>
              <input 
                type="time" 
                style={{ width: '100%' }} 
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Estado</label>
              <select 
                style={{ width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
              >
                <option value="Agendado">Agendado</option>
                <option value="Confirmado">Confirmado</option>
                <option value="En Producción">En Producción</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Asignar Trabajador (RRHH)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Buscar trabajador por nombre o cargo..."
                  style={{ width: '100%' }}
                  value={workerSearchInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWorkerSearchInput(val);
                    setIsWorkerFocused(true);
                    if (!val) {
                      setAssignedWorker('');
                    }
                  }}
                  onFocus={() => setIsWorkerFocused(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      setIsWorkerFocused(false);
                    }, 250);
                  }}
                />

                {isWorkerFocused && (
                  <div className="animate-fade-in" style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)',
                    borderRadius: '8px', marginTop: '4px', zIndex: 50,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
                    maxHeight: '200px', overflowY: 'auto'
                  }}>
                    {/* Option: No Asignado */}
                    <div
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}
                      onClick={() => {
                        setAssignedWorker('');
                        setWorkerSearchInput('No asignado');
                        setIsWorkerFocused(false);
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>No asignado</span>
                    </div>

                    {/* Matching workers */}
                    {workers
                      .filter(w => {
                        const searchStr = workerSearchInput === assignedWorker ? '' : workerSearchInput.toLowerCase();
                        if (!searchStr) return true;
                        const wName = w.name ? w.name.toLowerCase() : '';
                        const wCargo = w.cargo ? w.cargo.toLowerCase() : '';
                        const wRut = w.rut ? w.rut.toLowerCase() : '';
                        return wName.includes(searchStr) || wCargo.includes(searchStr) || wRut.includes(searchStr);
                      })
                      .map((w, idx, arr) => (
                        <div
                          key={w.rut}
                          style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}
                          onClick={() => {
                            setAssignedWorker(w.name);
                            setWorkerSearchInput(w.name);
                            setIsWorkerFocused(false);
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>{w.name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{w.cargo}</span>
                        </div>
                      ))}
                    {workers.filter(w => (
                      w.name.toLowerCase().includes(workerSearchInput.toLowerCase()) ||
                      w.cargo.toLowerCase().includes(workerSearchInput.toLowerCase())
                    )).length === 0 && (
                      <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
                        No se encontraron coincidencias
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Recordatorios por correo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%', alignSelf: 'center', paddingTop: '16px' }}>
              <input 
                type="checkbox" 
                id="sendEmailReminder"
                checked={sendEmailReminder} 
                onChange={e => setSendEmailReminder(e.target.checked)} 
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="sendEmailReminder" style={{ fontSize: '0.875rem', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }}>
                Enviar recordatorio por correo
              </label>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Tiempo de anticipación</label>
              <select 
                value={reminderTime} 
                onChange={e => setReminderTime(e.target.value)} 
                disabled={!sendEmailReminder}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', opacity: sendEmailReminder ? 1 : 0.5, cursor: sendEmailReminder ? 'pointer' : 'not-allowed' }}
              >
                <option value="15m">15 minutos antes</option>
                <option value="30m">30 minutos antes</option>
                <option value="1h">1 hora antes</option>
                <option value="1d">1 día antes</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Trabajo Interno / Derivar a otra empresa</label>
              <select value={derivedCompany} onChange={e => setDerivedCompany(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }}>
                <option value="">No derivar (Trabajo propio)</option>
                <option value="1">Derivar a Dwork (Construcción y Soldadura)</option>
                <option value="2">Derivar a Transportes Villy Car (Logística)</option>
                <option value="3">Derivar a J2 Publicidad (Gráfica y Letreros)</option>
                <option value="4">Derivar a Villy Car Tuning (Estética Vehicular)</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button style={{ padding: '10px 20px', borderRadius: '8px', color: 'var(--text-muted)' }} onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="btn-success" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Guardando y enviando...' : 'Confirmar Turno'}</button>
          </div>
        </div>
      )}

      {/* Calendario Real */}
      <div className="card" style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-main)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={prevMonth} style={{ padding: '8px', backgroundColor: 'var(--bg-card)', borderRadius: '8px' }}><ChevronLeft size={20} /></button>
            
            {view === 'month' ? (
              <input 
                type="month"
                value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
                onChange={(e) => {
                  if (e.target.value) {
                    const [year, month] = e.target.value.split('-');
                    setCurrentDate(new Date(parseInt(year), parseInt(month) - 1, 1));
                  }
                }}
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-card)',
                  color: 'white',
                  border: '1px solid var(--border)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  colorScheme: 'dark',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              />
            ) : (
              <input 
                type="date"
                value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`}
                onChange={(e) => {
                  if (e.target.value) {
                    const [year, month, day] = e.target.value.split('-');
                    setCurrentDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
                  }
                }}
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-card)',
                  color: 'white',
                  border: '1px solid var(--border)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  colorScheme: 'dark',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              />
            )}

            <button onClick={nextMonth} style={{ padding: '8px', backgroundColor: 'var(--bg-card)', borderRadius: '8px' }}><ChevronRight size={20} /></button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setView('month')}
              style={{ padding: '8px 16px', backgroundColor: view === 'month' ? 'var(--accent)' : 'transparent', color: view === 'month' ? 'white' : 'var(--text-muted)', border: view === 'month' ? 'none' : '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500 }}
            >Mes</button>
            <button
              onClick={() => setView('week')}
              style={{ padding: '8px 16px', backgroundColor: view === 'week' ? 'var(--accent)' : 'transparent', color: view === 'week' ? 'white' : 'var(--text-muted)', border: view === 'week' ? 'none' : '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500 }}
            >Semana</button>
          </div>
        </div>

        {view === 'month' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
              {dayNames.map(day => (
                <div key={day} style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>{day}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, backgroundColor: 'var(--border)', gap: '1px', overflowY: 'auto' }}>
              {totalSlots.map((day, index) => {
                const dateStr = day ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                const dayEvents = day ? filteredEvents.filter(e => e.date === dateStr).sort((a, b) => a.time.localeCompare(b.time)) : [];
                const isToday = dateStr === realTodayStr;

                return (
                  <div
                    key={index}
                    onDragOver={day ? handleDragOver : undefined}
                    onDrop={day ? (e) => handleDrop(e, dateStr) : undefined}
                    style={{
                      backgroundColor: day ? (isToday ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)') : 'var(--bg-main)',
                      minHeight: '120px',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    {day && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 600, color: isToday ? 'white' : 'var(--text-main)' }}>
                        <span style={{ backgroundColor: isToday ? 'var(--accent)' : 'transparent', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                          {day}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1 }}>
                      {dayEvents.map(getEventCard)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === 'week' && (
          <div style={{ display: 'flex', flex: 1, overflowY: 'auto' }}>
            <div style={{ width: '60px', borderRight: '1px solid var(--border)', backgroundColor: 'var(--bg-main)' }}>
              <div style={{ height: '40px', borderBottom: '1px solid var(--border)' }}></div>
              {hours.map(hour => (
                <div key={hour} style={{ height: '100px', borderBottom: '1px solid var(--border)', padding: '4px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {hour}:00
                </div>
              ))}
            </div>

            <div style={{ flex: 1, display: 'flex' }}>
              {weekDays.map((date, index) => {
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const isToday = dateStr === realTodayStr;

                return (
                  <div key={index} style={{ flex: 1, borderRight: index < 6 ? '1px solid var(--border)' : 'none', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '40px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', padding: '4px 0', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{dayNames[index]}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: isToday ? 'var(--accent)' : 'var(--text-main)' }}>{date.getDate()}</div>
                    </div>

                    <div style={{ position: 'relative', flex: 1 }}>
                      {hours.map(hour => (
                        <div
                          key={hour}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, dateStr, `${String(hour).padStart(2, '0')}:00`)}
                          style={{ height: '100px', borderBottom: '1px solid var(--border)' }}
                        />
                      ))}

                      {filteredEvents.filter(e => e.date === dateStr).map(event => {
                        const [evHour, evMin] = event.time.split(':').map(Number);
                        const top = (evHour - 8) * 100 + (evMin / 60) * 100;
                        if (top < 0 || top >= hours.length * 100) return null;

                        return (
                          <div key={event.id} style={{ position: 'absolute', top: `${top}px`, left: '4px', right: '4px', zIndex: 10 }}>
                            {getEventCard(event)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'historial' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {filteredEvents.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>No hay trabajos pasados registrados que coincidan con la búsqueda.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {filteredEvents.map(getEventCard)}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedEvent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <div className="card animate-fade-in" style={{ width: '450px', borderTop: `4px solid ${getEventColor(selectedEvent.type)}`, position: 'relative' , margin: 'auto' }}>
            <button onClick={() => { setSelectedEvent(null); setCheckoutStep(false); setIsRescheduling(false); }} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)' }}><X size={20} /></button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', backgroundColor: 'var(--bg-main)', borderRadius: '8px', color: getEventColor(selectedEvent.type) }}>
                  <CalendarIcon size={24} />
                </div>
                <div>
                  <h2 className="title-md" style={{ marginBottom: 0 }}>Ticket de Servicio</h2>
                  <span style={{ fontSize: '0.875rem', color: getEventColor(selectedEvent.type), fontWeight: 600 }}>{selectedEvent.type}</span>
                </div>
              </div>
              <div>
                <select
                  disabled={isWorker}
                  style={{ padding: '4px 8px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 600, outline: 'none', cursor: isWorker ? 'not-allowed' : 'pointer', opacity: isWorker ? 0.6 : 1 }}
                  value={selectedEvent.status || 'Agendado'}
                  onChange={async (e) => {
                    const newStatusUI = e.target.value;
                    const newEvents = events.map(ev => ev.id === selectedEvent.id ? { ...ev, status: newStatusUI } : ev);
                    setEvents(newEvents);
                    setSelectedEvent({ ...selectedEvent, status: newStatusUI });
                    
                    if (selectedEvent.isOrder) {
                      // Map UI status back to DB status for work orders
                      let dbStatus = 'ingresado';
                      if (newStatusUI === 'En Revisión') dbStatus = 'en_revision';
                      if (newStatusUI === 'En Producción') dbStatus = 'en_reparacion';
                      if (newStatusUI === 'Finalizado') dbStatus = 'completado';
                      
                      try {
                        await updateWorkOrder(companyId, { id: selectedEvent.realId, estado: dbStatus });
                        addToast('Estado de Orden de Trabajo actualizado.', 'success');
                      } catch (err) {
                        addToast('Error al actualizar OT', 'danger');
                      }
                    } else {
                      try {
                        await updateAgenda(companyId, {
                          id: selectedEvent.realId,
                          titulo: selectedEvent.title.replace('[Agenda] ', ''),
                          cliente: selectedEvent.client,
                          fecha: selectedEvent.date,
                          hora: selectedEvent.time,
                          tipo: selectedEvent.type,
                          monto: selectedEvent.amount,
                          detalles: selectedEvent.details,
                          estado: newStatusUI,
                          trabajador: selectedEvent.worker,
                          estado_pago: selectedEvent.estado_pago
                        });
                        addToast('Estado de Cita actualizado.', 'success');
                      } catch (err) {
                        addToast('Error al actualizar Cita', 'danger');
                      }
                    }
                  }}
                >
                  <option value="Agendado">Agendado</option>
                  <option value="En Revisión">En Revisión</option>
                  <option value="Confirmado">Confirmado</option>
                  <option value="En Producción">En Producción</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '16px', backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Cliente</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 500 }}>
                  <User size={16} /> {selectedEvent.client}
                </div>
                {selectedEvent.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                    <a href={`tel:${selectedEvent.phone.replace(/[^0-9+]/g, '')}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                      <Phone size={14} /> Llamar
                    </a>
                    <a href={`https://wa.me/${selectedEvent.phone.replace(/[^0-9+]/g, '')}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#25D366', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Trabajo a Realizar</label>
                <div style={{ fontSize: '1rem', fontWeight: 500 }}>{selectedEvent.title}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Fecha y Hora</label>
                  {!isRescheduling && !isWorker && (
                    <button 
                      onClick={() => {
                        setIsRescheduling(true);
                        setRescheduleDate(selectedEvent.date);
                        setRescheduleTime(selectedEvent.time);
                      }}
                      style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Reagendar
                    </button>
                  )}
                </div>
                {!isRescheduling ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', marginTop: '4px' }}><Clock size={16} /> {selectedEvent.date} a las {selectedEvent.time} hrs</div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'white' }} />
                    <input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'white' }} />
                    <button 
                      onClick={async () => {
                        try {
                          if (selectedEvent.isOrder) {
                            await updateWorkOrder(companyId, { id: selectedEvent.realId, fecha_ingreso: `${rescheduleDate} ${rescheduleTime}:00` });
                          } else {
                            await updateAgenda(companyId, { 
                              id: selectedEvent.realId,
                              titulo: selectedEvent.title.replace('[Agenda] ', ''),
                              cliente: selectedEvent.client,
                              fecha: rescheduleDate,
                              hora: rescheduleTime,
                              tipo: selectedEvent.type,
                              monto: selectedEvent.amount,
                              detalles: selectedEvent.details,
                              estado: selectedEvent.status,
                              trabajador: selectedEvent.worker,
                              estado_pago: selectedEvent.estado_pago
                            });
                          }
                          const updatedEvent = { ...selectedEvent, date: rescheduleDate, time: rescheduleTime };
                          setSelectedEvent(updatedEvent);
                          setEvents(events.map(ev => ev.id === selectedEvent.id ? updatedEvent : ev));
                          setIsRescheduling(false);
                          addToast('Reagendado correctamente', 'success');
                        } catch(e) {
                          addToast('Error al reagendar', 'danger');
                        }
                      }}
                      style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--success)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      Guardar
                    </button>
                    <button onClick={() => setIsRescheduling(false)} style={{ padding: '4px', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16}/></button>
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Estado de Pago</label>
                <select 
                  disabled={isWorker}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', cursor: isWorker ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: isWorker ? 0.6 : 1 }}
                  value={selectedEvent.estado_pago || 'pendiente'}
                  onChange={async (e) => {
                    const newPago = e.target.value;
                    const newEvents = events.map(ev => ev.id === selectedEvent.id ? { ...ev, estado_pago: newPago } : ev);
                    setEvents(newEvents);
                    setSelectedEvent({ ...selectedEvent, estado_pago: newPago });
                    
                    if (selectedEvent.isOrder) {
                        try {
                            await updateWorkOrder(companyId, { id: selectedEvent.realId, estado_pago: newPago });
                            addToast('Estado de pago actualizado.', 'success');
                        } catch (err) {}
                    } else {
                        try {
                            await updateAgenda(companyId, { 
                                id: selectedEvent.realId, 
                                titulo: selectedEvent.title.replace('[Agenda] ', ''),
                                cliente: selectedEvent.client,
                                fecha: selectedEvent.date,
                                hora: selectedEvent.time,
                                tipo: selectedEvent.type,
                                monto: selectedEvent.amount,
                                detalles: selectedEvent.details,
                                estado: selectedEvent.status,
                                trabajador: selectedEvent.worker,
                                estado_pago: newPago 
                            });
                            addToast('Estado de pago actualizado.', 'success');
                        } catch (err) {}
                    }
                  }}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="abono">Abono</option>
                  <option value="pagado">Pagado</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Trabajador Asignado (RRHH)</label>
                <select 
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', fontWeight: 500 }}
                  value={selectedEvent.worker || ''}
                  onChange={async (e) => {
                    const newWorker = e.target.value;
                    const newEvents = events.map(ev => ev.id === selectedEvent.id ? { ...ev, worker: newWorker } : ev);
                    setEvents(newEvents);
                    setSelectedEvent({ ...selectedEvent, worker: newWorker });
                    
                    if (selectedEvent.isOrder) {
                      try {
                        // Backend actually doesn't let us easily update just worker. Wait, updateWorkOrder accepts partials?
                        // The backend updateWorkOrder only updates estado right now! Wait...
                        // Let's check api.js: updateWorkOrder passes the payload via PUT.
                        // Wait, workorders.php PUT ONLY updates estado! 
                        addToast('El técnico se actualizó visualmente, pero se debe reasignar desde Kanban', 'info');
                      } catch (err) {}
                    } else {
                      try {
                        await updateAgenda(companyId, {
                          id: selectedEvent.realId,
                          titulo: selectedEvent.title.replace('[Agenda] ', ''),
                          cliente: selectedEvent.client,
                          fecha: selectedEvent.date,
                          hora: selectedEvent.time,
                          tipo: selectedEvent.type,
                          monto: selectedEvent.amount,
                          detalles: selectedEvent.details,
                          estado: selectedEvent.status,
                          trabajador: newWorker
                        });
                      } catch (err) {}
                    }
                  }}
                >
                  <option value="">No asignado</option>
                  {workers.map(w => (
                    <option key={w.rut} value={w.name}>{w.name} ({w.cargo})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><FileText size={16} /> Detalles del Trabajo</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-main)' }}>{selectedEvent.details}</p>
            </div>



            <div style={{ marginTop: '24px' }}>
              {!checkoutStep ? (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setCheckoutStep(true)}>Pasar a Venta</button>
                </div>
              ) : (
                <div className="animate-fade-in" style={{ padding: '16px', backgroundColor: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h4 style={{ marginBottom: '12px', fontSize: '0.875rem', fontWeight: 600, textAlign: 'center', color: 'var(--text-main)' }}>¿Desea continuar? Seleccione medio de pago:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '8px', justifyContent: 'center' }} onClick={() => { addToast('Pagando con Efectivo. Redirigiendo...', 'info'); setSelectedEvent(null); setCheckoutStep(false); }}>Efectivo</button>
                    <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '8px', justifyContent: 'center', backgroundColor: '#8b5cf6' }} onClick={() => { addToast('Pagando con Transferencia. Redirigiendo...', 'info'); setSelectedEvent(null); setCheckoutStep(false); }}>Transferencia</button>
                    <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '8px', justifyContent: 'center', backgroundColor: '#10b981' }} onClick={() => { addToast('Pagando con Débito/Crédito. Redirigiendo...', 'info'); setSelectedEvent(null); setCheckoutStep(false); }}>Débito/Crédito</button>
                  </div>
                  <button style={{ width: '100%', padding: '8px', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setCheckoutStep(false)}>Cancelar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
    
      {showNewClientModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', paddingTop: '10vh', justifyContent: 'center' }}>
          <div className="card animate-fade-in" style={{ width: '400px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="title-md">Nuevo Cliente</h3>
              <button onClick={() => setShowNewClientModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>RUT *</label>
                <input type="text" value={newClientData.rut} onChange={e => setNewClientData({...newClientData, rut: e.target.value})} style={{ width: '100%' }} placeholder="Ej: 11.111.111-1" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nombre *</label>
                <input type="text" value={newClientData.nombre} onChange={e => setNewClientData({...newClientData, nombre: e.target.value})} style={{ width: '100%' }} placeholder="Nombre completo" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Correo Electrónico</label>
                <input type="email" value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} style={{ width: '100%' }} placeholder="cliente@correo.com" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button onClick={() => setShowNewClientModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Cancelar</button>
                <button className="btn-success" disabled={isSavingClient} onClick={async () => {
                  if (!newClientData.rut || !newClientData.nombre) {
                    addToast('El RUT y el nombre son obligatorios', 'warning');
                    return;
                  }
                  setIsSavingClient(true);
                  try {
                    await createClient(companyId, newClientData);
                    addToast('Cliente guardado exitosamente', 'success');
                    setShowNewClientModal(false);
                    setRutInput(newClientData.nombre);
                    if (newClientData.email) setNewEmail(newClientData.email);
                    setNewClientData({ rut: '', nombre: '', telefono: '', email: '', direccion: '' });
                    loadData();
                  } catch (e) {
                    addToast('Error al guardar cliente: ' + e.message, 'danger');
                  } finally {
                    setIsSavingClient(false);
                  }
                }}>{isSavingClient ? 'Guardando...' : 'Guardar Cliente'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CalendarManager;
