import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, FileText, Download, X, Save } from 'lucide-react';
import { getQuotes, createQuote, updateQuote, deleteQuote, getProducts, getClients, createClient } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const QuotationManager = ({ companyId, addToast }) => {
  const [quotes, setQuotes] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isProductSearchFocused, setIsProductSearchFocused] = useState(false);
  const [filterCompany, setFilterCompany] = useState(companyId);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentQuote, setCurrentQuote] = useState({
    id: null,
    cliente: '',
    rut: '',
    telefono: '',
    descripcion_proyecto: '',
    items: [],
    subtotal: 0,
    iva: 0,
    total: 0
  });

  useEffect(() => {
    setFilterCompany(companyId);
  }, [companyId]);

  const fetchClients = async () => {
    try {
      const data = await getClients(companyId);
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching clients', error);
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchProducts();
    fetchClients();
  }, [companyId, filterCompany]);

  const fetchProducts = async () => {
    try {
      const data = await getProducts(companyId);
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products', error);
    }
  };

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const data = await getQuotes(filterCompany);
      setQuotes(Array.isArray(data) ? data : []);
    } catch (error) {
      addToast('Error al cargar cotizaciones', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (quote = null) => {
    if (quote) {
      setCurrentQuote(quote);
    } else {
      setCurrentQuote({
        id: null,
        cliente: '',
        rut: '',
        telefono: '',
        descripcion_proyecto: '',
        items: [{ cantidad: 1, descripcion: '', precio: 0 }],
        subtotal: 0,
        iva: 0,
        total: 0
      });
    }
    setShowModal(true);
  };

  const handleAddItem = () => {
    setCurrentQuote({
      ...currentQuote,
      items: [...currentQuote.items, { cantidad: 1, descripcion: '', precio: 0 }]
    });
  };

  const handleSelectProduct = (prod) => {
    setCurrentQuote({
      ...currentQuote,
      items: [...currentQuote.items, { cantidad: 1, descripcion: prod.nombre, precio: prod.precio }]
    });
    setProductSearchTerm('');
    setIsProductSearchFocused(false);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...currentQuote.items];
    newItems.splice(index, 1);
    setCurrentQuote({ ...currentQuote, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...currentQuote.items];
    newItems[index][field] = value;
    setCurrentQuote({ ...currentQuote, items: newItems });
  };

  // Recalculate totals
  useEffect(() => {
    if (!showModal) return;
    const subtotal = currentQuote.items.reduce((acc, item) => acc + ((parseFloat(item.precio) || 0) * (parseFloat(item.cantidad) || 0)), 0);
    const iva = Math.round(subtotal * 0.19);
    const total = subtotal + iva;
    setCurrentQuote(prev => ({ ...prev, subtotal, iva, total }));
  }, [currentQuote.items, showModal]);

  const handleSave = async () => {
    try {
      if (currentQuote.cliente && currentQuote.rut) {
        const clientName = currentQuote.cliente.trim();
        const clientRut = currentQuote.rut.trim();
        
        const clientExists = clients.find(c => 
          c.nombre.toLowerCase() === clientName.toLowerCase() ||
          c.rut === clientRut
        );

        if (!clientExists) {
          try {
            await createClient(companyId, {
              nombre: clientName,
              rut: clientRut,
              telefono: currentQuote.telefono || '',
              email: ''
            });
            fetchClients();
          } catch (e) {
            console.error('Error auto-creating client', e);
          }
        }
      }

      if (currentQuote.id) {
        await updateQuote(companyId, currentQuote);
        addToast('Cotización actualizada', 'success');
      } else {
        await createQuote(companyId, currentQuote);
        addToast('Cotización creada', 'success');
      }
      setShowModal(false);
      fetchQuotes();
    } catch (error) {
      addToast('Error al guardar cotización', 'danger');
    }
  };

  const handleDelete = async (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteQuote(companyId, deleteConfirmId);
      addToast('Cotización eliminada', 'success');
      fetchQuotes();
    } catch (error) {
      addToast('Error al eliminar', 'danger');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const getCompanyInfo = (id) => {
    switch (parseInt(id)) {
      case 1: return { name: 'J2 PUBLICIDAD SPA', rut: '77.551.117-6', email: 'contacto@j2publicidad.com', phone: '+56 9 4966 1782', address: 'Salas 357, Copiapó', subtitle: 'PRODUCTORA GRÁFICA', banco: 'Banco de Chile', tipoCuenta: 'Cuenta Corriente', cuenta: '00-118-22467-00', logoUrl: '/j2.png' };
      case 2: return { name: 'DWORK SpA', rut: '78.083.174-K', email: 'dworkchile@gmail.com', phone: '+56 9 8491 4247', address: 'Salas 357, Copiapó', subtitle: 'SOLUCIONES INTEGRALES', banco: 'Banco de Chile', tipoCuenta: 'Cuenta Corriente', cuenta: '1182224300', logoUrl: '/dwork.png' };
      case 3: return { name: 'VILLYCAR SpA', rut: '78.263.871-8', email: 'contacto@villycartuning.com', phone: '+56 9 1234 5678', address: 'Copiapó', subtitle: '', banco: 'Banco de Chile', tipoCuenta: 'Cuenta Corriente', cuenta: '1182322508', logoUrl: '/VILLYCAR_TUNING.png' };
      case 4: return { name: 'TRANSPORTES', rut: '78.263.871-8', email: 'contacto@villycartuning.com', phone: '+56 9 1234 5678', address: 'Copiapó', subtitle: 'TRANSPORTE DE PASAJEROS', banco: 'Banco de Chile', tipoCuenta: 'Cuenta Corriente', cuenta: '1182322508', logoUrl: '/transportes.png' };
      default: return { name: 'EMPRESA', rut: '1.111.111-1', email: 'contacto@empresa.com', phone: '', address: '', subtitle: '', banco: '', tipoCuenta: '', cuenta: '', logoUrl: null };
    }
  };

  const getLogoBase64 = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch(e) {
      return null;
    }
  };

  const generatePDF = async (quote) => {
    try {
      const doc = new jsPDF();
      const currentCompanyId = quote.empresa_id ? quote.empresa_id : companyId;
      const companyInfo = getCompanyInfo(currentCompanyId);
      
      let themeColor = [40, 53, 108]; // Default / J2 Publicidad
      let totalBgColor = null;
      if (parseInt(currentCompanyId) === 2) themeColor = [0, 0, 0]; // Dwork (Black)
      if (parseInt(currentCompanyId) === 3) {
        themeColor = [59, 179, 226]; // VillyCar (Light Blue)
        totalBgColor = [255, 87, 34]; // Orange total box
      }
      if (parseInt(currentCompanyId) === 4) themeColor = [51, 51, 51]; // Transportes (Dark Grey)
      
      if (!totalBgColor) totalBgColor = themeColor;

      const lightGray = [240, 240, 240];
      
      // Top Left Header Background
      doc.setFillColor(themeColor[0], themeColor[1], themeColor[2]);
      doc.rect(0, 0, 110, 50, 'F');
      
      // Top Left Text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('COTIZACIÓN', 55, 15, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const dateStr = quote.fecha ? new Date(quote.fecha).toLocaleDateString() : new Date().toLocaleDateString();
      doc.text(`Fecha: ${dateStr}`, 55, 23, { align: 'center' });
      doc.text(`Teléfono: ${companyInfo.phone}`, 55, 29, { align: 'center' });
      doc.text(`Email: ${companyInfo.email}`, 55, 35, { align: 'center' });
      
      doc.setFontSize(8);
      doc.text(`${companyInfo.address}`, 55, 41, { align: 'center' });

      // Top Right - Company Logo / Info
      if (companyInfo.logoUrl) {
        const base64Logo = await getLogoBase64(companyInfo.logoUrl);
        if (base64Logo) {
          // Adjust image size to fit nicely, preventing deformation.
          const imgProps = doc.getImageProperties(base64Logo);
          const maxWidth = 55;
          const maxHeight = 28;
          const ratio = Math.min(maxWidth / imgProps.width, maxHeight / imgProps.height);
          const finalWidth = imgProps.width * ratio;
          const finalHeight = imgProps.height * ratio;
          const xOffset = 196 - finalWidth; // Right align with margin
          const yOffset = 10 + (maxHeight - finalHeight) / 2; // Vertically center in box
          doc.addImage(base64Logo, 'PNG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');
        } else {
          doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
          doc.setFontSize(20);
          doc.setFont('helvetica', 'bold');
          doc.text(companyInfo.name, 196, 25, { align: 'right' });
        }
      } else {
        doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(companyInfo.name, 196, 25, { align: 'right' });
      }

      // Invoice Number
      doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Nº: ${quote.id || 'S/N'}`, 196, 47, { align: 'right' });

      // Two Columns Section Background
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(0, 52, 210, 40, 'F');

      // Left Column - Info Pago
      doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DE PAGO', 14, 60);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Razón Social: ${companyInfo.name}`, 14, 66);
      doc.text(`RUT: ${companyInfo.rut}`, 14, 71);
      doc.text(`${companyInfo.banco}`, 14, 76);
      doc.text(`${companyInfo.tipoCuenta} Nº: ${companyInfo.cuenta}`, 14, 81);
      doc.text(`${companyInfo.email}`, 14, 86);

      // Right Column - Client
      doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SEÑOR(ES):', 110, 60);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      const clientNameText = quote.cliente ? quote.cliente.toUpperCase() : 'N/A';
      const clientNameLines = doc.splitTextToSize(clientNameText, 85);
      doc.text(clientNameLines, 110, 66);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const shiftY = Math.max(0, (clientNameLines.length - 1) * 5);
      doc.text(`RUT: ${quote.rut || 'N/A'}`, 110, 71 + shiftY);
      doc.text(`Teléfono: ${quote.telefono || 'N/A'}`, 110, 76 + shiftY);

      // Table Data
      let currentY = 95;
      
      if (quote.descripcion_proyecto) {
        doc.setFont('helvetica', 'bold');
        doc.text('Descripción General:', 14, currentY);
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(quote.descripcion_proyecto, 182);
        doc.text(descLines, 14, currentY + 5);
        currentY += (descLines.length * 5) + 10;
      }

      const items = Array.isArray(quote.items) ? quote.items : [];
      const tableData = items.map((item, index) => [
        index + 1,
        item.descripcion,
        item.cantidad,
        'Unidad',
        `$${parseFloat(item.precio || 0).toLocaleString('es-CL')}`,
        `$${(parseFloat(item.cantidad || 0) * parseFloat(item.precio || 0)).toLocaleString('es-CL')}`
      ]);

      doc.autoTable({
        startY: currentY,
        head: [['Nº', 'DESCRIPCIÓN', 'CANT.', 'UNID.', 'VALOR U.', 'TOTAL']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: themeColor, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 9, cellPadding: 3, valign: 'middle', lineColor: [200, 200, 200], lineWidth: 0.1 },
        columnStyles: { 
          0: { halign: 'center', cellWidth: 15 },
          1: { halign: 'left' },
          2: { halign: 'center', cellWidth: 25 },
          3: { halign: 'right', cellWidth: 35 },
          4: { halign: 'right', cellWidth: 35 }
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
      });

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY + 30;
      
      // Bottom Section
      doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TÉRMINOS Y CONDICIONES:', 14, finalY + 15);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const terms = [
        "1. Una vez aceptada/confirmada la cotización, se dará por",
        "entendido que acepta los precios y condiciones detallados.",
        "2. Validez de la cotización: 15 días.",
        "3. Todo diseño y textos deben ser aprobados por el cliente."
      ];
      doc.text(terms, 14, finalY + 22);

      // Totals Box
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SubTotal :', 130, finalY + 15);
      doc.text(`$${parseFloat(quote.subtotal || 0).toLocaleString('es-CL')}`, 160, finalY + 15);
      
      doc.text('IVA      :', 130, finalY + 22);
      doc.text(`$${parseFloat(quote.iva || 0).toLocaleString('es-CL')}`, 160, finalY + 22);

      doc.setFillColor(totalBgColor[0], totalBgColor[1], totalBgColor[2]);
      doc.rect(125, finalY + 27, 71, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('TOTAL   :', 130, finalY + 34);
      doc.text(`$${parseFloat(quote.total || 0).toLocaleString('es-CL')}`, 160, finalY + 34);

      // Footer
      doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(companyInfo.name, 14, finalY + 50);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Teléfono: ${companyInfo.phone}`, 14, finalY + 58);
      doc.text(`Email: ${companyInfo.email}`, 70, finalY + 58);

      doc.save(`Cotizacion_${quote.id || 'N'}_${quote.cliente || 'Cliente'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      addToast('Error al generar el PDF: ' + error.message, 'danger');
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 className="title-lg" style={{ marginBottom: 0 }}>Registro de Cotizaciones</h1>
          <p style={{ color: 'var(--text-muted)' }}>Historial de cotizaciones emitidas a clientes.</p>
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginRight: '8px' }}>Filtrar por empresa:</label>
              <select 
                value={filterCompany} 
                onChange={e => setFilterCompany(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="all">Mostrar Todas</option>
                <option value="1">J2 Publicidad</option>
                <option value="2">Dwork SpA</option>
                <option value="3">Villy Car Spa</option>
                <option value="4">Transportes J2</option>
              </select>
            </div>
            <div>
              <input 
                type="text" 
                placeholder="Buscar por cliente, N°, RUT..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none', minWidth: '250px' }}
              />
            </div>
          </div>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Nueva Cotización
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando...</div>
        ) : quotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No hay cotizaciones registradas.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px', fontWeight: 600 }}>N°</th>
                  <th style={{ padding: '12px', fontWeight: 600 }}>Fecha</th>
                  <th style={{ padding: '12px', fontWeight: 600 }}>Cliente</th>
                  <th style={{ padding: '12px', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {quotes
                  .filter(q => {
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();
                    return (
                      (q.cliente && q.cliente.toLowerCase().includes(term)) ||
                      (q.rut && q.rut.toLowerCase().includes(term)) ||
                      (q.id && q.id.toString().includes(term))
                    );
                  })
                  .map(q => (
                  <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>{q.id}</td>
                    <td style={{ padding: '12px' }}>{new Date(q.fecha).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>{q.cliente}</td>
                    <td style={{ padding: '12px' }}>${q.total.toLocaleString()}</td>
                    <td style={{ padding: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => generatePDF(q)} style={{ padding: '6px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', borderRadius: '6px' }} title="Descargar PDF Cotización">
                        <FileText size={16} />
                      </button>
                      <button onClick={() => handleOpenModal(q)} style={{ padding: '6px', color: 'var(--accent)', backgroundColor: 'var(--bg-main)', borderRadius: '6px' }} title="Editar">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(q.id)} style={{ padding: '6px', color: 'var(--danger)', backgroundColor: 'var(--bg-main)', borderRadius: '6px' }} title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '800px', width: '100%', margin: 'auto', position: 'relative', borderTop: '4px solid var(--accent)' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h2 className="title-md" style={{ marginBottom: '24px' }}>{currentQuote.id ? 'Editar Cotización' : 'Nueva Cotización'}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Empresa / Cliente</label>
                <input 
                  type="text" 
                  list="client-options"
                  style={{ width: '100%' }} 
                  value={currentQuote.cliente} 
                  onChange={e => {
                    const val = e.target.value;
                    const found = clients.find(c => c.nombre === val);
                    if (found) {
                      setCurrentQuote({...currentQuote, cliente: val, rut: found.rut, telefono: found.telefono || ''});
                    } else {
                      setCurrentQuote({...currentQuote, cliente: val});
                    }
                  }} 
                />
                <datalist id="client-options">
                  {clients.map(c => <option key={c.id} value={c.nombre} />)}
                </datalist>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>RUT</label>
                <input type="text" style={{ width: '100%' }} value={currentQuote.rut} onChange={e => setCurrentQuote({...currentQuote, rut: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Teléfono</label>
                <input type="text" style={{ width: '100%' }} value={currentQuote.telefono} onChange={e => setCurrentQuote({...currentQuote, telefono: e.target.value})} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Descripción General / Proyecto</label>
                <textarea style={{ width: '100%', minHeight: '60px' }} value={currentQuote.descripcion_proyecto} onChange={e => setCurrentQuote({...currentQuote, descripcion_proyecto: e.target.value})}></textarea>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Ítems (Expresar en cm, m², o und)</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ position: 'relative', width: '250px' }}>
                    <input
                      type="text"
                      placeholder="Buscar producto..."
                      value={productSearchTerm}
                      onChange={e => {
                        setProductSearchTerm(e.target.value);
                        setIsProductSearchFocused(true);
                      }}
                      onFocus={() => setIsProductSearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsProductSearchFocused(false), 200)}
                      style={{ width: '100%', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'white', outline: 'none' }}
                    />
                    {isProductSearchFocused && productSearchTerm && (
                      <div className="animate-fade-in" style={{
                        position: 'absolute', top: '100%', left: 0, width: '100%',
                        backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)',
                        borderRadius: '8px', marginTop: '4px', zIndex: 50,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                        maxHeight: '200px', overflowY: 'auto'
                      }}>
                        {products.filter(p => p.nombre.toLowerCase().includes(productSearchTerm.toLowerCase())).map(p => (
                          <div 
                            key={p.id}
                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onClick={() => handleSelectProduct(p)}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.nombre}</span>
                            <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.75rem' }}>${parseFloat(p.precio).toLocaleString()}</span>
                          </div>
                        ))}
                        {products.filter(p => p.nombre.toLowerCase().includes(productSearchTerm.toLowerCase())).length === 0 && (
                          <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
                            Sin resultados
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button className="btn-success" style={{ padding: '6px 12px', fontSize: '0.875rem' }} onClick={handleAddItem}>
                    <Plus size={16} /> Ítem Manual
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentQuote.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ width: '80px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cantidad</label>
                      <input type="number" step="0.01" style={{ width: '100%' }} value={item.cantidad} onChange={e => handleItemChange(idx, 'cantidad', e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Descripción (Permite textos largos)</label>
                      <textarea style={{ width: '100%', minHeight: '40px' }} value={item.descripcion} onChange={e => handleItemChange(idx, 'descripcion', e.target.value)} />
                    </div>
                    <div style={{ width: '120px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Precio Unitario</label>
                      <input type="number" style={{ width: '100%' }} value={item.precio} onChange={e => handleItemChange(idx, 'precio', e.target.value)} />
                    </div>
                    <div style={{ width: '100px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Item</label>
                      <div style={{ padding: '10px 0', fontWeight: 600, color: 'var(--text-main)' }}>
                        ${((parseFloat(item.cantidad) || 0) * (parseFloat(item.precio) || 0)).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ paddingTop: '20px' }}>
                      <button onClick={() => handleRemoveItem(idx)} style={{ padding: '8px', color: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <div style={{ width: '300px', backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  <span>Subtotal:</span>
                  <span>${currentQuote.subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  <span>IVA (19%):</span>
                  <span>${currentQuote.iva.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  <span>Total:</span>
                  <span>${currentQuote.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-muted)' }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave}>
                <Save size={18} /> {currentQuote.id ? 'Guardar Cambios' : 'Crear Cotización'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deleteConfirmId && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '400px', width: '90%', margin: 'auto', textAlign: 'center', borderTop: '4px solid var(--danger)', padding: '32px' }}>
            <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', marginBottom: '24px' }}>
              <Trash2 size={32} />
            </div>
            <h2 className="title-md" style={{ marginBottom: '12px' }}>¿Eliminar Cotización?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
              Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar permanentemente esta cotización del sistema?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-main)', fontWeight: 500, cursor: 'pointer' }}
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancelar
              </button>
              <button 
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--danger)', color: 'white', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                onClick={confirmDelete}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationManager;
