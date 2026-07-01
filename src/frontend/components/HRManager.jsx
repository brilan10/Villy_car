import React, { useState, useEffect } from 'react';
import { User, FileText, Calendar, Plus, Printer, X, ShieldAlert, Award, DollarSign, Upload, Search, Coffee } from 'lucide-react';
import { getWorkers, createWorker, updateWorker, deleteWorker, savePayroll, createFinanceTx, getAccounts, addPayment, getConsumos, registerConsumo, markConsumosPaid, getPayrolls, uploadDocument, updatePayrollPdf, getEstadosPago, createEstadoPago, updateEstadoPago, deleteEstadoPago, getAnexos, createAnexo, updateAnexoPdf } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const getCompanyNames = (id) => {
  const names = { 
    '1': 'J2 Publicidad', 
    '2': 'Dwork', 
    '3': 'Villy Car Tuning', 
    '4': 'Transportes J2' 
  };
  return names[id] || 'Empresa';
};

const HRManager = ({ companyId, addToast }) => {
  const [activeTab, setActiveTab] = useState('expedientes');
  const [workers, setWorkers] = useState([]);
  const [showAddWorkerForm, setShowAddWorkerForm] = useState(false);
  const [showDocModal, setShowDocModal] = useState(null); // { type: 'contrato' | 'anexo' | 'finiquito', worker }
  const [showSlipModal, setShowSlipModal] = useState(null); // Liquidación calculada
  const [loading, setLoading] = useState(true);
  
  // Salary inputs
  const [calcWorkerRut, setCalcWorkerRut] = useState('');
  const [workerDebt, setWorkerDebt] = useState(0);
  const [payrollInputs, setPayrollInputs] = useState({
    dias_trabajados: '30',
    sueldo_base: '',
    gratificacion: '0',
    otros_imponibles: '0',
    movilizacion: '0',
    alimentacion: '0',
    transporte: '0',
    otros_no_imponibles: '0',
    afp_porcentaje: '11.44',
    salud_porcentaje: '7',
    seguro_cesantia: '0',
    impuesto_unico: '0',
    cotizacion_voluntaria: '0',
    otros_descuentos: '0'
  });

  // Consumo Bebidas
  const [consumoWorkerId, setConsumoWorkerId] = useState('');
  const [consumoMonto, setConsumoMonto] = useState('');
  const [consumosList, setConsumosList] = useState([]);
  
  // Historial
  const [historialWorkerId, setHistorialWorkerId] = useState('');
  const [historialList, setHistorialList] = useState([]);
  const [uploadingId, setUploadingId] = useState(null);

  const [newWorker, setNewWorker] = useState({ nombre: '', rut: '', email: '', cargo: '', sueldo_base: '' });

  const [allPayrolls, setAllPayrolls] = useState([]);
  
  // Anexos
  const [anexos, setAnexos] = useState([]);
  const [anexoDraft, setAnexoDraft] = useState({ fecha: '', sueldo_base_nuevo: '', detalle: '' });
  const [uploadingAnexoId, setUploadingAnexoId] = useState(null);
  
  // Estados de Pago
  const [estadosPago, setEstadosPago] = useState([]);
  const [loadingEstadosPago, setLoadingEstadosPago] = useState(false);
  const initialEstadoPago = { trabajador_id: '', fecha: '', monto_total: '', descripcion_servicios: '' };
  const [estadoPagoData, setEstadoPagoData] = useState(initialEstadoPago);
  const [showEstadoPagoForm, setShowEstadoPagoForm] = useState(false);

  const loadAllPayrolls = async () => {
    try {
      const data = await getPayrolls(companyId);
      setAllPayrolls(data || []);
    } catch (e) {
      console.error('Error loading all payrolls', e);
    }
  };

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const data = await getWorkers(companyId);
      setWorkers(data);
      if (data.length > 0) {
        setCalcWorkerRut(data[0].rut);
      }
    } catch (error) {
      addToast('Error al cargar trabajadores: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorker = async (workerId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este trabajador? Esta acción no se puede deshacer.')) {
      try {
        await deleteWorker(companyId, workerId);
        addToast('Trabajador eliminado exitosamente.', 'success');
        loadWorkers();
      } catch (error) {
        addToast('Error al eliminar trabajador: ' + error.message, 'danger');
      }
    }
  };

  useEffect(() => {
    loadWorkers();
    loadEstadosPago();
    loadAllPayrolls();
    loadAnexos();
  }, [companyId]);

  const loadAnexos = async () => {
    try {
      const data = await getAnexos(companyId);
      setAnexos(data || []);
    } catch (e) {
      console.error('Error loading anexos', e);
    }
  };

  const loadEstadosPago = async () => {
    setLoadingEstadosPago(true);
    try {
      const data = await getEstadosPago(companyId);
      setEstadosPago(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingEstadosPago(false);
    }
  };

  const handleSaveEstadoPago = async (e) => {
    e.preventDefault();
    try {
      if (estadoPagoData.id) {
        await updateEstadoPago(companyId, estadoPagoData);
        addToast('Estado de pago actualizado', 'success');
      } else {
        await createEstadoPago(companyId, estadoPagoData);
        addToast('Estado de pago creado', 'success');
      }
      setShowEstadoPagoForm(false);
      setEstadoPagoData(initialEstadoPago);
      loadEstadosPago();
    } catch (error) {
      addToast('Error al guardar: ' + error.message, 'danger');
    }
  };

  const handleDeleteEstadoPago = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este estado de pago?')) return;
    try {
      await deleteEstadoPago(companyId, id);
      addToast('Estado de pago eliminado', 'success');
      loadEstadosPago();
    } catch (error) {
      addToast('Error al eliminar: ' + error.message, 'danger');
    }
  };

  const handleUploadPdfEstadoPago = async (id, file) => {
    try {
      const uploadRes = await uploadDocument(file);
      await updateEstadoPago(companyId, { id, archivo_url: uploadRes.url });
      addToast('Documento subido correctamente', 'success');
      loadEstadosPago();
    } catch (error) {
      addToast('Error al subir: ' + error.message, 'danger');
    }
  };

  const generateEstadoPagoPdf = (estadoPago) => {
    const doc = new jsPDF();
    const companyName = getCompanyNames(companyId);
    
    doc.setFontSize(22);
    doc.text(`ESTADO DE PAGO - ${companyName}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date(estadoPago.fecha).toLocaleDateString()}`, 14, 30);
    doc.text(`Trabajador: ${estadoPago.workerName || 'N/A'}`, 14, 38);
    
    doc.autoTable({
      startY: 45,
      head: [['Descripción de los Servicios', 'Monto a Pagar']],
      body: [
        [estadoPago.descripcion_servicios || 'Servicios Prestados', `$${parseFloat(estadoPago.monto_total).toLocaleString('es-CL')}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    const finalY = doc.lastAutoTable.finalY + 30;
    doc.line(14, finalY, 80, finalY);
    doc.text('Firma Trabajador / Contratista', 14, finalY + 5);

    doc.save(`Estado_Pago_${estadoPago.workerName || 'Trabajador'}_${estadoPago.fecha}.pdf`);
  };

  const handleSaveNewWorker = async (e) => {
    e.preventDefault();
    if (!newWorker.nombre || !newWorker.rut || !newWorker.cargo || !newWorker.sueldo_base) {
      addToast('Por favor, complete todos los campos obligatorios del trabajador.', 'warning');
      return;
    }
    
    try {
      await createWorker(companyId, {
        nombre: newWorker.nombre,
        rut: newWorker.rut,
        cargo: newWorker.cargo,
        sueldo_base: parseInt(newWorker.sueldo_base),
        tipo_contrato: 'indefinido'
      });
      addToast('Trabajador añadido exitosamente.', 'success');
      setShowAddWorkerForm(false);
      setNewWorker({ nombre: '', rut: '', email: '', cargo: '', sueldo_base: '' });
      loadWorkers();
    } catch (error) {
      addToast('Error al guardar trabajador: ' + error.message, 'danger');
    }
  };

  // Load employee debts/vales from Accounts API and Consumos
  useEffect(() => {
    if (!calcWorkerRut) return;
    const fetchDebt = async () => {
      try {
        const worker = workers.find(w => w.rut === calcWorkerRut);
        let consumosDeuda = 0;
        if (worker) {
          try {
            const consumosData = await getConsumos(companyId, worker.id);
            consumosDeuda = parseFloat(consumosData.total_deuda || 0);
          } catch (e) {
            console.error('No consumos data found or module error');
          }
        }

        const accounts = await getAccounts(companyId);
        const employeeDeuda = accounts
          .filter(a => a.tipo_entidad === 'trabajador' && a.rut === calcWorkerRut && a.estado === 'debe')
          .reduce((sum, a) => sum + (parseFloat(a.monto_total) - parseFloat(a.monto_pagado || 0)), 0);
          
        setWorkerDebt(employeeDeuda);
      } catch (error) {
        console.error('Error fetching accounts debt:', error);
      }
    };
    fetchDebt();
  }, [calcWorkerRut, companyId, workers]);

  // Load Consumos
  useEffect(() => {
    if (!consumoWorkerId) return;
    const load = async () => {
      try {
        const data = await getConsumos(companyId, consumoWorkerId);
        setConsumosList(data.detalles || []);
      } catch (error) { console.error(error); }
    };
    load();
  }, [consumoWorkerId, companyId]);

  // Load Historial
  useEffect(() => {
    if (!historialWorkerId) return;
    const load = async () => {
      try {
        const data = await getPayrolls(companyId, historialWorkerId);
        setHistorialList(data || []);
      } catch (error) { console.error(error); }
    };
    load();
  }, [historialWorkerId, companyId]);

  const handleSaveConsumo = async (e) => {
    e.preventDefault();
    if (!consumoWorkerId || !consumoMonto) return;
    try {
      await registerConsumo(companyId, {
        trabajador_id: consumoWorkerId,
        monto: consumoMonto,
        descripcion: 'Bebida consumida'
      });
      addToast('Consumo registrado exitosamente.', 'success');
      setConsumoMonto('');
      // Reload consumos
      const data = await getConsumos(companyId, consumoWorkerId);
      setConsumosList(data.detalles || []);
    } catch (error) {
      addToast('Error al registrar consumo.', 'danger');
    }
  };

  const handleLoadConsumoMensual = async () => {
    const worker = workers.find(w => w.rut === calcWorkerRut);
    if (!worker) return;
    try {
      const consumosData = await getConsumos(companyId, worker.id);
      const bebidas = parseFloat(consumosData.total_deuda || 0);
      
      const accounts = await getAccounts(companyId);
      const prestamosDeuda = accounts
        .filter(a => a.tipo_entidad === 'trabajador' && a.rut === calcWorkerRut && a.estado === 'debe')
        .reduce((sum, a) => sum + (parseFloat(a.monto_total) - parseFloat(a.monto_pagado || 0)), 0);

      setWorkerDebt(prestamosDeuda);
      addToast(`Deudas calculadas: $${prestamosDeuda} (Bebidas registradas en POS: $${bebidas}). Nota: Para evitar duplicados, solo se suma el tablero de Cuentas.`, 'info');
    } catch (error) {
      addToast('Error al cargar deudas.', 'danger');
    }
  };

  const handleUploadPdf = async (e, payrollId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingId(payrollId);
    try {
      const result = await uploadDocument(file);
      await updatePayrollPdf(companyId, payrollId, result.archivo_url);
      addToast('Documento subido y guardado exitosamente.', 'success');
      // Reload historial
      const data = await getPayrolls(companyId, historialWorkerId);
      setHistorialList(data || []);
      loadAllPayrolls();
    } catch (error) {
      addToast('Error al subir el documento.', 'danger');
    } finally {
      setUploadingId(null);
    }
  };

  const handleUploadPdfGlobal = async (e, payrollId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingId(payrollId);
    try {
      const result = await uploadDocument(file);
      await updatePayrollPdf(companyId, payrollId, result.archivo_url);
      addToast('Documento subido y guardado exitosamente.', 'success');
      loadAllPayrolls();
      if (historialWorkerId) {
        const data = await getPayrolls(companyId, historialWorkerId);
        setHistorialList(data || []);
      }
    } catch (error) {
      addToast('Error al subir el documento.', 'danger');
    } finally {
      setUploadingId(null);
    }
  };

  const handleUploadAnexoPdf = async (e, anexoId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAnexoId(anexoId);
    try {
      const result = await uploadDocument(file);
      await updateAnexoPdf(anexoId, result.archivo_url, companyId);
      addToast('Anexo firmado subido exitosamente.', 'success');
      loadAnexos();
    } catch (error) {
      addToast('Error al subir el anexo.', 'danger');
    } finally {
      setUploadingAnexoId(null);
    }
  };

  const getEffectiveBaseSalary = (worker) => {
    if (!worker) return 0;
    let effectiveSalary = worker.sueldo_base;
    const workerAnexos = anexos.filter(a => a.trabajador_id === worker.id);
    if (workerAnexos.length > 0) {
      // Ordenar por fecha descendente
      workerAnexos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      if (workerAnexos[0].sueldo_base_nuevo) {
        effectiveSalary = workerAnexos[0].sueldo_base_nuevo;
      }
    }
    return effectiveSalary;
  };

  const handleCalculateSalary = (e) => {
    e.preventDefault();
    const worker = workers.find(w => w.rut === calcWorkerRut);
    if (!worker) return;

    const effectiveBase = getEffectiveBaseSalary(worker);
    const baseStr = String(payrollInputs.sueldo_base || effectiveBase).replace(',', '.');
    const base = parseFloat(baseStr) || 0;
    const dias = parseInt(payrollInputs.dias_trabajados) || 30;
    const baseProporcional = Math.round((base / 30) * dias);
    
    const gratificacion = parseFloat(String(payrollInputs.gratificacion || '0').replace(',', '.')) || 0;
    const otrosImponibles = parseFloat(String(payrollInputs.otros_imponibles || '0').replace(',', '.')) || 0;
    const totalImponible = baseProporcional + gratificacion + otrosImponibles;
    
    const movilizacion = parseFloat(String(payrollInputs.movilizacion || '0').replace(',', '.')) || 0;
    const alimentacion = parseFloat(String(payrollInputs.alimentacion || '0').replace(',', '.')) || 0;
    const transporte = parseFloat(String(payrollInputs.transporte || '0').replace(',', '.')) || 0;
    const otrosNoImponibles = parseFloat(String(payrollInputs.otros_no_imponibles || '0').replace(',', '.')) || 0;
    const totalNoImponible = movilizacion + alimentacion + transporte + otrosNoImponibles;
    
    const afpStr = String(payrollInputs.afp_porcentaje || '0').replace(',', '.');
    const saludStr = String(payrollInputs.salud_porcentaje || '0').replace(',', '.');
    const afp = Math.round(totalImponible * (parseFloat(afpStr) / 100));
    const salud = Math.round(totalImponible * (parseFloat(saludStr) / 100));
    const cesantia = parseFloat(String(payrollInputs.seguro_cesantia || '0').replace(',', '.')) || 0;
    const impuesto = parseFloat(String(payrollInputs.impuesto_unico || '0').replace(',', '.')) || 0;
    const voluntaria = parseFloat(String(payrollInputs.cotizacion_voluntaria || '0').replace(',', '.')) || 0;
    const otrosDesc = parseFloat(String(payrollInputs.otros_descuentos || '0').replace(',', '.')) || 0;
    
    const maxDeduct = Math.round(totalImponible * 0.3);
    const valeDeduction = Math.min(workerDebt, maxDeduct);
    const anticipos = valeDeduction;
    
    const totalDescuentos = afp + salud + cesantia + impuesto + voluntaria + otrosDesc + anticipos;
    const net = (totalImponible + totalNoImponible) - totalDescuentos;

    setShowSlipModal({
      worker, base, baseProporcional, dias, gratificacion, otrosImponibles, totalImponible,
      movilizacion, alimentacion, transporte, otrosNoImponibles, totalNoImponible,
      afp, salud, cesantia, impuesto, voluntaria, otrosDesc, anticipos, totalDescuentos,
      valeDeduction, net,
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleDownloadOldSlip = (h) => {
    const worker = workers.find(w => w.id === parseInt(h.trabajador_id));
    if (!worker) return;

    setShowSlipModal({
      worker, 
      baseProporcional: parseFloat(h.sueldo_base || 0), 
      dias: h.dias_trabajados || 30, 
      gratificacion: parseFloat(h.gratificacion || 0), 
      otrosImponibles: parseFloat(h.otros_imponibles || 0), 
      totalImponible: parseFloat(h.total_imponible || 0),
      movilizacion: parseFloat(h.movilizacion || 0), 
      alimentacion: parseFloat(h.alimentacion || 0), 
      transporte: parseFloat(h.transporte || 0), 
      otrosNoImponibles: parseFloat(h.otros_no_imponibles || 0), 
      totalNoImponible: parseFloat(h.total_no_imponible || 0),
      afp: parseFloat(h.afp_monto || 0), 
      salud: parseFloat(h.salud_monto || 0), 
      cesantia: parseFloat(h.seguro_cesantia || 0), 
      impuesto: parseFloat(h.impuesto_unico || 0), 
      voluntaria: parseFloat(h.cotizacion_voluntaria || 0), 
      otrosDesc: parseFloat(h.otros_descuentos || 0), 
      anticipos: parseFloat(h.anticipos || 0), 
      totalDescuentos: parseFloat(h.total_descuentos || 0),
      valeDeduction: parseFloat(h.anticipos || 0), 
      net: parseFloat(h.sueldo_liquido || 0),
      date: h.mes_periodo + '-01',
      isReprint: true
    });
  };

  const handlePrintSlip = async () => {
    if (showSlipModal.isReprint) {
      setTimeout(() => {
        window.print();
        setShowSlipModal(null);
      }, 500);
      return;
    }

    try {
      // 1. Guardar Liquidacion en BD
      await savePayroll(companyId, {
        trabajador_id: showSlipModal.worker.id,
        mes_periodo: new Date().toISOString().slice(0, 7), // YYYY-MM
        dias_trabajados: showSlipModal.dias,
        sueldo_base: showSlipModal.baseProporcional,
        gratificacion: showSlipModal.gratificacion,
        otros_imponibles: showSlipModal.otrosImponibles,
        total_imponible: showSlipModal.totalImponible,
        movilizacion: showSlipModal.movilizacion,
        alimentacion: showSlipModal.alimentacion,
        transporte: showSlipModal.transporte,
        otros_no_imponibles: showSlipModal.otrosNoImponibles,
        total_no_imponible: showSlipModal.totalNoImponible,
        afp_monto: showSlipModal.afp,
        salud_monto: showSlipModal.salud,
        seguro_cesantia: showSlipModal.cesantia,
        impuesto_unico: showSlipModal.impuesto,
        cotizacion_voluntaria: showSlipModal.voluntaria,
        anticipos: showSlipModal.anticipos,
        otros_descuentos: showSlipModal.otrosDesc,
        total_descuentos: showSlipModal.totalDescuentos,
        sueldo_liquido: showSlipModal.net
      });

      // 2. Descontar vales (si hay modulo de cuentas)
      if (showSlipModal.valeDeduction > 0) {
        let remainingDeduction = showSlipModal.valeDeduction;
        
        // Obtenemos consumos y cuentas para abonar
        try {
           const consumosData = await getConsumos(companyId, showSlipModal.worker.id);
           if (consumosData && parseFloat(consumosData.total_deuda) > 0) {
               const deudaConsumos = parseFloat(consumosData.total_deuda);
               if (remainingDeduction >= deudaConsumos) {
                   await markConsumosPaid(companyId, showSlipModal.worker.id);
                   remainingDeduction -= deudaConsumos;
               } else {
                   // No alcanza para pagar todas las bebidas, pero el modulo no soporta pagos parciales,
                   // en un sistema real se registraría el abono.
                   await markConsumosPaid(companyId, showSlipModal.worker.id);
                   remainingDeduction -= deudaConsumos;
               }
           }
        } catch (e) {}

        if (remainingDeduction > 0) {
          const accounts = await getAccounts(companyId);
          const myDeudas = accounts.filter(a => a.tipo_entidad === 'trabajador' && a.rut === showSlipModal.worker.rut && a.estado === 'debe');
          for (let acc of myDeudas) {
            if (remainingDeduction <= 0) break;
            const unpaid = parseFloat(acc.monto_total) - parseFloat(acc.monto_pagado || 0);
            const toPay = Math.min(remainingDeduction, unpaid);
            await addPayment(companyId, {
              cuenta_id: acc.id,
              monto: toPay,
              metodo_pago: 'descuento_planilla'
            });
            remainingDeduction -= toPay;
          }
        }
      }

      // 3. Registrar egreso en Finanzas Generales
      await createFinanceTx(companyId, {
        date: new Date().toISOString().split('T')[0],
        type: 'egreso',
        category: 'Sueldos',
        description: `Pago Sueldo - Liquidación ${showSlipModal.worker.nombre}`,
        amount: showSlipModal.net,
        paymentMethod: 'Transferencia'
      });

      addToast('Liquidación procesada con éxito y registrada en BD.', 'success');
      
      // Reset calc form
      setWorkerDebt(0);
      
      // Trigger print window
      setTimeout(() => {
        window.print();
        setShowSlipModal(null);
        loadAllPayrolls();
        setActiveTab('expedientes');
      }, 500);
      
    } catch (error) {
      addToast('Error al procesar liquidación: ' + error.message, 'danger');
    }
  };

  const calculateLiveNeto = () => {
    const worker = workers.find(w => w.rut === calcWorkerRut);
    if (!worker) return 0;
    
    const effectiveBase = getEffectiveBaseSalary(worker);
    const baseStr = String(payrollInputs.sueldo_base || effectiveBase).replace(',', '.');
    const base = parseFloat(baseStr) || 0;
    const dias = parseInt(payrollInputs.dias_trabajados) || 30;
    const baseProporcional = Math.round((base / 30) * dias);
    
    const gratificacion = parseFloat(String(payrollInputs.gratificacion || '0').replace(',', '.')) || 0;
    const otrosImponibles = parseFloat(String(payrollInputs.otros_imponibles || '0').replace(',', '.')) || 0;
    const totalImponible = baseProporcional + gratificacion + otrosImponibles;

    const movilizacion = parseFloat(String(payrollInputs.movilizacion || '0').replace(',', '.')) || 0;
    const alimentacion = parseFloat(String(payrollInputs.alimentacion || '0').replace(',', '.')) || 0;
    const transporte = parseFloat(String(payrollInputs.transporte || '0').replace(',', '.')) || 0;
    const otrosNoImponibles = parseFloat(String(payrollInputs.otros_no_imponibles || '0').replace(',', '.')) || 0;
    const totalNoImponible = movilizacion + alimentacion + transporte + otrosNoImponibles;

    const afpStr = String(payrollInputs.afp_porcentaje || '0').replace(',', '.');
    const saludStr = String(payrollInputs.salud_porcentaje || '0').replace(',', '.');
    const afp = Math.round(totalImponible * (parseFloat(afpStr) / 100));
    const salud = Math.round(totalImponible * (parseFloat(saludStr) / 100));
    const cesantia = parseFloat(String(payrollInputs.seguro_cesantia || '0').replace(',', '.')) || 0;
    const impuesto = parseFloat(String(payrollInputs.impuesto_unico || '0').replace(',', '.')) || 0;
    const voluntaria = parseFloat(String(payrollInputs.cotizacion_voluntaria || '0').replace(',', '.')) || 0;
    const otrosDesc = parseFloat(String(payrollInputs.otros_descuentos || '0').replace(',', '.')) || 0;

    const maxDeduct = Math.round(totalImponible * 0.3);
    const valeDeduction = Math.min(workerDebt, maxDeduct);
    const anticipos = valeDeduction;

    const totalDescuentos = afp + salud + cesantia + impuesto + voluntaria + otrosDesc + anticipos;
    return (totalImponible + totalNoImponible) - totalDescuentos;
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="title-lg" style={{ marginBottom: 0 }}>Recursos Humanos & Sueldos</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de contratos y cálculo automático de liquidaciones de sueldo.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', border: '1px solid var(--border)', padding: '4px', borderRadius: '8px', backgroundColor: 'var(--bg-card)' }}>
          <button 
            onClick={() => setActiveTab('expedientes')} 
            style={{ padding: '6px 16px', fontSize: '0.875rem', borderRadius: '6px', fontWeight: 600, border: 'none', backgroundColor: activeTab === 'expedientes' ? 'var(--accent)' : 'transparent', color: activeTab === 'expedientes' ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}
          >
            Expedientes
          </button>
          <button 
            onClick={() => setActiveTab('consumo')} 
            style={{ padding: '6px 16px', fontSize: '0.875rem', borderRadius: '6px', fontWeight: 600, border: 'none', backgroundColor: activeTab === 'consumo' ? 'var(--accent)' : 'transparent', color: activeTab === 'consumo' ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}
          >
            Consumo Bebidas
          </button>
          <button 
            onClick={() => setActiveTab('sueldos')} 
            style={{ padding: '6px 16px', fontSize: '0.875rem', borderRadius: '6px', fontWeight: 600, border: 'none', backgroundColor: activeTab === 'sueldos' ? 'var(--accent)' : 'transparent', color: activeTab === 'sueldos' ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}
          >
            Nómina / Sueldos
          </button>
          <button 
            onClick={() => setActiveTab('estados_pago')} 
            style={{ padding: '6px 16px', fontSize: '0.875rem', borderRadius: '6px', fontWeight: 600, border: 'none', backgroundColor: activeTab === 'estados_pago' ? 'var(--accent)' : 'transparent', color: activeTab === 'estados_pago' ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}
          >
            Estados de Pago
          </button>
          <button 
            onClick={() => setActiveTab('historial')} 
            style={{ padding: '6px 16px', fontSize: '0.875rem', borderRadius: '6px', fontWeight: 600, border: 'none', backgroundColor: activeTab === 'historial' ? 'var(--accent)' : 'transparent', color: activeTab === 'historial' ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}
          >
            Historial de Pagos
          </button>
        </div>
      </div>

      {activeTab === 'expedientes' ? (
        /* Expedientes de Trabajadores */
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="title-md" style={{ marginBottom: 0 }}>Personal de la Empresa</h2>
            <button className="btn-primary" onClick={() => setShowAddWorkerForm(!showAddWorkerForm)}>
              <Plus size={20} /> Nuevo Trabajador
            </button>
          </div>

          {showAddWorkerForm && (
            <div className="card animate-fade-in" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent)' , margin: 'auto' }}>
              <h3 className="title-md">Registrar Nuevo Trabajador</h3>
              <form onSubmit={handleSaveNewWorker} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nombre Completo</label>
                  <input type="text" placeholder="Ej: Pedro Gómez" value={newWorker.nombre} onChange={e => setNewWorker({...newWorker, nombre: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>RUT</label>
                  <input type="text" placeholder="Ej: 15.654.321-9" value={newWorker.rut} onChange={e => setNewWorker({...newWorker, rut: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cargo / Función</label>
                  <input type="text" placeholder="Ej: Ayudante Mecánico" value={newWorker.cargo} onChange={e => setNewWorker({...newWorker, cargo: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sueldo Base ($)</label>
                  <input type="number" placeholder="Ej: 500000" value={newWorker.sueldo_base} onChange={e => setNewWorker({...newWorker, sueldo_base: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" style={{ padding: '10px 20px', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setShowAddWorkerForm(false)}>Cancelar</button>
                  <button type="submit" className="btn-success">Guardar Trabajador</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando datos BD...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <th style={{ padding: '16px' }}>Nombre</th>
                    <th style={{ padding: '16px' }}>RUT</th>
                    <th style={{ padding: '16px' }}>Cargo / Función</th>
                    <th style={{ padding: '16px' }}>Sueldo Base</th>
                    <th style={{ padding: '16px', textAlign: 'right' }}>Documentos Contractuales</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay trabajadores registrados.</td>
                    </tr>
                  ) : workers.map(w => {
                    const currentMonth = new Date().toISOString().slice(0, 7);
                    const currentPayment = allPayrolls.find(p => p.trabajador_id === w.id && p.mes_periodo === currentMonth);
                    return (
                      <tr key={w.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '16px', fontWeight: 600, color: 'white' }}>{w.nombre}</td>
                        <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{w.rut}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ backgroundColor: 'var(--bg-main)', padding: '4px 12px', borderRadius: '100px', fontSize: '0.8rem' }}>{w.cargo}</span>
                        </td>
                        <td style={{ padding: '16px', fontWeight: 500 }}>${parseFloat(w.sueldo_base).toLocaleString('es-CL')}</td>
                        <td style={{ padding: '16px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                          <button className="btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', gap: '4px', backgroundColor: '#64748b' }} onClick={() => { setHistorialWorkerId(w.id); setActiveTab('historial'); }}>
                            <FileText size={12} /> Historial
                          </button>
                          
                          <button className="btn-success" style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', gap: '4px', backgroundColor: '#10b981' }} onClick={() => { setCalcWorkerRut(w.rut); setActiveTab('sueldos'); }}>
                            <DollarSign size={12} /> Pagar Sueldo
                          </button>
                          
                          <button className="btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', gap: '4px', backgroundColor: 'var(--danger)' }} onClick={() => handleDeleteWorker(w.id)}>
                            <X size={12} /> Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : activeTab === 'consumo' ? (
        <div className="card" style={{ padding: '24px' , margin: 'auto' }}>
          <h2 className="title-md" style={{ marginBottom: '20px' }}><Coffee size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/> Registro de Consumo (Bebidas / Bodega)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <form onSubmit={handleSaveConsumo} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Seleccione Trabajador</label>
                <select 
                  value={consumoWorkerId} 
                  onChange={e => setConsumoWorkerId(e.target.value)} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }}
                >
                  <option value="">Seleccione...</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.nombre} ({w.cargo})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Monto de Bebida ($)</label>
                <input type="number" min="1" value={consumoMonto} onChange={e => setConsumoMonto(e.target.value)} style={{ width: '100%' }} placeholder="Ej: 1500" />
              </div>
              <button type="submit" className="btn-success" disabled={!consumoWorkerId || !consumoMonto}>Registrar Consumo</button>
            </form>
            <div>
              <h3 className="title-sm" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Consumos Pendientes de Cobro</h3>
              {consumosList.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '16px' }}>No hay bebidas registradas pendientes de pago para este trabajador.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '16px' }}>
                  {consumosList.map(c => (
                    <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.875rem' }}>{c.fecha} - {c.descripcion}</span>
                      <span style={{ fontWeight: 600, color: 'var(--danger)' }}>${parseFloat(c.monto).toLocaleString('es-CL')}</span>
                    </li>
                  ))}
                  <li style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderTop: '2px solid var(--border)', marginTop: '8px' }}>
                    <span style={{ fontWeight: 700 }}>Total a descontar:</span>
                    <span style={{ fontWeight: 700, color: 'var(--danger)' }}>${consumosList.reduce((acc, c) => acc + parseFloat(c.monto), 0).toLocaleString('es-CL')}</span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'sueldos' ? (
        /* Calculadora de Remuneraciones */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Form */}
          <div className="card" style={{ padding: '24px' , margin: 'auto' }}>
            <h2 className="title-md" style={{ marginBottom: '20px' }}>Calcular Liquidación de Sueldo</h2>
            <form onSubmit={handleCalculateSalary} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Seleccione Trabajador</label>
                <select 
                  value={calcWorkerRut} 
                  onChange={async e => {
                    setCalcWorkerRut(e.target.value);
                    const worker = workers.find(w => w.rut === e.target.value);
                    if (worker) {
                      setPayrollInputs(prev => ({...prev, sueldo_base: getEffectiveBaseSalary(worker)}));
                      // Update worker debt automatically when changing worker
                      try {
                        let total = 0;
                        const data = await getConsumos(companyId, worker.id);
                        if (data && data.total_deuda) total += parseFloat(data.total_deuda);
                        
                        const accounts = await getAccounts(companyId);
                        const myDeudas = accounts.filter(a => a.tipo_entidad === 'trabajador' && a.rut === worker.rut && a.estado === 'debe');
                        for (let acc of myDeudas) {
                          total += (parseFloat(acc.monto_total) - parseFloat(acc.monto_pagado || 0));
                        }
                        setWorkerDebt(total);
                      } catch (err) {
                        console.error("Error al cargar deuda del trabajador", err);
                      }
                    } else {
                      setWorkerDebt(0);
                    }
                  }} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }}
                >
                  <option value="">Seleccione un trabajador...</option>
                  {workers.map(w => (
                    <option key={w.rut} value={w.rut}>{w.nombre} ({w.cargo})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Sueldo Base (Editable por Anexos) $</label>
                  <input 
                    type="number" 
                    value={payrollInputs.sueldo_base || getEffectiveBaseSalary(workers.find(w => w.rut === calcWorkerRut))} 
                    onChange={e => setPayrollInputs(prev => ({...prev, sueldo_base: e.target.value}))}
                    style={{ width: '100%' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Días Trabajados</label>
                  <input type="number" min="0" max="31" value={payrollInputs.dias_trabajados} onChange={e => setPayrollInputs({...payrollInputs, dias_trabajados: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Gratificación Legal ($)</label>
                  <input type="number" min="0" value={payrollInputs.gratificacion} onChange={e => setPayrollInputs({...payrollInputs, gratificacion: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Otros Imponibles ($)</label>
                  <input type="number" min="0" value={payrollInputs.otros_imponibles} onChange={e => setPayrollInputs({...payrollInputs, otros_imponibles: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Movilización ($)</label>
                  <input type="number" min="0" value={payrollInputs.movilizacion} onChange={e => setPayrollInputs({...payrollInputs, movilizacion: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Colación / Alimentación ($)</label>
                  <input type="number" min="0" value={payrollInputs.alimentacion} onChange={e => setPayrollInputs({...payrollInputs, alimentacion: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Otros No Imponibles ($)</label>
                  <input type="number" min="0" value={payrollInputs.otros_no_imponibles} onChange={e => setPayrollInputs({...payrollInputs, otros_no_imponibles: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Tasa AFP (%)</label>
                  <input type="text" value={payrollInputs.afp_porcentaje} onChange={e => setPayrollInputs({...payrollInputs, afp_porcentaje: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Tasa Salud (%)</label>
                  <input type="text" value={payrollInputs.salud_porcentaje} onChange={e => setPayrollInputs({...payrollInputs, salud_porcentaje: e.target.value})} style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>Descuento por Vales (Cuentas y Bebidas):</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monto total acumulado (calculado automáticamente).</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>
                    ${workerDebt.toLocaleString('es-CL')}
                  </div>
                  <button type="button" className="btn-primary" onClick={handleLoadConsumoMensual} style={{ padding: '8px 12px', fontSize: '0.875rem' }}>
                    <Search size={16} /> Recargar Deudas
                  </button>
                </div>
              </div>

              {calcWorkerRut && (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid var(--success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--success)' }}>Total Neto Estimado:</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Proyección del alcance líquido.</div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                    ${calculateLiveNeto().toLocaleString('es-CL')}
                  </div>
                </div>
              )}

              <button type="submit" className="btn-success" style={{ padding: '12px', justifyContent: 'center', fontWeight: 600, marginTop: '12px' }}>
                Calcular y Previsualizar
              </button>
            </form>
          </div>

          {/* Right Panel info */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', border: '2px dashed var(--border)' , margin: 'auto' }}>
            <Award size={48} color="var(--accent)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px', color: 'white' }}>Generador de Nóminas Automatizado</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '300px', lineHeight: '1.5' }}>
              Los cálculos de haberes y descuentos se basan en el modelo estándar contable de liquidaciones. Ingresa los montos y previsualiza la boleta de pago.
            </p>
          </div>
        </div>
      ) : activeTab === 'estados_pago' ? (
        <div className="animate-fade-in" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className="title-md" style={{ marginBottom: 0 }}>Gestión de Estados de Pago</h2>
            <button className="btn-primary" onClick={() => { setEstadoPagoData(initialEstadoPago); setShowEstadoPagoForm(!showEstadoPagoForm); }}>
              <Plus size={20} />
              Nuevo Estado de Pago
            </button>
          </div>

          {showEstadoPagoForm && (
            <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent)' , margin: 'auto' }}>
              <h3 className="title-md">{estadoPagoData.id ? 'Editar Estado de Pago' : 'Crear Estado de Pago'}</h3>
              <form onSubmit={handleSaveEstadoPago} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Trabajador / Contratista</label>
                  <select style={{ width: '100%' }} value={estadoPagoData.trabajador_id} onChange={e => setEstadoPagoData({...estadoPagoData, trabajador_id: e.target.value})} required>
                    <option value="">Seleccione trabajador</option>
                    {workers.map(w => <option key={w.id} value={w.id}>{w.nombre} ({w.rut})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Fecha</label>
                  <input type="date" style={{ width: '100%' }} value={estadoPagoData.fecha} onChange={e => setEstadoPagoData({...estadoPagoData, fecha: e.target.value})} required />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Descripción de los Servicios o Avance</label>
                  <textarea rows="3" style={{ width: '100%', resize: 'vertical' }} value={estadoPagoData.descripcion_servicios} onChange={e => setEstadoPagoData({...estadoPagoData, descripcion_servicios: e.target.value})} required placeholder="Ej: Pago por 50% avance reparación motor..."></textarea>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Monto a Pagar ($)</label>
                  <input type="number" style={{ width: '100%' }} value={estadoPagoData.monto_total} onChange={e => setEstadoPagoData({...estadoPagoData, monto_total: e.target.value})} required min="0" />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: '16px' }}>
                  <button type="button" style={{ padding: '10px 20px', color: 'var(--text-muted)' }} onClick={() => setShowEstadoPagoForm(false)}>Cancelar</button>
                  <button type="submit" className="btn-success">Guardar</button>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            {loadingEstadosPago ? (
              <p style={{ color: 'var(--text-muted)' }}>Cargando estados de pago...</p>
            ) : estadosPago.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No hay estados de pago registrados.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '16px' }}>Fecha</th>
                      <th style={{ padding: '16px' }}>Trabajador</th>
                      <th style={{ padding: '16px' }}>Monto</th>
                      <th style={{ padding: '16px' }}>Descripción</th>
                      <th style={{ padding: '16px' }}>Documento</th>
                      <th style={{ padding: '16px', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadosPago.map(ep => (
                      <tr key={ep.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '16px' }}>{new Date(ep.fecha).toLocaleDateString()}</td>
                        <td style={{ padding: '16px', fontWeight: 600 }}>{ep.workerName}</td>
                        <td style={{ padding: '16px', color: 'var(--accent)', fontWeight: 600 }}>${parseFloat(ep.monto_total).toLocaleString('es-CL')}</td>
                        <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{ep.descripcion_servicios}</td>
                        <td style={{ padding: '16px' }}>
                          {ep.archivo_url ? (
                            <a href={ep.archivo_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--success)', textDecoration: 'none', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '100px', fontSize: '0.875rem' }}>
                              <FileText size={16} /> Firmado
                            </a>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: 'var(--warning)', fontSize: '0.875rem' }}>Falta Firma</span>
                              <label style={{ cursor: 'pointer', color: 'var(--accent)', padding: '4px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '4px' }}>
                                <Upload size={16} />
                                <input type="file" style={{ display: 'none' }} accept=".pdf,image/*" onChange={(e) => {
                                  if(e.target.files[0]) handleUploadPdfEstadoPago(ep.id, e.target.files[0]);
                                }} />
                              </label>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button onClick={() => generateEstadoPagoPdf(ep)} style={{ padding: '6px', color: 'var(--text-muted)', marginRight: '8px' }} title="Generar PDF a Firmar"><Printer size={18} /></button>
                          <button onClick={() => { setEstadoPagoData(ep); setShowEstadoPagoForm(true); }} style={{ padding: '6px', color: 'var(--accent)', marginRight: '8px' }} title="Editar"><User size={18} /></button>
                          <button onClick={() => handleDeleteEstadoPago(ep.id)} style={{ padding: '6px', color: 'var(--danger)' }} title="Eliminar"><X size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'historial' ? (
        <div className="card">
          <h2 className="title-md" style={{ marginBottom: '20px' }}>Historial de Pagos y Documentos</h2>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Seleccione Trabajador</label>
            <select 
              value={historialWorkerId} 
              onChange={e => setHistorialWorkerId(e.target.value)} 
              style={{ width: '300px', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }}
            >
              <option value="">Seleccione...</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.nombre} ({w.cargo})</option>
              ))}
            </select>
          </div>

          {historialWorkerId && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <th style={{ padding: '16px' }}>Periodo</th>
                    <th style={{ padding: '16px' }}>Total Imponible</th>
                    <th style={{ padding: '16px' }}>Total Descuentos</th>
                    <th style={{ padding: '16px' }}>Sueldo Líquido</th>
                    <th style={{ padding: '16px', textAlign: 'right' }}>Documento Firmado</th>
                  </tr>
                </thead>
                <tbody>
                  {historialList.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay liquidaciones registradas.</td>
                    </tr>
                  ) : historialList.map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{h.mes_periodo}</td>
                      <td style={{ padding: '16px' }}>${parseFloat(h.total_imponible).toLocaleString('es-CL')}</td>
                      <td style={{ padding: '16px', color: 'var(--danger)' }}>${(parseFloat(h.afp_monto) + parseFloat(h.salud_monto) + parseFloat(h.anticipos)).toLocaleString('es-CL')}</td>
                      <td style={{ padding: '16px', color: 'var(--success)', fontWeight: 700 }}>${parseFloat(h.sueldo_liquido).toLocaleString('es-CL')}</td>
                      <td style={{ padding: '16px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {h.archivo_url ? (
                          <a href={h.archivo_url} target="_blank" rel="noopener noreferrer" className="btn-success" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                            <FileText size={14} /> Ver PDF Firmado
                          </a>
                        ) : (
                          <label className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', backgroundColor: '#3b82f6', margin: 0 }}>
                            {uploadingId === h.id ? 'Subiendo...' : <><Upload size={14} /> Subir PDF</>}
                            <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => handleUploadPdf(e, h.id)} disabled={uploadingId === h.id} />
                          </label>
                        )}
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#8b5cf6' }} onClick={() => handleDownloadOldSlip(h)}>
                          <Printer size={14} /> Ver / Imprimir Liquidación
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {/* Modal: Document view Contract/Annex/Severance */}
      {showDocModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <div style={{ margin: '0 auto', width: '100%', maxWidth: '600px' }}>
            <div className="card animate-fade-in" style={{ width: '100%', padding: '36px', backgroundColor: '#fff', color: '#333', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111', margin: 0, textTransform: 'uppercase' }}>
                  {showDocModal.type} DE TRABAJO
                </h2>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>Trabajador/a: {showDocModal.worker.nombre}</span>
              </div>
              <button onClick={() => setShowDocModal(null)} style={{ color: '#999', padding: '4px' }}><X size={24} /></button>
            </div>

            <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#444', textAlign: 'justify', padding: '16px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fafafa' }}>
              <div style={{ textAlign: 'center', fontWeight: 700, marginBottom: '20px' }}>
                {showDocModal.type === 'contrato' ? 'CONTRATO DE TRABAJO INDEFINIDO' : showDocModal.type === 'anexo' ? 'ANEXO DE ACTUALIZACIÓN DE SUELDO' : 'FINIQUITO DE RELACIÓN LABORAL'}
              </div>
              
              {showDocModal.type === 'contrato' && (
                <div contentEditable={true} suppressContentEditableWarning={true} style={{ outline: 'none', padding: '8px', minHeight: '100px' }}>
                  En Santiago de Chile, a {new Date().toLocaleDateString('es-CL')}, entre <strong>{getCompanyNames(companyId)}</strong>, RUT 76.220.330-k, representada por su administrador, y don/doña <strong>{showDocModal.worker.nombre}</strong>, RUT {showDocModal.worker.rut}, se acuerda desempeñar el cargo de <strong>{showDocModal.worker.cargo}</strong>, con una jornada laboral ordinaria. El empleador se compromete a remunerar con un sueldo base bruto mensual de <strong>${parseFloat(showDocModal.worker.sueldo_base).toLocaleString('es-CL')}</strong> pesos chilenos más las gratificaciones legales correspondientes.
                </div>
              )}
              {showDocModal.type === 'anexo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '4px' }}>Fecha de Anexo</label>
                      <input type="date" value={anexoDraft.fecha} onChange={e => setAnexoDraft({...anexoDraft, fecha: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={showDocModal.isReprint} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '4px' }}>Nuevo Sueldo Base</label>
                      <input type="number" value={anexoDraft.sueldo_base_nuevo} onChange={e => setAnexoDraft({...anexoDraft, sueldo_base_nuevo: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} disabled={showDocModal.isReprint} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '4px' }}>Cláusula Adicional (Opcional)</label>
                      <textarea value={anexoDraft.detalle} onChange={e => setAnexoDraft({...anexoDraft, detalle: e.target.value})} rows={2} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }} placeholder="Agrega detalles o condiciones adicionales aquí..." disabled={showDocModal.isReprint} />
                    </div>
                  </div>
                  <div className="print-area" style={{ outline: 'none', padding: '8px', minHeight: '100px', display: 'flex', flexDirection: 'column', gap: '16px', lineHeight: '1.6' }}>
                    <p style={{ margin: 0, textAlign: 'justify' }}>
                      En Santiago, con fecha <strong>{anexoDraft.fecha ? new Date(anexoDraft.fecha + 'T12:00:00').toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>, las partes comparecientes, el empleador <strong>{getCompanyNames(companyId)}</strong> y el trabajador don/doña <strong>{showDocModal.worker.nombre}</strong> (RUT {showDocModal.worker.rut}), acuerdan el presente anexo al contrato de trabajo vigente:
                    </p>
                    
                    <p style={{ margin: 0, textAlign: 'justify' }}>
                      <strong>PRIMERO:</strong> A contar de esta fecha, se acuerda modificar la remuneración del trabajador. El nuevo sueldo base mensual convenido pasa a ser la suma de <strong>${parseFloat(anexoDraft.sueldo_base_nuevo || 0).toLocaleString('es-CL')}</strong> pesos chilenos.
                    </p>

                    {anexoDraft.detalle && (
                      <p style={{ margin: 0, textAlign: 'justify' }}>
                        <strong>SEGUNDO:</strong> <span dangerouslySetInnerHTML={{ __html: anexoDraft.detalle.replace(/\n/g, '<br/>') }} />
                      </p>
                    )}

                    <p style={{ margin: 0, textAlign: 'justify' }}>
                      <strong>{anexoDraft.detalle ? 'TERCERO' : 'SEGUNDO'}:</strong> En todo lo no modificado expresamente por el presente instrumento, rigen plenamente y se mantienen vigentes las estipulaciones del contrato de trabajo original.
                    </p>
                    
                    <p style={{ margin: 0, textAlign: 'justify' }}>
                      Para constancia firman las partes en dos ejemplares del mismo tenor y fecha, quedando uno en poder del trabajador y el otro en la carpeta personal del empleador.
                    </p>
                  </div>
                </div>
              )}
              {showDocModal.type === 'finiquito' && (
                <div contentEditable={true} suppressContentEditableWarning={true} style={{ outline: 'none', padding: '8px', minHeight: '100px' }}>
                  En Santiago, a {new Date().toLocaleDateString('es-CL')}, las partes declaran poner fin a la relación laboral que los vinculaba a contar de hoy. Don/doña <strong>{showDocModal.worker.nombre}</strong> declara recibir en este acto la suma total y única de <strong>$0</strong> pesos chilenos por concepto de indemnización por años de servicio, vacaciones proporcionales y remuneraciones pendientes, no teniendo cargos ni reclamaciones posteriores que formular a <strong>{getCompanyNames(companyId)}</strong>.
                </div>
              )}

              <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: '180px', borderTop: '1px solid #333', textAlign: 'center', fontSize: '0.8rem', paddingTop: '8px' }}>Firma del Trabajador</div>
                <div style={{ width: '180px', borderTop: '1px solid #333', textAlign: 'center', fontSize: '0.8rem', paddingTop: '8px' }}>Firma Empleador</div>
              </div>
            </div>

            <div className="no-print" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowDocModal(null)} style={{ padding: '10px 24px', backgroundColor: '#eee', color: '#333', borderRadius: '8px', fontWeight: 600, border: '1px solid #ccc' }}>Cerrar Documento</button>
              
              {showDocModal.type === 'anexo' && !showDocModal.isReprint ? (
                <button onClick={async () => {
                  try {
                    await createAnexo(companyId, {
                      trabajador_id: showDocModal.worker.id,
                      fecha: anexoDraft.fecha,
                      sueldo_base_nuevo: anexoDraft.sueldo_base_nuevo,
                      detalle: anexoDraft.detalle
                    });
                    addToast('Anexo guardado y sueldo actualizado.', 'success');
                    loadAnexos();
                    loadWorkers();
                    window.print();
                    setShowDocModal(null);
                  } catch (e) {
                    addToast('Error al guardar el anexo', 'danger');
                  }
                }} style={{ padding: '10px 24px', backgroundColor: '#333', color: '#fff', borderRadius: '8px', fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Printer size={18} /> Guardar e Imprimir
                </button>
              ) : (
                <button onClick={() => window.print()} style={{ padding: '10px 24px', backgroundColor: '#333', color: '#fff', borderRadius: '8px', fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Printer size={18} /> Imprimir Documento
                </button>
              )}
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Modal: Salary Slip Previsualisation (Formato Excel Liquidaciones) */}
      {showSlipModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <div style={{ width: '100%', maxWidth: '1000px', minHeight: '100vh', display: 'flex', flexDirection: 'column', margin: '0 auto' }}>
            <div className="card animate-fade-in print-area" id="print-section" style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', padding: '40px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontFamily: '"Arial", sans-serif' }}>
            
            {/* Header del Formato Excel */}
            <div style={{ border: '2px solid #000', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ width: '50%' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>{getCompanyNames(companyId)}</h2>
                  <div style={{ fontSize: '0.85rem' }}>RUT: 76.220.330-K</div>
                  <div style={{ fontSize: '0.85rem' }}>GIRO: SERVICIOS INTEGRALES</div>
                </div>
                <div style={{ width: '50%', textAlign: 'right' }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 8px 0', textDecoration: 'underline' }}>LIQUIDACIÓN DE SUELDO</h1>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>PERIODO: {new Date().toISOString().slice(0, 7)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                  <strong style={{ borderBottom: '1px dotted #999' }}>NOMBRE:</strong> 
                  <span style={{ borderBottom: '1px dotted #999' }}>{showSlipModal.worker.nombre}</span>
                  
                  <strong style={{ borderBottom: '1px dotted #999' }}>R.U.T.:</strong> 
                  <span style={{ borderBottom: '1px dotted #999' }}>{showSlipModal.worker.rut}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                  <strong style={{ borderBottom: '1px dotted #999' }}>CARGO:</strong> 
                  <span style={{ borderBottom: '1px dotted #999' }}>{showSlipModal.worker.cargo}</span>
                  
                  <strong style={{ borderBottom: '1px dotted #999' }}>DIAS TRAB.:</strong> 
                  <span style={{ borderBottom: '1px dotted #999' }}>{showSlipModal.dias}</span>
                </div>
              </div>
            </div>

            {/* Cuerpos de Haberes y Descuentos */}
            <div style={{ display: 'flex', border: '2px solid #000', marginBottom: '24px' }}>
              {/* Haberes */}
              <div style={{ width: '50%', borderRight: '2px solid #000' }}>
                <div style={{ backgroundColor: '#eee', borderBottom: '2px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                  HABERES
                </div>
                <div style={{ padding: '8px', minHeight: '260px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px', textDecoration: 'underline' }}>Imponibles</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                    <span>SUELDO BASE</span>
                    <span>${showSlipModal.baseProporcional.toLocaleString('es-CL')}</span>
                  </div>
                  {showSlipModal.gratificacion > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span>GRATIFICACIÓN LEGAL</span>
                      <span>${showSlipModal.gratificacion.toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  {showSlipModal.otrosImponibles > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span>OTROS IMPONIBLES</span>
                      <span>${showSlipModal.otrosImponibles.toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginTop: '16px', marginBottom: '8px', textDecoration: 'underline' }}>No Imponibles</div>
                  {showSlipModal.movilizacion > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span>MOVILIZACIÓN</span>
                      <span>${showSlipModal.movilizacion.toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  {showSlipModal.alimentacion > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span>ALIMENTACIÓN / COLACIÓN</span>
                      <span>${showSlipModal.alimentacion.toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  {showSlipModal.transporte > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span>TRANSPORTE</span>
                      <span>${showSlipModal.transporte.toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  {showSlipModal.otrosNoImponibles > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span>OTROS NO IMPONIBLES</span>
                      <span>${showSlipModal.otrosNoImponibles.toLocaleString('es-CL')}</span>
                    </div>
                  )}
                </div>
                <div style={{ borderTop: '2px solid #000', padding: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                  <span>TOTAL IMPONIBLE:</span>
                  <span>${showSlipModal.totalImponible.toLocaleString('es-CL')}</span>
                </div>
                <div style={{ borderTop: '1px solid #ccc', padding: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>TOTAL HABERES:</span>
                  <span>${(showSlipModal.totalImponible + showSlipModal.totalNoImponible).toLocaleString('es-CL')}</span>
                </div>
              </div>

              {/* Descuentos */}
              <div style={{ width: '50%' }}>
                <div style={{ backgroundColor: '#eee', borderBottom: '2px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                  DESCUENTOS
                </div>
                <div style={{ padding: '8px', minHeight: '260px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                    <span>AFP ({payrollInputs.afp_porcentaje}%)</span>
                    <span>${showSlipModal.afp.toLocaleString('es-CL')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                    <span>SALUD ({payrollInputs.salud_porcentaje}%)</span>
                    <span>${showSlipModal.salud.toLocaleString('es-CL')}</span>
                  </div>
                  {showSlipModal.cesantia > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span>SEGURO CESANTÍA</span>
                      <span>${showSlipModal.cesantia.toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  {showSlipModal.impuesto > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span>IMPUESTO ÚNICO</span>
                      <span>${showSlipModal.impuesto.toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  {showSlipModal.voluntaria > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span>COTIZACIÓN VOLUNTARIA</span>
                      <span>${showSlipModal.voluntaria.toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  {showSlipModal.otrosDesc > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span>OTROS DESCUENTOS</span>
                      <span>${showSlipModal.otrosDesc.toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  {(showSlipModal.valeDeduction > 0) && (
                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginTop: '16px', marginBottom: '8px', textDecoration: 'underline' }}>Anticipos y Préstamos</div>
                  )}
                  {showSlipModal.valeDeduction > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span>ANTICIPOS Y VALES (TOTAL)</span>
                      <span>${showSlipModal.valeDeduction.toLocaleString('es-CL')}</span>
                    </div>
                  )}
                </div>
                <div style={{ borderTop: '2px solid #000', padding: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                  <span>ANTICIPOS:</span>
                  <span>${showSlipModal.anticipos.toLocaleString('es-CL')}</span>
                </div>
                <div style={{ borderTop: '1px solid #ccc', padding: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>TOTAL DESCUENTOS:</span>
                  <span>${showSlipModal.totalDescuentos.toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>

            {/* Totales y Alcance Líquido */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
              <div style={{ width: '50%', border: '2px solid #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', fontSize: '1.25rem', fontWeight: 'bold', backgroundColor: '#eee' }}>
                  <span>ALCANCE LÍQUIDO:</span>
                  <span>${showSlipModal.net.toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontSize: '0.85rem', marginBottom: '60px', textAlign: 'justify' }}>
                Certifico que he recibido de mi empleador {getCompanyNames(companyId)}, a mi entera satisfacción, 
                el saldo líquido indicado en esta liquidación, sin tener cargo ni cobro alguno posterior que hacer, 
                por los conceptos comprendidos en ella.
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '300px', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  FIRMA TRABAJADOR
                </div>
              </div>
            </div>

            {/* Action Buttons (Not printed) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '40px' }} className="no-print">
              <button type="button" className="btn-secondary" onClick={() => setShowSlipModal(null)} style={{ padding: '12px 24px', flex: 1, backgroundColor: '#eee', color: '#333', border: '1px solid #ccc' }}>
                Cerrar / Cancelar
              </button>
              <button type="button" className="btn-success" onClick={handlePrintSlip} style={{ padding: '12px 24px', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <Printer size={20} /> {showSlipModal.isReprint ? 'Imprimir Liquidación' : 'Guardar Liquidación e Imprimir'}
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Doc Modal para Contrato y Finiquito */}
      {showDocModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <div className="card animate-fade-in" style={{ width: '400px', margin: '0 auto auto auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="title-md" style={{ textTransform: 'capitalize' }}>Documento: {showDocModal.type}</h3>
              <button onClick={() => setShowDocModal(null)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            
            <div style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
              Trabajador: <strong style={{ color: 'white' }}>{showDocModal.worker.nombre}</strong>
            </div>

            {showDocModal.worker[`archivo_${showDocModal.type}`] && (
              <div style={{ marginBottom: '20px' }}>
                <a href={showDocModal.worker[`archivo_${showDocModal.type}`]} target="_blank" rel="noopener noreferrer" className="btn-success" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: '12px' }}>Ver Documento Actual</a>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Si subes uno nuevo, se reemplazará.</p>
              </div>
            )}

            <div>
              <label className="btn-primary" style={{ display: 'block', textAlign: 'center', cursor: 'pointer', padding: '10px' }}>
                {uploadingId === `doc_${showDocModal.type}` ? 'Subiendo...' : <><Upload size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}/> Subir PDF ({showDocModal.type})</>}
                <input type="file" style={{ display: 'none' }} accept="application/pdf" onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setUploadingId(`doc_${showDocModal.type}`);
                  try {
                    const result = await uploadDocument(file);
                    const updateData = {
                      id: showDocModal.worker.id,
                      [`archivo_${showDocModal.type}`]: result.archivo_url
                    };
                    await updateWorker(companyId, updateData);
                    addToast('Documento subido con éxito.', 'success');
                    loadWorkers();
                    setShowDocModal(null);
                  } catch (error) {
                    addToast('Error al subir: ' + error.message, 'danger');
                  } finally {
                    setUploadingId(null);
                  }
                }} disabled={uploadingId === `doc_${showDocModal.type}`} />
              </label>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HRManager;
