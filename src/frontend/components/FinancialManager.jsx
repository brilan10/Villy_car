import React, { useState, useEffect } from 'react';
import { LineChart, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart3, TrendingUp, Filter, Calculator, Check, AlertCircle, Clock, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getFinances, getCashClosures, saveCashClosure } from '../services/api';

const getCompanyNames = (id) => {
  const names = { 
    '1': 'J2 Publicidad', 
    '2': 'Dwork', 
    '3': 'Villy Car Tuning', 
    '4': 'Transportes' 
  };
  return names[id] || 'Empresa';
};

const getCompanyBadgeStyle = (id) => {
  switch (id) {
    case '1': return { bg: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', border: '1px solid #8b5cf6' }; // J2 Publicidad (Purple)
    case '2': return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid #f59e0b' }; // Dwork (Amber)
    case '3': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid #ef4444' }; // Villy Car (Red)
    case '4': return { bg: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', border: '1px solid #64748b' }; // Transportes (Slate Gray)
    default: return { bg: 'var(--bg-card)', color: 'white', border: '1px solid var(--border)' };
  }
};

const FinancialManager = ({ companyId, addToast }) => {
  const [selectedFilter, setSelectedFilter] = useState(companyId);
  const [transactions, setTransactions] = useState([]);
  const [allCompaniesData, setAllCompaniesData] = useState({});
  const [loading, setLoading] = useState(false);

  // Cash Audit States
  const [showArqueoModal, setShowArqueoModal] = useState(false);
  const [cashAuditHistory, setCashAuditHistory] = useState([]);
  const initialDenominations = {
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    100: 0,
    50: 0,
    10: 0
  };
  const [denominations, setDenominations] = useState(initialDenominations);
  const [customExpectedCash, setCustomExpectedCash] = useState('');
  const [arqueoNotes, setArqueoNotes] = useState('');

  // Details Modal States
  const [detailsModalData, setDetailsModalData] = useState(null);

  // Sync selectedFilter with global company session when it changes
  useEffect(() => {
    setSelectedFilter(companyId);
  }, [companyId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch closures for the selected company
      if (selectedFilter !== 'all') {
        const closures = await getCashClosures(selectedFilter);
        setCashAuditHistory(closures);
      }

      // 2. Compute totals for all companies
      const totals = {};
      const allTx = [];
      const cids = ['1', '2', '3', '4'];
      
      for (const cid of cids) {
        const txList = await getFinances(cid);
        // Tag with companyId for 'all' view
        const taggedTx = txList.map(t => ({ ...t, companyId: cid }));
        allTx.push(...taggedTx);
        
        const ingresos = txList.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const egresos = txList.filter(t => t.type === 'egreso').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        totals[cid] = { ingresos, egresos, neto: ingresos - egresos };
      }
      
      setAllCompaniesData(totals);

      // 3. Set transactions based on filter
      if (selectedFilter === 'all') {
        allTx.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(allTx);
      } else {
        const filteredTx = allTx.filter(t => t.companyId === selectedFilter);
        setTransactions(filteredTx);
      }

    } catch (error) {
      addToast('Error al cargar datos financieros: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [selectedFilter, companyId]);

  // Calculations for active filtered data
  const ingresosTotales = transactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const egresosTotales = transactions.filter(t => t.type === 'egreso').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const netoTotal = ingresosTotales - egresosTotales;

  // Calculos de IVA (19%) y PPM (1%)
  const ivaEstimado = Math.round(ingresosTotales * 0.19);
  const ppmEstimado = Math.round(ingresosTotales * 0.01);

  // Calculos de Comisiones para J2 Publicidad (empresa 3)
  const getJ2Ingresos = () => {
    const data = allCompaniesData['3'] || { ingresos: 0 };
    return data.ingresos;
  };
  const j2Ingresos = getJ2Ingresos();
  const j2Comision = Math.round(j2Ingresos * 0.75);
  const joelComision = Math.round(j2Ingresos * 0.25);

  const handleOpenArqueo = () => {
    const activeCompanyData = allCompaniesData[companyId] || { neto: 0 };
    setCustomExpectedCash(activeCompanyData.neto.toString());
    setDenominations(initialDenominations);
    setArqueoNotes('');
    setShowArqueoModal(true);
  };

  const handleSaveArqueo = async (e) => {
    e.preventDefault();
    const totalPhysical = Object.entries(denominations).reduce((sum, [denom, qty]) => sum + (parseInt(denom) * qty), 0);
    const expected = parseFloat(customExpectedCash) || 0;
    const discrepancy = totalPhysical - expected;
    
    const payload = {
      monto_apertura: 0,
      ventas_efectivo_esperado: expected,
      ventas_tarjeta_esperado: 0,
      ventas_transferencia_esperado: 0,
      arqueo_efectivo_real: totalPhysical,
      descuadre: discrepancy,
      notas: arqueoNotes,
      detalles_denominacion: denominations
    };
    
    try {
      await saveCashClosure(companyId, payload);
      addToast('Arqueo de caja registrado con éxito en BD.', 'success');
      setShowArqueoModal(false);
      loadAllData();
    } catch (error) {
      addToast('Error al registrar arqueo: ' + error.message, 'danger');
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="title-lg" style={{ marginBottom: 0 }}>Módulo Financiero Central</h1>
          <p style={{ color: 'var(--text-muted)' }}>Métricas, conciliación bancaria y comparativo de flujos de caja.</p>
        </div>
        
        {/* Dynamic Filter Dropdown */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginRight: '4px' }}>Ver Empresa:</span>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="1" style={{ backgroundColor: 'var(--bg-card)' }}>1. J2 Publicidad</option>
              <option value="2" style={{ backgroundColor: 'var(--bg-card)' }}>2. Dwork</option>
              <option value="3" style={{ backgroundColor: 'var(--bg-card)' }}>3. Villy Car Tuning</option>
              <option value="4" style={{ backgroundColor: 'var(--bg-card)' }}>4. Transportes</option>
              <option value="all" style={{ backgroundColor: 'var(--bg-card)', fontWeight: 700, color: 'var(--accent)' }}>✨ MOSTRAR TODAS</option>
            </select>
          </div>
          
          <button 
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.875rem' }} 
            onClick={handleOpenArqueo}
          >
            <Calculator size={16} /> Realizar Arqueo
          </button>

          <button 
            style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            onClick={loadAllData}
            title="Refrescar datos"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        
        {/* Ingresos */}
        <div 
          className="card hover-scale" 
          onClick={() => setDetailsModalData({ type: 'ingresos', title: 'Ingresos Acumulados', data: transactions.filter(t => t.type === 'ingreso') })}
          style={{ borderLeft: '4px solid var(--success)', padding: '20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '12px' }}>
            <span>Ingresos Acumulados</span>
            <ArrowUpRight size={20} color="var(--success)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
            ${ingresosTotales.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {selectedFilter === 'all' ? 'Consolidado todas las empresas' : `Filtro: ${getCompanyNames(selectedFilter)}`}
          </div>
        </div>

        {/* Egresos */}
        <div 
          className="card hover-scale" 
          onClick={() => setDetailsModalData({ type: 'egresos', title: 'Egresos / Gastos', data: transactions.filter(t => t.type === 'egreso') })}
          style={{ borderLeft: '4px solid var(--danger)', padding: '20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '12px' }}>
            <span>Egresos / Gastos</span>
            <ArrowDownRight size={20} color="var(--danger)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
            ${egresosTotales.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Facturas y egresos registrados</div>
        </div>

        {/* Neto */}
        <div 
          className="card hover-scale" 
          onClick={() => setDetailsModalData({ type: 'neto', title: 'Flujo de Caja Neta', data: transactions })}
          style={{ borderLeft: '4px solid var(--accent)', padding: '20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '12px' }}>
            <span>Caja Neta (Flujo Neto)</span>
            <Wallet size={20} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: netoTotal >= 0 ? 'var(--success)' : 'var(--danger)', marginBottom: '4px' }}>
            {netoTotal < 0 ? '-' : ''}${Math.abs(netoTotal).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Balance flujo - gastos</div>
        </div>

        {/* Impuestos Proyectados */}
        <div 
          className="card hover-scale"
          onClick={() => setDetailsModalData({ type: 'impuestos', title: 'Proyección de Impuestos (Basado en Ingresos)', data: transactions.filter(t => t.type === 'ingreso') })}
          style={{ borderLeft: '4px solid #a855f7', padding: '20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '12px' }}>
            <span>Impuestos (Proy. IVA/PPM)</span>
            <TrendingUp size={20} color="#a855f7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
            ${(ivaEstimado + ppmEstimado).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IVA (19%): ${ivaEstimado.toLocaleString()} | PPM (1%): ${ppmEstimado.toLocaleString()}</div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Historial Contable */}
        <div className="card" style={{ padding: '24px', width: '100%' }}>
          <h2 className="title-md" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Historial de Movimientos {selectedFilter === 'all' ? '(Consolidado Grupo)' : `(${getCompanyNames(selectedFilter)})`}
          </h2>
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando datos BD...</div>
            ) : (
              <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <th style={{ padding: '12px' }}>Fecha</th>
                    {selectedFilter === 'all' && <th style={{ padding: '12px' }}>Empresa</th>}
                    <th style={{ padding: '12px' }}>Categoría</th>
                    <th style={{ padding: '12px' }}>Detalle / Concepto</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={selectedFilter === 'all' ? 5 : 4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay transacciones registradas.</td>
                    </tr>
                  ) : (
                    transactions.map(tx => {
                      const bStyle = getCompanyBadgeStyle(tx.companyId);
                      return (
                        <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{tx.date ? tx.date.split(' ')[0] : ''}</td>
                          
                          {/* Company Badge Column (Visible only when showing ALL) */}
                          {selectedFilter === 'all' && (
                            <td style={{ padding: '12px' }}>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 600,
                                backgroundColor: bStyle.bg,
                                color: bStyle.color,
                                border: bStyle.border,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                display: 'inline-block'
                              }}>
                                {getCompanyNames(tx.companyId).split(' ')[0]}
                              </span>
                            </td>
                          )}
                          
                          <td style={{ padding: '12px' }}>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 600, 
                              backgroundColor: tx.type === 'ingreso' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                              color: tx.type === 'ingreso' ? 'var(--success)' : 'var(--danger)', 
                              padding: '2px 8px', 
                              borderRadius: '100px' 
                            }}>
                              {tx.category}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: 'white' }}>{tx.description}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: tx.type === 'ingreso' ? 'var(--success)' : 'var(--danger)' }}>
                            {tx.type === 'ingreso' ? '+' : '-'}${parseFloat(tx.amount).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
</div>
            )}
          </div>
        </div>

        {/* Columna Derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
          
          {/* Comparativa Multi-Empresa */}
          <div className="card" style={{ padding: '24px', width: '100%' }}>
          <h2 className="title-md" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="var(--accent)" />
            Caja Neta de las 4 Empresas
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {['1', '2', '3', '4'].map(id => {
              const data = allCompaniesData[id] || { ingresos: 0, egresos: 0, neto: 0 };
              const isSession = id === companyId;
              const isFiltered = id === selectedFilter;
              
              return (
                <div key={id} style={{ 
                  padding: '16px', 
                  backgroundColor: isFiltered ? 'var(--bg-main)' : 'rgba(255,255,255,0.02)', 
                  border: `1px solid ${isFiltered ? 'var(--accent)' : isSession ? 'var(--border)' : 'transparent'}`, 
                  borderRadius: '8px',
                  boxShadow: isFiltered ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: isFiltered ? 'var(--accent)' : 'white' }}>
                      {getCompanyNames(id)} {isSession && ' (Sesión)'}
                    </span>
                    <span style={{ fontWeight: 700, color: data.neto >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      ${data.neto.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Ingresos: ${data.ingresos.toLocaleString()}</span>
                    <span>Egresos: ${data.egresos.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>



        </div>
      </div>

      {/* Historial de Arqueos (Solo se muestra si la empresa no es "all") */}
      {selectedFilter !== 'all' && (
        <div className="card" style={{ marginTop: '24px', padding: '24px', width: '100%' }}>
          <h2 className="title-md" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="var(--accent)" />
            Historial de Arqueos de Caja - {getCompanyNames(selectedFilter)}
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <th style={{ padding: '12px' }}>Fecha / Hora</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Caja Esperada</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Efectivo Físico</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Diferencia / Descuadre</th>
                  <th style={{ padding: '12px' }}>Notas / Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {cashAuditHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No se han registrado arqueos de caja en esta empresa.</td>
                  </tr>
                ) : (
                  cashAuditHistory.map(audit => (
                    <tr key={audit.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '12px', color: 'white', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{audit.fecha_cierre ? audit.fecha_cierre.split(' ')[0] : ''}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({audit.fecha_cierre ? audit.fecha_cierre.split(' ')[1] : ''})</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>${parseFloat(audit.ventas_efectivo_esperado).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>${parseFloat(audit.arqueo_efectivo_real).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: parseFloat(audit.descuadre) === 0 ? 'var(--success)' : parseFloat(audit.descuadre) > 0 ? 'var(--accent)' : 'var(--danger)' }}>
                        {parseFloat(audit.descuadre) > 0 ? '+' : ''}${parseFloat(audit.descuadre).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={audit.notas}>
                        {audit.notas || 'Sin observaciones'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
</div>
          </div>
        </div>
      )}

      {/* Modal: Arqueo de Caja Denominacional */}
      {showArqueoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px', alignItems: 'center' }}>
          <form onSubmit={handleSaveArqueo} className="card animate-fade-in" style={{ width: '800px', maxWidth: '95%', borderTop: '4px solid var(--accent)', padding: '28px', maxHeight: '90vh', overflowY: 'auto', margin: '0 auto auto auto' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calculator size={24} style={{ color: 'var(--accent)' }} />
                <div>
                  <h2 className="title-lg" style={{ marginBottom: 0 }}>Arqueo de Caja Denominacional</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                    Empresa activa: <strong>{getCompanyNames(companyId)}</strong>
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setShowArqueoModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>

            {/* Content layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px' }}>
              
              {/* Left Column: Denomination Input */}
              <div style={{ borderRight: '1px solid var(--border)', paddingRight: '24px' }}>
                <h3 className="title-md" style={{ fontSize: '1rem', color: 'white', marginBottom: '16px' }}>Conteo de Efectivo</h3>
                
                {/* Scrollable inputs container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '45vh', overflowY: 'auto', paddingRight: '8px' }}>
                  
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', gap: '10px', paddingBottom: '4px', borderBottom: '1px solid var(--border)' }}>
                    <span>Denominación</span>
                    <span>Cantidad</span>
                    <span style={{ textAlign: 'right' }}>Subtotal</span>
                  </div>

                  {Object.keys(initialDenominations).sort((a, b) => b - a).map(denomStr => {
                    const denom = parseInt(denomStr);
                    const isBill = denom >= 1000;
                    const qty = denominations[denom] || 0;
                    const subtotal = denom * qty;
                    
                    return (
                      <div key={denom} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: isBill ? 'white' : 'var(--text-muted)', fontWeight: isBill ? 600 : 400 }}>
                          {isBill ? '💵' : '🪙'} ${denom.toLocaleString()}
                        </span>
                        <input 
                          type="number" 
                          min="0" 
                          placeholder="0" 
                          value={qty || ''} 
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setDenominations(prev => ({ ...prev, [denom]: val }));
                          }}
                          style={{ padding: '6px 10px', width: '100%', fontSize: '0.9rem', textAlign: 'center' }}
                        />
                        <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, textAlign: 'right' }}>
                          ${subtotal.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Reconciliation & Notes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 className="title-md" style={{ fontSize: '1rem', color: 'white', marginBottom: '4px' }}>Resultados del Arqueo</h3>
                
                {/* Total Physical */}
                {(() => {
                  const totalPhysical = Object.entries(denominations).reduce((sum, [denom, qty]) => sum + (parseInt(denom) * qty), 0);
                  const expected = parseFloat(customExpectedCash) || 0;
                  const discrepancy = totalPhysical - expected;
                  
                  let badgeColor = 'var(--success)';
                  let badgeBg = 'rgba(16, 185, 129, 0.15)';
                  let badgeText = 'Caja Cuadrada ✅';
                  
                  if (discrepancy > 0) {
                    badgeColor = 'var(--accent)';
                    badgeBg = 'rgba(99, 102, 241, 0.15)';
                    badgeText = 'Sobrante en Caja 🔼';
                  } else if (discrepancy < 0) {
                    badgeColor = 'var(--danger)';
                    badgeBg = 'rgba(239, 68, 68, 0.15)';
                    badgeText = 'Faltante en Caja 🚨';
                  }

                  return (
                    <>
                      <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>EFECTIVO FÍSICO:</span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>
                            ${totalPhysical.toLocaleString()}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Caja Esperada (Teórica):</span>
                            <input 
                              type="number" 
                              value={customExpectedCash} 
                              onChange={e => setCustomExpectedCash(e.target.value)} 
                              style={{ padding: '4px 8px', fontSize: '0.9rem', width: '130px', textAlign: 'right', fontWeight: 600 }}
                            />
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Diferencia / Descuadre:</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: discrepancy === 0 ? 'var(--success)' : discrepancy > 0 ? 'var(--accent)' : 'var(--danger)' }}>
                              {discrepancy > 0 ? '+' : ''}${discrepancy.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div style={{ marginTop: '14px', textAlign: 'center' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            color: badgeColor, 
                            backgroundColor: badgeBg, 
                            padding: '6px 14px', 
                            borderRadius: '100px', 
                            fontWeight: 700, 
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            {badgeText}
                          </span>
                        </div>
                      </div>

                      {/* Notes / Observations */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          Notas / Observaciones del Arqueo
                        </label>
                        <textarea 
                          placeholder="Registrar detalles sobre descuadres, vales de caja o incidentes..."
                          value={arqueoNotes}
                          onChange={e => setArqueoNotes(e.target.value)}
                          style={{ width: '100%', height: '80px', fontSize: '0.875rem', padding: '10px', resize: 'none' }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Actions Footer */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <button 
                type="button" 
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-muted)' }} 
                onClick={() => setShowArqueoModal(false)}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-success" 
                style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 600 }}
              >
                Guardar Arqueo
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Modal: Detalles de Métricas (Tarjetas) */}
      {detailsModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <div className="card animate-fade-in" style={{ width: '800px', maxWidth: '95%', borderTop: `4px solid ${detailsModalData.type === 'ingresos' ? 'var(--success)' : detailsModalData.type === 'egresos' ? 'var(--danger)' : detailsModalData.type === 'impuestos' ? '#a855f7' : 'var(--accent)'}`, padding: '28px', display: 'flex', flexDirection: 'column', margin: '0 auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <h2 className="title-md" style={{ marginBottom: 4 }}>Detalle: {detailsModalData.title}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                  Mostrando los últimos 50 registros vinculados a esta métrica.
                </p>
              </div>
              <button type="button" onClick={() => setDetailsModalData(null)} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <th style={{ padding: '12px', position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)' }}>Fecha</th>
                    {selectedFilter === 'all' && <th style={{ padding: '12px', position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)' }}>Empresa</th>}
                    <th style={{ padding: '12px', position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)' }}>Categoría</th>
                    <th style={{ padding: '12px', position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)' }}>Descripción</th>
                    <th style={{ padding: '12px', textAlign: 'right', position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {detailsModalData.data.length === 0 ? (
                    <tr>
                      <td colSpan={selectedFilter === 'all' ? 5 : 4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay datos para mostrar.</td>
                    </tr>
                  ) : (
                    detailsModalData.data.slice(0, 50).map(tx => {
                      const bStyle = getCompanyBadgeStyle(tx.companyId);
                      return (
                        <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{tx.date ? tx.date.split(' ')[0] : ''}</td>
                          {selectedFilter === 'all' && (
                            <td style={{ padding: '12px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, backgroundColor: bStyle.bg, color: bStyle.color, border: bStyle.border, padding: '2px 8px', borderRadius: '4px' }}>
                                {getCompanyNames(tx.companyId).split(' ')[0]}
                              </span>
                            </td>
                          )}
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, backgroundColor: tx.type === 'ingreso' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: tx.type === 'ingreso' ? 'var(--success)' : 'var(--danger)', padding: '2px 8px', borderRadius: '100px' }}>
                              {tx.category}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: 'white' }}>{tx.description}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: tx.type === 'ingreso' ? 'var(--success)' : 'var(--danger)' }}>
                            {tx.type === 'ingreso' ? '+' : '-'}${parseFloat(tx.amount).toLocaleString()}
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
        </div>
      )}

    </div>
  );
};

export default FinancialManager;
