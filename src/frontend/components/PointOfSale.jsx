import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, CheckCircle, PackageSearch, Save, X, Printer, CreditCard } from 'lucide-react';
import { getProducts, createSale, createFinanceTx, createQuote, getFinances } from '../services/api';

const PointOfSale = ({ companyId, addToast }) => {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // M2 states
  const [m2Product, setM2Product] = useState(null);
  const [widthInput, setWidthInput] = useState('1.0');
  const [heightInput, setHeightInput] = useState('1.0');

  // Checkout states
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('tarjeta');
  const [paymentCondition, setPaymentCondition] = useState('contado');
  const [creditDays, setCreditDays] = useState('30');
  const [clientRut, setClientRut] = useState('');
  const [clientName, setClientName] = useState('');


  // Load products from API
  useEffect(() => {
    setCart([]);
    setSearchTerm('');
    
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const data = await getProducts(companyId);
        setProducts(data);
      } catch (error) {
        addToast('Error al cargar productos: ' + error.message, 'danger');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCatalog();
  }, [companyId]);

  const filteredProducts = products.filter(product =>
    (product.nombre && product.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleProductSelect = (product) => {
    if (product.tipo === 'm2') {
      setM2Product(product);
      setWidthInput('1.0');
      setHeightInput('1.0');
    } else {
      addToCart(product, null, null);
    }
  };

  const addToCart = (product, w, h) => {
    const isM2 = !!w && !!h;
    const itemKey = isM2 ? `${product.id}-${w}x${h}` : `${product.id}`;
    const existing = cart.find(item => item.cartKey === itemKey);

    const basePrice = parseFloat(product.precio_venta) || 0;
    const finalPrice = isM2 ? Math.round(basePrice * w * h) : basePrice;
    const finalName = isM2 ? `${product.nombre} (${w}m x ${h}m, ${(w * h).toFixed(2)}m²)` : product.nombre;

    if (existing) {
      setCart(cart.map(item => item.cartKey === itemKey ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, {
        id: product.id,
        cartKey: itemKey,
        name: finalName,
        price: finalPrice,
        quantity: 1,
        originalPrice: basePrice,
        ancho: w,
        alto: h
      }]);
    }
    setM2Product(null);
  };

  const updateQuantity = (cartKey, delta) => {
    setCart(cart.map(item => {
      if (item.cartKey === cartKey) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (cartKey) => {
    setCart(cart.filter(item => item.cartKey !== cartKey));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const processPayment = async () => {
    if (paymentCondition === 'credito' && (!clientName)) {
      addToast('Por favor ingrese al menos el nombre del cliente para la venta a crédito.', 'warning');
      return;
    }

    const payload = {
      empresa_id: companyId,
      total,
      metodo_pago: paymentMethod,
      condicion_pago: paymentCondition,
      estado: paymentCondition === 'credito' ? 'pendiente' : 'pagado',
      items: cart.map(item => ({
        id: item.id,
        nombre: item.name,
        precio: item.price,
        cantidad: item.quantity,
        ancho: item.ancho,
        alto: item.alto
      }))
    };

    try {
      await createSale(companyId, payload);
      
      // Si la venta es al contado y en efectivo, registrar el ingreso en Finanzas
      if (paymentCondition === 'contado' && paymentMethod === 'efectivo') {
        const txPayload = {
          tipo: 'ingreso',
          monto: total,
          categoria: 'Ventas POS',
          descripcion: `Venta POS - Efectivo - ${cart.map(c => c.name).join(', ')}`,
          fecha: new Date().toISOString().split('T')[0]
        };
        try {
          await createFinanceTx(companyId, txPayload);
        } catch (e) {
          console.error("Error al registrar venta POS en finanzas:", e);
        }
      }

      addToast('¡Venta procesada con éxito en la Base de Datos!', 'success');
      setCart([]);
      setShowCheckout(false);
      setClientRut('');
      setClientName('');
      
      // Reload products to get updated stock
      const data = await getProducts(companyId);
      setProducts(data);
    } catch (error) {
      addToast('Error al procesar la venta: ' + error.message, 'danger');
    }
  };



  return (
    <div className="animate-fade-in flex-mobile-col h-auto-mobile" style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 64px)' }}>
      {/* Products Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 className="title-lg" style={{ marginBottom: 0 }}>Punto de Venta</h1>
            <p style={{ color: 'var(--text-muted)' }}>Selecciona productos para agregar a la venta.</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>

            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Buscar producto..." style={{ width: '100%', paddingLeft: '40px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '20px', 
          overflowY: 'auto',
          paddingBottom: '24px'
        }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Cargando catálogo desde BD...</div>
          ) : filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="card" 
              style={{ cursor: 'pointer', padding: '16px', transition: 'transform 0.2s' }}
              onClick={() => handleProductSelect(product)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {product.imagen_url ? (
                <img src={product.imagen_url} alt={product.nombre} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }} />
              ) : (
                <div style={{ width: '100%', height: '140px', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', marginBottom: '16px', color: 'var(--text-muted)' }}>
                  Sin foto
                </div>
              )}
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>{product.nombre}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>${parseFloat(product.precio_venta || 0).toLocaleString()}</span>
                {product.tipo === 'm2' && <span style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600 }}>Requiere m²</span>}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Stock: {product.stock === null ? '∞' : product.stock}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="card pos-cart" style={{ width: '380px', display: 'flex', flexDirection: 'column', padding: '24px' , margin: 'auto' }}>
        <h2 className="title-md" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
          Detalle de Venta
        </h2>
        
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cart.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>
              No hay productos en la venta actual.
            </div>
          ) : (
            cart.map(item => (
              <div key={item.cartKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ flex: 1, paddingRight: '8px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{item.name}</h4>
                  <div style={{ color: 'var(--accent)', fontWeight: 500 }}>${(item.price * item.quantity).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateQuantity(item.cartKey, -1)} style={{ padding: '4px', backgroundColor: 'var(--bg-card)', borderRadius: '4px' }}><Minus size={14}/></button>
                  <span style={{ width: '20px', textAlign: 'center', fontSize: '0.875rem' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.cartKey, 1)} style={{ padding: '4px', backgroundColor: 'var(--bg-card)', borderRadius: '4px' }}><Plus size={14}/></button>
                  <button onClick={() => removeFromCart(item.cartKey)} style={{ padding: '4px', color: 'var(--danger)', marginLeft: '8px' }}><Trash2 size={16}/></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.25rem', fontWeight: 700 }}>
            <span>Total:</span>
            <span>${total.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn-primary" 
              style={{ flex: 1, justifyContent: 'center', opacity: cart.length === 0 ? 0.5 : 1 }} 
              onClick={() => setShowCheckout(true)} 
              disabled={cart.length === 0}
            >
              Cobrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal M2 Input */}
      {m2Product && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <div className="card animate-fade-in" style={{ width: '400px', borderTop: '4px solid var(--accent)', position: 'relative', padding: '24px' , margin: 'auto' }}>
            <button onClick={() => setM2Product(null)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h2 className="title-md" style={{ marginBottom: '8px' }}>Dimensiones de Producto</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>Ingresa las dimensiones para el cobro por metro cuadrado de: <strong style={{ color: 'var(--text-main)' }}>{m2Product.nombre}</strong></p>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Ancho (metros)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.1" 
                  value={widthInput} 
                  onChange={e => setWidthInput(e.target.value)} 
                  style={{ width: '100%' }} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Alto (metros)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.1" 
                  value={heightInput} 
                  onChange={e => setHeightInput(e.target.value)} 
                  style={{ width: '100%' }} 
                />
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <span>Área Total:</span>
                <span style={{ color: 'white', fontWeight: 600 }}>{(parseFloat(widthInput) * parseFloat(heightInput) || 0).toFixed(2)} m²</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <span>Valor por m²:</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>${parseFloat(m2Product.precio_venta || 0).toLocaleString()}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700 }}>
                <span>Total Estimado:</span>
                <span style={{ color: 'var(--accent)' }}>${Math.round((m2Product.precio_venta || 0) * (parseFloat(widthInput) * parseFloat(heightInput) || 0)).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1, padding: '10px', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setM2Product(null)}>Cancelar</button>
              <button 
                className="btn-primary" 
                style={{ flex: 2, justifyContent: 'center' }} 
                onClick={() => {
                  const w = parseFloat(widthInput) || 1.0;
                  const h = parseFloat(heightInput) || 1.0;
                  addToCart(m2Product, w, h);
                }}
              >
                Confirmar y Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Checkout */}
      {showCheckout && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <div className="card animate-fade-in" style={{ width: '450px', borderTop: '4px solid var(--success)', position: 'relative', padding: '24px' , margin: 'auto' }}>
            <button onClick={() => setShowCheckout(false)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h2 className="title-md" style={{ marginBottom: '8px' }}>Pasarela de Cobro</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>Total a pagar: <strong style={{ color: 'var(--success)', fontSize: '1.2rem' }}>${total.toLocaleString()}</strong></p>

            {/* Condición de Pago */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Condición de Venta</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setPaymentCondition('contado')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: paymentCondition === 'contado' ? '2px solid var(--success)' : '1px solid var(--border)', backgroundColor: paymentCondition === 'contado' ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: paymentCondition === 'contado' ? 'white' : 'var(--text-muted)', fontWeight: 600 }}
                >
                  Contado
                </button>
                <button 
                  onClick={() => setPaymentCondition('credito')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: paymentCondition === 'credito' ? '2px solid var(--accent)' : '1px solid var(--border)', backgroundColor: paymentCondition === 'credito' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', color: paymentCondition === 'credito' ? 'white' : 'var(--text-muted)', fontWeight: 600 }}
                >
                  Crédito
                </button>
              </div>
            </div>

            {/* Medios de Pago (Si es contado) */}
            {paymentCondition === 'contado' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Método de Pago</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['tarjeta', 'efectivo', 'transferencia'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      style={{ flex: 1, padding: '8px 4px', fontSize: '0.8rem', borderRadius: '8px', border: paymentMethod === method ? '2px solid var(--accent)' : '1px solid var(--border)', backgroundColor: paymentMethod === method ? 'rgba(255,255,255,0.05)' : 'transparent', color: paymentMethod === method ? 'white' : 'var(--text-muted)', textTransform: 'capitalize' }}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Detalles de Crédito */}
            {paymentCondition === 'credito' && (
              <div className="animate-fade-in" style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', color: 'white' }}>Datos de Crédito del Cliente</h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nombre / Razón Social</label>
                    <input type="text" placeholder="Ej: Juan Pérez Ltda." value={clientName} onChange={e => setClientName(e.target.value)} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>RUT del Cliente (Opcional)</label>
                    <input type="text" placeholder="Ej: 76.543.210-K" value={clientRut} onChange={e => setClientRut(e.target.value)} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Plazo de Pago</label>
                    <select value={creditDays} onChange={e => setCreditDays(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white' }}>
                      <option value="30">30 Días (⏳ Cuenta Regresiva)</option>
                      <option value="60">60 Días (⏳ Cuenta Regresiva)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1, padding: '10px', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setShowCheckout(false)}>Cancelar</button>
              <button className="btn-success" style={{ flex: 2, justifyContent: 'center' }} onClick={processPayment}>
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal Cotización */}
      {showQuotationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '600px', width: '100%', borderTop: '4px solid var(--accent)', position: 'relative', padding: '24px', margin: 'auto' , margin: 'auto' }}>
            <button onClick={() => setShowQuotationModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h2 className="title-md" style={{ marginBottom: '16px' }}>Generar Cotización</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Empresa / Cliente</label>
                <input type="text" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'white' }} value={quoteData.empresa} onChange={e => setQuoteData({...quoteData, empresa: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>RUT</label>
                <input type="text" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'white' }} value={quoteData.rut} onChange={e => setQuoteData({...quoteData, rut: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Teléfono</label>
                <input type="text" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'white' }} value={quoteData.telefono} onChange={e => setQuoteData({...quoteData, telefono: e.target.value})} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Descripción del Proyecto</label>
                <textarea style={{ width: '100%', minHeight: '60px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', padding: '8px' }} value={quoteData.descripcion} onChange={e => setQuoteData({...quoteData, descripcion: e.target.value})}></textarea>
              </div>
            </div>

            {/* Vista Previa formato Excel */}
            <div id="quotation-print-area" style={{ backgroundColor: 'white', color: 'black', padding: '24px', borderRadius: '8px', marginBottom: '24px', fontFamily: 'Arial, sans-serif' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '2px solid #ccc', paddingBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#333' }}>J2 PUBLICIDAD SPA</h3>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>77.551.117-6<br/>Salas 357, Copiapó<br/>+569 4966 1782<br/>j2publicidadchile@gmail.com</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ margin: 0, color: '#0056b3' }}>COTIZACIÓN</h2>
                  <p style={{ margin: '4px 0', fontSize: '14px', fontWeight: 'bold' }}>N° {Math.floor(Math.random() * 1000) + 1000}</p>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>Fecha: {new Date().toISOString().split('T')[0]}</p>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div className="table-responsive">
<table style={{ width: '100%', fontSize: '14px' }}>
                  <tbody>
                    <tr><td style={{ width: '120px', fontWeight: 'bold', padding: '4px 0' }}>Empresa:</td><td>{quoteData.empresa || '_____________________'}</td></tr>
                    <tr><td style={{ fontWeight: 'bold', padding: '4px 0' }}>RUT:</td><td>{quoteData.rut || '_____________________'}</td></tr>
                    <tr><td style={{ fontWeight: 'bold', padding: '4px 0' }}>Teléfono:</td><td>{quoteData.telefono || '_____________________'}</td></tr>
                    <tr><td style={{ fontWeight: 'bold', padding: '4px 0', verticalAlign: 'top' }}>Descripción:</td><td>{quoteData.descripcion || '_____________________'}</td></tr>
                  </tbody>
                </table>
</div>
              </div>

              <div className="table-responsive">
<table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '2px solid #ccc' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Cant.</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Precio Unit.</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{item.name}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>${item.price.toLocaleString()}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>${(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
</div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '16px', fontWeight: 'bold' }}>
                <div style={{ width: '200px', display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#f0f0f0', border: '1px solid #ccc' }}>
                  <span>TOTAL:</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1, padding: '10px', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setShowQuotationModal(false)}>Cerrar</button>
              <button 
                className="btn-primary" 
                style={{ flex: 2, justifyContent: 'center' }} 
                onClick={async () => {
                  try {
                    // Mapear los items del carrito al formato de cotización
                    const quoteItems = cart.map(item => ({
                      cantidad: item.quantity,
                      descripcion: item.name,
                      precio: item.price
                    }));
                    
                    const subtotal = quoteItems.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
                    const iva = Math.round(subtotal * 0.19);
                    const totalCot = subtotal + iva;
                    
                    const quotePayload = {
                      empresa_id: companyId,
                      cliente: quoteData.empresa || 'Cliente POS',
                      rut: quoteData.rut || '',
                      telefono: quoteData.telefono || '',
                      descripcion_proyecto: quoteData.descripcion || 'Cotización generada desde Punto de Venta',
                      items: quoteItems,
                      subtotal: subtotal,
                      iva: iva,
                      total: totalCot
                    };
                    
                    await createQuote(companyId, quotePayload);
                    addToast('Cotización guardada exitosamente en el historial.', 'success');
                    
                    // Imprimir solo si se guardó correctamente
                    const printContents = document.getElementById('quotation-print-area').innerHTML;
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write('<html><head><title>Cotización</title>');
                    printWindow.document.write('<style>body { font-family: Arial, sans-serif; padding: 40px; } table { width: 100%; border-collapse: collapse; } th, td { padding: 8px; border-bottom: 1px solid #eee; text-align: left; } th { background-color: #f0f0f0; border-bottom: 2px solid #ccc; }</style>');
                    printWindow.document.write('</head><body>');
                    printWindow.document.write(printContents);
                    printWindow.document.write('</body></html>');
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                      printWindow.print();
                      printWindow.close();
                      setShowQuotationModal(false);
                      setCart([]);
                    }, 250);
                  } catch (error) {
                    addToast('Error al guardar la cotización: ' + (error.message || 'Inténtalo de nuevo.'), 'danger');
                    console.error(error);
                  }
                }}
              >
                Guardar e Imprimir Cotización
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointOfSale;
