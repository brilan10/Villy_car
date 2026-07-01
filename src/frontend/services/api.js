export const API_BASE = '/backend';

async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Error: ${response.status} - ${text}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

// Productos
export const getProducts = (companyId) => fetchAPI(`/products.php?empresa_id=${companyId}`);
export const createProduct = (companyId, data) => fetchAPI(`/products.php?empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });
export const updateProduct = (companyId, data) => fetchAPI(`/products.php?empresa_id=${companyId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProduct = (companyId, id) => fetchAPI(`/products.php?empresa_id=${companyId}&id=${id}`, { method: 'DELETE' });

// Auth
export const loginUser = (rut, password) => fetchAPI(`/auth.php`, { method: 'POST', body: JSON.stringify({ rut, password }) });

// Clientes
export const getClients = (companyId) => fetchAPI(`/clients.php?empresa_id=${companyId}`);
export const createClient = (companyId, data) => fetchAPI(`/clients.php?empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });
export const updateClient = (companyId, data) => fetchAPI(`/clients.php?empresa_id=${companyId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteClient = (companyId, id) => fetchAPI(`/clients.php?empresa_id=${companyId}&id=${id}`, { method: 'DELETE' });

// RRHH y Trabajadores
export const getWorkers = (companyId, all = false) => fetchAPI(`/workers.php?empresa_id=${companyId}${all ? '&all=1' : ''}`);
export const createWorker = (companyId, data) => fetchAPI(`/workers.php?empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });
export const updateWorker = (companyId, data) => fetchAPI(`/workers.php?empresa_id=${companyId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteWorker = (companyId, id) => fetchAPI(`/workers.php?empresa_id=${companyId}&id=${id}`, { method: 'DELETE' });
export const setWorkerPassword = (companyId, data) => fetchAPI(`/workers.php?action=set_password&empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });
export const changeWorkerPassword = (companyId, data) => fetchAPI(`/workers.php?action=change_password&empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });
export const toggleWorkerStatus = (companyId, id, activo) => fetchAPI(`/workers.php?action=toggle_status&empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify({ id, activo }) });


// Liquidaciones
export const getPayrolls = (companyId, workerId = null) => fetchAPI(`/workers.php?action=payrolls&empresa_id=${companyId}${workerId ? `&trabajador_id=${workerId}` : ''}`);
export const savePayroll = (companyId, data) => fetchAPI(`/workers.php?action=payrolls&empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });
export const updatePayrollPdf = (id, fileUrl, companyId) => fetchAPI(`/workers.php?action=payrolls&empresa_id=${companyId}`, {
  method: 'PUT',
  body: JSON.stringify({ id, archivo_url: fileUrl })
});

export const getAnexos = (companyId) => fetchAPI(`/workers.php?action=anexos&empresa_id=${companyId}`);
export const createAnexo = (companyId, anexoData) => fetchAPI(`/workers.php?action=anexos&empresa_id=${companyId}`, {
  method: 'POST',
  body: JSON.stringify(anexoData)
});
export const updateAnexoPdf = (id, fileUrl, companyId) => fetchAPI(`/workers.php?action=anexos&empresa_id=${companyId}`, {
  method: 'PUT',
  body: JSON.stringify({ id, archivo_url: fileUrl })
});

// Estados de Pago
export const getEstadosPago = (companyId, workerId = null) => fetchAPI(`/workers.php?action=estados_pago&empresa_id=${companyId}${workerId ? `&trabajador_id=${workerId}` : ''}`);
export const createEstadoPago = (companyId, data) => fetchAPI(`/workers.php?action=estados_pago&empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });
export const updateEstadoPago = (companyId, data) => fetchAPI(`/workers.php?action=estados_pago&empresa_id=${companyId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEstadoPago = (companyId, id) => fetchAPI(`/workers.php?action=estados_pago&empresa_id=${companyId}&id=${id}`, { method: 'DELETE' });

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('documento', file);
  const response = await fetch(`${API_BASE}/upload_document.php`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) throw new Error('Error uploading document');
  return response.json();
};

export const getConsumos = (companyId, workerId) => fetchAPI(`/consumo.php?empresa_id=${companyId}&trabajador_id=${workerId}`);
export const registerConsumo = (companyId, data) => fetchAPI(`/consumo.php?empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });
export const markConsumosPaid = (companyId, workerId) => fetchAPI(`/consumo.php?empresa_id=${companyId}`, { method: 'PUT', body: JSON.stringify({ trabajador_id: workerId }) });

// Ventas / Punto de Venta
export const getSales = (companyId) => fetchAPI(`/sales.php?empresa_id=${companyId}`);
export const createSale = (companyId, data) => fetchAPI(`/sales.php?empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });

// Finanzas y Egresos (Cuentas e Ingresos Generales)
export const getFinances = (companyId) => fetchAPI(`/finances.php?empresa_id=${companyId}`);
export const createFinanceTx = (companyId, data) => fetchAPI(`/finances.php?empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });
export const updateFinanceTx = (companyId, data) => fetchAPI(`/finances.php?empresa_id=${companyId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteFinanceTx = (companyId, id) => fetchAPI(`/finances.php?empresa_id=${companyId}&id=${id}`, { method: 'DELETE' });
export const saveInvoiceEntry = (companyId, data) => fetchAPI(`/finances.php?action=invoice_entry&empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });

// Cuentas por Cobrar/Pagar
export const getAccounts = (companyId) => fetchAPI(`/accounts.php?empresa_id=${companyId}`);
export const createAccount = (companyId, data) => fetchAPI(`/accounts.php?empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });
export const updateAccount = (companyId, data) => fetchAPI(`/accounts.php?empresa_id=${companyId}`, { method: 'PUT', body: JSON.stringify(data) });
export const addPayment = (companyId, data) => fetchAPI(`/accounts.php?action=pay&empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });

// Cierres de Caja
export const getCashClosures = (companyId) => fetchAPI(`/finances.php?action=closures&empresa_id=${companyId}`);
export const saveCashClosure = (companyId, data) => fetchAPI(`/finances.php?action=closures&empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });

// Órdenes de Trabajo
export const getWorkOrders = (companyId) => fetchAPI(`/workorders.php?empresa_id=${companyId}`);
export const createWorkOrder = (companyId, data) => fetchAPI(`/workorders.php?empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });
export const updateWorkOrder = (companyId, data) => fetchAPI(`/workorders.php?empresa_id=${companyId}`, { method: 'PUT', body: JSON.stringify(data) });

// Agendas / Calendario
export const getAgendas = (companyId) => fetchAPI(`/agendas.php?empresa_id=${companyId}`);
export const createAgenda = (companyId, data) => fetchAPI(`/agendas.php?empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });
export const updateAgenda = (companyId, data) => fetchAPI(`/agendas.php?empresa_id=${companyId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAgenda = (companyId, id) => fetchAPI(`/agendas.php?empresa_id=${companyId}&id=${id}`, { method: 'DELETE' });

// Cotizaciones
export const getQuotes = (companyId) => fetchAPI(`/quotes.php?empresa_id=${companyId}`);
export const createQuote = (companyId, data) => fetchAPI(`/quotes.php?empresa_id=${companyId}`, { method: 'POST', body: JSON.stringify(data) });
export const updateQuote = (companyId, data) => fetchAPI(`/quotes.php?empresa_id=${companyId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteQuote = (companyId, id) => fetchAPI(`/quotes.php?empresa_id=${companyId}&id=${id}`, { method: 'DELETE' });
