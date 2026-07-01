import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Receipt } from 'lucide-react';
import InvoiceForm from './InvoiceForm';
import { getProducts, createProduct, updateProduct, deleteProduct, uploadDocument } from '../services/api';

const ProductManager = ({ companyId, addToast }) => {
  const [showForm, setShowForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newSellPrice, setNewSellPrice] = useState('');
  const [newUnit, setNewUnit] = useState('unidad');
  const [imageFile, setImageFile] = useState(null);
  const [noImage, setNoImage] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isAddingStock, setIsAddingStock] = useState(false);

  const loadProducts = async () => {
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

  useEffect(() => {
    loadProducts();
    setNewCode('');
    setNewName('');
    setNewCategory('General');
    setNewStock('');
    setNewCostPrice('0');
    setNewSellPrice('0');
    setNewUnit('unidad');
    setImageFile(null);
    setNoImage(false);
    setCurrentImageUrl('');
    setEditingId(null);
    setIsAddingStock(false);
  }, [companyId]);

  const handleCodeChange = (e) => {
    const code = e.target.value;
    setNewCode(code);
    
    if (code.trim() !== '') {
      const existing = products.find(p => p.codigo && p.codigo.toLowerCase() === code.trim().toLowerCase());
      if (existing && existing.id !== editingId) {
        setNewName(existing.nombre);
        setNewCategory(existing.categoria);
        setNewUnit(existing.tipo === 'm2' ? 'm2' : 'unidad');
        setCurrentImageUrl(existing.imagen_url || '');
        setImageFile(null);
        setNoImage(!existing.imagen_url);
        setEditingId(existing.id);
        setIsAddingStock(true);
        addToast('Producto cargado automáticamente. El stock ingresado se SUMARÁ al existente.', 'info');
      } else if (!existing && editingId) {
        setEditingId(null);
        setIsAddingStock(false);
      }
    } else {
      setEditingId(null);
      setIsAddingStock(false);
    }
  };

  const handleEditProduct = (product) => {
    setNewCode(product.codigo);
    setNewName(product.nombre);
    setNewCategory(product.categoria);
    setNewStock(product.stock !== null ? product.stock.toString() : '');
    setNewCostPrice(product.precio_compra ? product.precio_compra.toString() : '0');
    setNewSellPrice(product.precio_venta ? product.precio_venta.toString() : product.precio.toString());
    setNewUnit(product.tipo === 'm2' ? 'm2' : 'unidad');
    setCurrentImageUrl(product.imagen_url || '');
    setImageFile(null);
    setNoImage(!product.imagen_url);
    setEditingId(product.id);
    setIsAddingStock(false);
    setShowForm(true);
    setShowInvoiceForm(false);
  };

  const handleSave = async () => {
    if (!newCode || !newName || !newSellPrice) {
      addToast('Por favor, complete los campos obligatorios (Código, Nombre y Precio Venta).', 'warning');
      return;
    }

    try {
      let finalImageUrl = currentImageUrl;
      if (noImage) {
        finalImageUrl = null;
      } else if (imageFile) {
        const uploadRes = await uploadDocument(imageFile);
        finalImageUrl = uploadRes.url;
      }

      let finalStock = parseInt(newStock);
      if (editingId && isAddingStock && !isNaN(finalStock)) {
        const existingProduct = products.find(p => p.id === editingId);
        if (existingProduct && existingProduct.stock !== null) {
          finalStock = parseInt(existingProduct.stock) + finalStock;
        }
      }

      const newProduct = {
        codigo: newCode,
        nombre: newName,
        categoria: newCategory || 'General',
        stock: isNaN(finalStock) ? null : finalStock,
        precio_compra: parseFloat(newCostPrice) || 0,
        precio_venta: parseFloat(newSellPrice) || 0,
        imagen_url: finalImageUrl,
        tipo: companyId === '3' && newUnit === 'm2' ? 'm2' : (newStock ? 'objeto' : 'servicio')
      };

      if (editingId) {
        await updateProduct(companyId, { id: editingId, ...newProduct });
        addToast('Registro actualizado con éxito', 'success');
      } else {
        await createProduct(companyId, newProduct);
        addToast('Registro guardado con éxito', 'success');
      }
      setShowForm(false);
      setEditingId(null);
      loadProducts();
    } catch (error) {
      addToast('Error al guardar el producto: ' + error.message, 'danger');
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(companyId, productToDelete.id);
      addToast('Registro eliminado con éxito.', 'success');
      loadProducts();
    } catch (error) {
      addToast('Error al eliminar: ' + error.message, 'danger');
    } finally {
      setProductToDelete(null);
    }
  };

  const filteredProducts = products.filter(product =>
    (product.nombre && product.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.codigo && product.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="title-lg" style={{ marginBottom: 0 }}>Mantenedor de Productos / Servicios</h1>
          <p style={{ color: 'var(--text-muted)' }}>Administra el inventario y catálogo de la empresa actual.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" style={{ backgroundColor: 'var(--accent)' }} onClick={() => { setShowInvoiceForm(!showInvoiceForm); setShowForm(false); }}>
            <Receipt size={20} />
            Ingresar Factura
          </button>
          <button className="btn-primary" onClick={() => { 
            setShowForm(!showForm); 
            setShowInvoiceForm(false); 
            if (!showForm) {
              setNewCode('');
              setNewName('');
              setNewCategory('');
              setNewStock('');
              setNewCostPrice('');
              setNewSellPrice('');
              setNewUnit('unidad');
              setImageFile(null);
              setNoImage(false);
              setCurrentImageUrl('');
              setEditingId(null);
            }
          }}>
            <Plus size={20} />
            Nuevo Registro
          </button>
        </div>
      </div>

      {showInvoiceForm && (
        <InvoiceForm 
          companyId={companyId} 
          addToast={addToast} 
          onClose={(saved) => {
            setShowInvoiceForm(false);
            if (saved) loadProducts();
          }} 
        />
      )}

      {showForm && (
        <div className="card animate-fade-in" style={{ marginBottom: '32px', borderLeft: '4px solid var(--accent)' , margin: 'auto' }}>
          <h2 className="title-md">Agregar / Editar</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Código</label>
              <input type="text" placeholder="Ej: PROD-01" style={{ width: '100%' }} value={newCode} onChange={handleCodeChange} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nombre</label>
              <input type="text" placeholder="Nombre del producto o servicio" style={{ width: '100%' }} value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Categoría</label>
              <input type="text" placeholder="Ej: Servicios, Productos, Audio..." style={{ width: '100%' }} value={newCategory} onChange={e => setNewCategory(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Precio Venta ($)</label>
              <input type="text" placeholder="0" style={{ width: '100%' }} value={newSellPrice} onChange={e => setNewSellPrice(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Imagen del Producto</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} disabled={noImage} style={{ width: '100%', color: 'var(--text-main)', padding: '8px 0' }} />
                {currentImageUrl && !imageFile && !noImage && (
                  <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--success)' }}>Ya tiene imagen registrada.</div>
                )}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '0.875rem', marginTop: '24px', cursor: 'pointer' }}>
                <input type="checkbox" checked={noImage} onChange={e => setNoImage(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                Sin foto
              </label>
            </div>
            {companyId === '3' && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Unidad de Venta</label>
                <select
                  value={newUnit}
                  onChange={e => setNewUnit(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', outline: 'none' }}
                >
                  <option value="unidad">Por Unidad (c/u)</option>
                  <option value="m2">Por Metro Cuadrado (m²)</option>
                </select>
              </div>
            )}
          </div>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button style={{ padding: '10px 20px', borderRadius: '8px', color: 'var(--text-muted)' }} onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="btn-success" onClick={handleSave}>Guardar</button>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="title-md" style={{ marginBottom: 0 }}>Listado Actual</h2>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={20} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Buscar por código o nombre..." style={{ width: '100%', paddingLeft: '40px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando productos...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px' }}>Código</th>
                  <th style={{ padding: '16px' }}>Nombre</th>
                  <th style={{ padding: '16px' }}>Categoría</th>
                  <th style={{ padding: '16px' }}>Precio</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px', fontWeight: 500 }}>{product.codigo}</td>
                    <td style={{ padding: '16px' }}>{product.nombre}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ backgroundColor: 'var(--bg-main)', padding: '4px 12px', borderRadius: '100px', fontSize: '0.875rem' }}>{product.categoria}</span>
                      {product.tipo === 'm2' && (
                        <span style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, marginLeft: '8px' }}>m²</span>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>${parseFloat(product.precio || product.precio_venta || 0).toLocaleString()}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button onClick={() => handleEditProduct(product)} style={{ padding: '8px', color: 'var(--accent)', marginRight: '8px', cursor: 'pointer' }} title="Editar"><Edit size={18} /></button>
                      <button onClick={() => setProductToDelete(product)} style={{ padding: '8px', color: 'var(--danger)', cursor: 'pointer' }} title="Eliminar"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No hay productos registrados para esta empresa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Confirmar Eliminación */}
      {productToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <div className="card animate-fade-in" style={{ width: '400px', borderTop: '4px solid var(--danger)', position: 'relative', padding: '24px' , margin: 'auto' }}>
            <h2 className="title-md" style={{ marginBottom: '16px', color: 'var(--danger)' }}>Confirmar Eliminación</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
              ¿Estás seguro de que deseas eliminar permanentemente <strong>{productToDelete.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1, padding: '10px', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setProductToDelete(null)}>Cancelar</button>
              <button 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: 'var(--danger)', color: 'white', fontWeight: 600, border: 'none' }} 
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

export default ProductManager;
