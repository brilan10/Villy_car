import React, { useState, useEffect } from 'react';
import { Receipt, Trash2, Plus, ArrowDownRight, CheckCircle, Upload } from 'lucide-react';
import { getProducts, saveInvoiceEntry, uploadDocument } from '../services/api';

const InvoiceForm = ({ companyId, onClose, addToast }) => {
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [invoiceData, setInvoiceData] = useState({ provider: '', number: '', date: new Date().toISOString().split('T')[0] });
  const [companyProducts, setCompanyProducts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await getProducts(companyId);
        setCompanyProducts(data);
      } catch (e) {
        addToast('Error al cargar catálogo de productos', 'danger');
      }
    };
    fetchCatalog();
    setInvoiceItems([{ 
      id: Date.now(), 
      type: 'producto', 
      productId: '', 
      code: '', 
      description: '', 
      qty: 1, 
      costPrice: 0, 
      sellPrice: 0,
      imageFile: null,
      imageUrl: null,
      keepOldImage: true
    }]);
  }, [companyId]);

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { 
      id: Date.now(), 
      type: 'producto', 
      productId: '', 
      code: '', 
      description: '', 
      qty: 1, 
      costPrice: 0, 
      sellPrice: 0,
      imageFile: null,
      imageUrl: null,
      keepOldImage: true
    }]);
  };

  const updateInvoiceItem = (id, field, value) => {
    setInvoiceItems(invoiceItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeInvoiceItem = (id) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id));
  };

  const handleValidate = (id, name) => {
    if (!name.trim()) {
      addToast('Ingrese un nombre para validar', 'warning');
      return;
    }
    const existing = companyProducts.find(p => p.nombre.toLowerCase().trim() === name.toLowerCase().trim());
    if (existing) {
      updateInvoiceItem(id, 'productId', existing.id);
      updateInvoiceItem(id, 'code', existing.codigo || '');
      updateInvoiceItem(id, 'costPrice', parseFloat(existing.precio_compra) || 0);
      updateInvoiceItem(id, 'sellPrice', parseFloat(existing.precio_venta) || parseFloat(existing.precio) || 0);
      updateInvoiceItem(id, 'imageUrl', existing.imagen_url);
      updateInvoiceItem(id, 'keepOldImage', true);
      addToast(`Producto encontrado (${existing.codigo}). Precios y foto recuperados.`, 'success');
    } else {
      updateInvoiceItem(id, 'productId', '');
      addToast('Producto nuevo. Se registrará en el catálogo automáticamente.', 'info');
    }
  };

  // The total is based on Cost Price (since it's a purchase invoice)
  const invoiceTotal = invoiceItems.reduce((acc, item) => acc + ((item.qty || 0) * (item.costPrice || 0)), 0);

  const handleSaveInvoice = async () => {
    if (invoiceItems.length === 0 || invoiceTotal <= 0) {
      addToast('La factura no tiene ítems o el total es 0', 'error');
      return;
    }
    if (!invoiceData.provider || !invoiceData.number) {
      addToast('Por favor, complete los datos del proveedor y el número de factura.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const processedItems = await Promise.all(invoiceItems.map(async item => {
        let finalImageUrl = item.imageUrl;
        // Upload new image if they don't want to keep the old one and provided a new file
        if (!item.keepOldImage && item.imageFile) {
          const res = await uploadDocument(item.imageFile);
          finalImageUrl = res.url;
        }

        return {
          nombre: item.description,
          codigo: item.code,
          qty: item.qty,
          precio_compra: item.costPrice,
          precio_venta: item.sellPrice,
          imagen_url: finalImageUrl,
          tipo: item.type === 'producto' ? 'objeto' : 'servicio'
        };
      }));

      await saveInvoiceEntry(companyId, {
        provider: invoiceData.provider,
        number: invoiceData.number,
        date: invoiceData.date,
        total: Math.round(invoiceTotal * 1.19), // Save total with IVA as the real expense
        items: processedItems
      });

      addToast('¡Factura ingresada con éxito! Egresos e inventario actualizados.', 'success');
      if (onClose) onClose(true);
    } catch (error) {
      addToast('Error al guardar la factura: ' + error.message, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ marginBottom: '32px', borderLeft: `4px solid var(--accent)` , margin: 'auto' }}>
      <h2 className="title-md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Receipt size={24} color="var(--accent)" />
        Detalle de Factura de Compra
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
        Ingresa los productos que compraste. Puedes Validar por Nombre para actualizar el stock.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Proveedor</label>
          <input type="text" placeholder="Razón Social del Proveedor" style={{ width: '100%' }} value={invoiceData.provider} onChange={e => setInvoiceData({...invoiceData, provider: e.target.value})} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>N° Factura</label>
          <input type="text" placeholder="Ej: 154092" style={{ width: '100%' }} value={invoiceData.number} onChange={e => setInvoiceData({...invoiceData, number: e.target.value})} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Fecha de Emisión</label>
          <input type="date" value={invoiceData.date} onChange={e => setInvoiceData({...invoiceData, date: e.target.value})} style={{ width: '100%' }} />
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr 0.8fr 1fr 1fr 1.5fr 40px', gap: '12px', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
          <div>Tipo</div>
          <div>Producto (Nombre)</div>
          <div>Cant.</div>
          <div>Precio Costo</div>
          <div>Precio Venta</div>
          <div>Imagen</div>
          <div></div>
        </div>
        
        {invoiceItems.map((item) => (
          <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr 0.8fr 1fr 1fr 1.5fr 40px', gap: '12px', marginBottom: '16px', alignItems: 'start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <select
              value={item.type || 'producto'}
              onChange={e => updateInvoiceItem(item.id, 'type', e.target.value)}
              style={{ width: '100%', padding: '10px 10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
            >
              <option value="producto">Producto</option>
              <option value="servicio">Servicio</option>
            </select>

            <div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Nombre del producto..." 
                  value={item.description} 
                  onChange={e => updateInvoiceItem(item.id, 'description', e.target.value)} 
                  style={{ width: '100%' }} 
                />
                <button 
                  onClick={() => handleValidate(item.id, item.description)}
                  style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '0 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <CheckCircle size={14} /> Validar
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Código (Opcional)" 
                value={item.code || ''} 
                onChange={e => updateInvoiceItem(item.id, 'code', e.target.value)} 
                style={{ width: '100%', marginTop: '8px', fontSize: '0.8rem', padding: '6px 10px' }} 
              />
            </div>

            <input 
              type="number" 
              min="1" 
              value={item.qty} 
              onChange={e => updateInvoiceItem(item.id, 'qty', parseInt(e.target.value) || 0)} 
              style={{ width: '100%' }} 
            />

            <input 
              type="text" 
              placeholder="Costo" 
              value={item.costPrice || ''} 
              onChange={e => updateInvoiceItem(item.id, 'costPrice', parseInt(e.target.value.replace(/\D/g, '')) || 0)} 
              style={{ width: '100%' }} 
            />

            <input 
              type="text" 
              placeholder="Venta Sugerida" 
              value={item.sellPrice || ''} 
              onChange={e => updateInvoiceItem(item.id, 'sellPrice', parseInt(e.target.value.replace(/\D/g, '')) || 0)} 
              style={{ width: '100%' }} 
            />

            <div>
              {item.imageUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--success)' }}>
                    <input type="checkbox" checked={item.keepOldImage} onChange={e => updateInvoiceItem(item.id, 'keepOldImage', e.target.checked)} />
                    Mantener foto anterior
                  </label>
                  {!item.keepOldImage && (
                    <input type="file" accept="image/*" onChange={e => updateInvoiceItem(item.id, 'imageFile', e.target.files[0])} style={{ width: '100%', fontSize: '0.75rem', color: 'var(--text-muted)' }} />
                  )}
                </div>
              ) : (
                <input type="file" accept="image/*" onChange={e => updateInvoiceItem(item.id, 'imageFile', e.target.files[0])} style={{ width: '100%', fontSize: '0.75rem', color: 'var(--text-muted)' }} />
              )}
            </div>

            <button onClick={() => removeInvoiceItem(item.id)} style={{ color: 'var(--danger)', padding: '8px', cursor: 'pointer' }} title="Eliminar ítem"><Trash2 size={20} /></button>
          </div>
        ))}
        
        <button onClick={addInvoiceItem} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 500, marginTop: '12px' }}>
          <Plus size={18} /> Agregar otro ítem
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
        <div style={{ width: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--text-muted)' }}>
            <span>Neto:</span>
            <span>${invoiceTotal.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--text-muted)' }}>
            <span>IVA (19%):</span>
            <span>${Math.round(invoiceTotal * 0.19).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>
            <span>Total Gasto:</span>
            <span>${Math.round(invoiceTotal * 1.19).toLocaleString()}</span>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <button style={{ flex: 1, padding: '12px', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => onClose(false)}>Cancelar</button>
            <button 
              style={{ flex: 2, padding: '12px', borderRadius: '8px', backgroundColor: 'var(--danger)', color: 'white', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} 
              onClick={handleSaveInvoice}
              disabled={isSaving}
            >
              <ArrowDownRight size={20} /> {isSaving ? 'Guardando...' : 'Guardar Factura'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
