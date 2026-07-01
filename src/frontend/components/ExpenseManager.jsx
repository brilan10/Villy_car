import React, { useState, useEffect } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, Filter, Receipt, Trash2, X, Eye, Edit } from 'lucide-react';
import InvoiceForm from './InvoiceForm';
import { getFinances, createFinanceTx, deleteFinanceTx, updateFinanceTx } from '../services/api';

const ExpenseManager = ({ companyId, addToast }) => {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('egreso'); // 'ingreso', 'egreso', o 'factura'

  // Transacciones de la API
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [simpleDate, setSimpleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [simpleAmount, setSimpleAmount] = useState('');
  const [simpleDescription, setSimpleDescription] = useState('');
  const [simpleCategory, setSimpleCategory] = useState('Ventas del Día');
  const [simplePaymentMethod, setSimplePaymentMethod] = useState('Transferencia');
  
  // States para Egreso Documento
  const [simpleDocType, setSimpleDocType] = useState('Boleta');
  const [simpleDocNum, setSimpleDocNum] = useState('');

  // Editing state
  const [editingTxId, setEditingTxId] = useState(null);

  // Filter states
  const [filterDateType, setFilterDateType] = useState('all'); // all, day, month, year
  const [filterDateValue, setFilterDateValue] = useState(() => new Date().toISOString().split('T')[0].substring(0, 7)); // default to current month YYYY-MM
  const [filterType, setFilterType] = useState('all'); // 'all', 'ingreso', 'egreso'
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDescription, setFilterDescription] = useState('');

  // Modal para ver los detalles de una factura guardada
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const loadFinances = async () => {
    setLoading(true);
    try {
      const data = await getFinances(companyId);
      setTransactions(data);
    } catch (error) {
      addToast('Error al cargar transacciones: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinances();
    resetSimpleForm();
    setSelectedInvoice(null);
  }, [companyId]);

  const resetSimpleForm = () => {
    setSimpleDate(new Date().toISOString().split('T')[0]);
    setSimpleAmount('');
    setSimpleDescription('');
    setSimpleCategory(formType === 'ingreso' ? 'Ventas del Día' : 'Compras');
    setSimplePaymentMethod('Transferencia');
    setSimpleDocType('Boleta');
    setSimpleDocNum('');
    setEditingTxId(null);
  };

  const handleSaveSimple = async () => {
    const amountVal = parseFloat(simpleAmount);
    if (isNaN(amountVal) || amountVal <= 0 || !simpleDescription) {
      addToast('Por favor, ingrese un monto válido y una descripción.', 'warning');
      return;
    }

    let finalDesc = simpleDescription;
    if (formType === 'egreso' && simpleDocNum) {
      finalDesc = `[${simpleDocType} Nº ${simpleDocNum}] ${simpleDescription}`;
    }

    const payload = {
      date: simpleDate,
      type: formType,
      category: simpleCategory || (formType === 'ingreso' ? 'Ventas del Día' : 'Compras'),
      paymentMethod: simplePaymentMethod,
      description: finalDesc,
      amount: amountVal
    };

    try {
      if (editingTxId) {
        await updateFinanceTx(companyId, { ...payload, id: editingTxId });
        addToast('Registro actualizado exitosamente', 'success');
      } else {
        await createFinanceTx(companyId, payload);
        addToast('Registro guardado exitosamente', 'success');
      }
      
      setShowForm(false);
      resetSimpleForm();
      loadFinances();
    } catch (error) {
      addToast('Error al guardar: ' + error.message, 'danger');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta transacción del historial financiero? Solo se pueden borrar registros manuales.')) {
      try {
        await deleteFinanceTx(companyId, id);
        addToast('Registro eliminado con éxito.', 'success');
        loadFinances();
      } catch (error) {
        addToast('Error al eliminar: ' + error.message, 'danger');
      }
    }
  };

  const handleEditTransaction = (tx) => {
    setFormType(tx.type);
    setSimpleDate(tx.date ? tx.date.split(' ')[0] : new Date().toISOString().split('T')[0]);
    setSimpleAmount(tx.amount);
    setSimpleCategory(tx.category);
    setSimplePaymentMethod(tx.paymentMethod);
    setEditingTxId(tx.id);
    
    let desc = tx.description;
    if (tx.type === 'egreso') {
      const match = desc.match(/^\[(.*?) Nº (.*?)\] (.*)$/);
      if (match) {
        setSimpleDocType(match[1]);
        setSimpleDocNum(match[2]);
        desc = match[3];
      } else {
        setSimpleDocType('Boleta');
        setSimpleDocNum('');
      }
    }
    setSimpleDescription(desc);
    setShowForm(true);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filterDateType !== 'all') {
      if (!tx.date) return false;
      const txDate = tx.date.split(' ')[0]; // YYYY-MM-DD
      if (filterDateType === 'day' && txDate !== filterDateValue) return false;
      if (filterDateType === 'month' && !txDate.startsWith(filterDateValue)) return false;
      if (filterDateType === 'year' && !txDate.startsWith(filterDateValue)) return false;
    }

    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterCategory && !tx.category?.toLowerCase().includes(filterCategory.toLowerCase())) return false;
    if (filterDescription && !tx.description?.toLowerCase().includes(filterDescription.toLowerCase())) return false;

    return true;
  });

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="title-lg" style={{ marginBottom: 0 }}>Egresos e Ingresos</h1>
          <p style={{ color: 'var(--text-muted)' }}>Registra facturas de compra, gastos y controla tus ingresos.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" style={{ backgroundColor: 'var(--success)' }} onClick={() => { setFormType('ingreso'); setSimpleCategory('Ventas del Día'); setShowForm(true); }}>
            <ArrowUpRight size={20} /> Ingreso Simple
          </button>
          <button className="btn-primary" style={{ backgroundColor: 'var(--danger)' }} onClick={() => { setFormType('egreso'); setSimpleCategory('Arriendos'); setShowForm(true); }}>
            <ArrowDownRight size={20} /> Egreso Simple
          </button>
          <button className="btn-primary" style={{ backgroundColor: 'var(--accent)' }} onClick={() => { setFormType('factura'); setShowForm(true); }}>
            <Receipt size={20} /> Ingresar Factura
          </button>
        </div>
      </div>

      {showForm && formType !== 'factura' && (
        <div className="card animate-fade-in" style={{ marginBottom: '32px', borderLeft: `4px solid ${formType === 'ingreso' ? 'var(--success)' : 'var(--danger)'}` , margin: 'auto' }}>
          <h2 className="title-md">Registrar {formType === 'ingreso' ? 'Ingreso' : 'Egreso'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Fecha</label>
              <input type="date" value={simpleDate} onChange={e => setSimpleDate(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Monto ($)</label>
              <input type="number" placeholder="0" value={simpleAmount} onChange={e => setSimpleAmount(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Categoría</label>
              <select 
                value={simpleCategory} 
                onChange={e => setSimpleCategory(e.target.value)} 
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
              >
                {formType === 'ingreso' ? (
                  <>
                    <option value="Ventas del Día">Ventas del Día</option>
                    <option value="Abonos de Facturas">Abonos de Facturas</option>
                    <option value="Otros Ingresos">Otros Ingresos</option>
                  </>
                ) : (
                  <>
                    <option value="Arriendos">Arriendos</option>
                    <option value="Donaciones">Donaciones</option>
                    <option value="Encomiendas">Encomiendas</option>
                    <option value="Insumos Oficina">Insumos Oficina</option>
                    <option value="Insumos Graficos">Insumos Graficos</option>
                    <option value="Insumos de Aseo">Insumos de Aseo</option>
                    <option value="Gastos Gerencia">Gastos Gerencia</option>
                    <option value="Combustible">Combustible</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Forma de Pago</label>
              <select 
                value={simplePaymentMethod} 
                onChange={e => setSimplePaymentMethod(e.target.value)} 
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
              >
                <option value="Transferencia">Transferencia</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Descripción</label>
              <input type="text" placeholder="Ej: Pago de insumos" value={simpleDescription} onChange={e => setSimpleDescription(e.target.value)} style={{ width: '100%' }} />
            </div>

            {formType === 'egreso' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Tipo de Documento</label>
                  <select 
                    value={simpleDocType} 
                    onChange={e => setSimpleDocType(e.target.value)} 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
                  >
                    <option value="Boleta">Boleta</option>
                    <option value="Factura">Factura</option>
                    <option value="Voucher">Voucher</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Número de Documento (Opcional)</label>
                  <input type="text" placeholder="Ej: 12345" value={simpleDocNum} onChange={e => setSimpleDocNum(e.target.value)} style={{ width: '100%' }} />
                </div>
              </>
            )}
          </div>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button style={{ padding: '10px 20px', borderRadius: '8px', color: 'var(--text-muted)' }} onClick={() => setShowForm(false)}>Cancelar</button>
            <button className={`btn-${formType === 'ingreso' ? 'success' : 'danger'}`} onClick={handleSaveSimple}>Guardar Registro</button>
          </div>
        </div>
      )}

      {showForm && formType === 'factura' && (
        <InvoiceForm 
          companyId={companyId} 
          addToast={addToast} 
          onClose={(saved) => {
            setShowForm(false);
            if (saved) loadFinances();
          }}
        />
      )}

      {/* Historial de Transacciones */}
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="title-md" style={{ marginBottom: 0 }}>Historial de Transacciones</h2>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Filter size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Filtros:</span>
            </div>
            
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)} 
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', fontSize: '0.875rem' }}
            >
              <option value="all">Todos los Tipos</option>
              <option value="ingreso">Solo Ingresos</option>
              <option value="egreso">Solo Egresos</option>
            </select>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select 
                value={filterDateType} 
                onChange={e => {
                  setFilterDateType(e.target.value);
                  if (e.target.value === 'day') setFilterDateValue(new Date().toISOString().split('T')[0]);
                  if (e.target.value === 'month') setFilterDateValue(new Date().toISOString().split('T')[0].substring(0, 7));
                  if (e.target.value === 'year') setFilterDateValue(new Date().getFullYear().toString());
                }} 
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', fontSize: '0.875rem' }}
              >
                <option value="all">Todas las Fechas</option>
                <option value="day">Por Día</option>
                <option value="month">Por Mes</option>
                <option value="year">Por Año</option>
              </select>
              {filterDateType !== 'all' && (
                <input 
                  type={filterDateType === 'day' ? 'date' : filterDateType === 'month' ? 'month' : 'number'}
                  value={filterDateValue}
                  onChange={e => setFilterDateValue(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', fontSize: '0.875rem' }}
                  placeholder={filterDateType === 'year' ? 'Ej: 2026' : ''}
                />
              )}
            </div>
            
            <input 
              type="text" 
              placeholder="Buscar por categoría..." 
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', fontSize: '0.875rem', flex: 1, minWidth: '150px' }}
            />
            
            <input 
              type="text" 
              placeholder="Buscar por descripción..." 
              value={filterDescription}
              onChange={e => setFilterDescription(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', fontSize: '0.875rem', flex: 1, minWidth: '150px' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
             <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando datos desde la Base de Datos...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px' }}>Fecha</th>
                  <th style={{ padding: '16px' }}>Tipo</th>
                  <th style={{ padding: '16px' }}>Categoría</th>
                  <th style={{ padding: '16px' }}>Descripción</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{tx.date ? tx.date.split(' ')[0] : ''}</td>
                    <td style={{ padding: '16px' }}>
                      {tx.type === 'ingreso' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success)', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '100px', fontSize: '0.875rem', fontWeight: 500 }}>
                          <ArrowUpRight size={14} /> Ingreso
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '4px 12px', borderRadius: '100px', fontSize: '0.875rem', fontWeight: 500 }}>
                          {tx.category === 'Factura Compra' ? <Receipt size={14} /> : <ArrowDownRight size={14} />} Egreso
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 500 }}>{tx.category}</td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{tx.description}</td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: tx.type === 'ingreso' ? 'var(--success)' : 'var(--danger)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                        <span>{tx.type === 'ingreso' ? '+' : '-'}${parseFloat(tx.amount).toLocaleString()}</span>
                        <button 
                          onClick={() => handleEditTransaction(tx)}
                          style={{ color: 'var(--accent)', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center' }} 
                          title="Editar Registro"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(tx.id)}
                          style={{ color: 'var(--danger)', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center' }} 
                          title="Eliminar Registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron transacciones financieras registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseManager;
