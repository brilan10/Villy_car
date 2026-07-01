import React, { useState, useEffect, useMemo } from 'react';
import { Download, TrendingUp, DollarSign, Users, Briefcase, FileText, Filter, Plus, Trash2, X } from 'lucide-react';
import { getFinances, getSales, getPayrolls, getEstadosPago, getAccounts } from '../services/api';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const reportOptions = [
  { id: 'finances', label: 'Ingresos y Egresos', icon: TrendingUp },
  { id: 'accounts', label: 'Estado de Cuenta Global', icon: DollarSign },
  { id: 'cxc_pendientes', label: 'Deuda a mi Favor (Por Cobrar)', icon: DollarSign },
  { id: 'cxp_pendientes', label: 'Mis Deudas (Por Pagar)', icon: DollarSign },
  { id: 'sales', label: 'Ventas (POS)', icon: Briefcase },
  { id: 'payrolls', label: 'Liquidaciones de Sueldo ($)', icon: Users },
  { id: 'payrolls_count', label: 'Personas Pagadas (Sueldos)', icon: Users },
  { id: 'estados_pago', label: 'Estados de Pago RRHH ($)', icon: FileText },
  { id: 'estados_pago_count', label: 'Personas Pagadas (Contratistas)', icon: FileText }
];

const chartTypeOptions = [
  { id: 'bar', label: 'Gráfico de Barras' },
  { id: 'line', label: 'Gráfico de Líneas' },
  { id: 'pie', label: 'Gráfico Circular (Torta)' }
];

const AnalyticsManager = ({ companyId, addToast }) => {
  const [loading, setLoading] = useState(false);
  const [finances, setFinances] = useState([]);
  const [sales, setSales] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [estadosPago, setEstadosPago] = useState([]);

  // Dashboard state
  const [activeCharts, setActiveCharts] = useState([]);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChartConfig, setNewChartConfig] = useState({ reportId: 'sales', chartType: 'line', title: 'Evolución de Ventas' });

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [finData, salesData, accData, payData, estData] = await Promise.all([
        getFinances(companyId),
        getSales(companyId),
        getAccounts(companyId),
        getPayrolls(companyId),
        getEstadosPago(companyId)
      ]);
      setFinances(finData);
      setSales(salesData);
      setAccounts(accData);
      setPayrolls(payData);
      setEstadosPago(estData);
    } catch (error) {
      addToast('Error al cargar datos para analítica', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const isWithinDateRange = (dateStr) => {
    if (!dateStr) return true;
    const isoDate = dateStr.substring(0, 10);
    if (dateFilter.start && isoDate < dateFilter.start) return false;
    if (dateFilter.end && isoDate > dateFilter.end) return false;
    return true;
  };

  const isWithinMonthRange = (monthStr) => {
    if (!monthStr) return true;
    const startMonth = dateFilter.start ? dateFilter.start.substring(0, 7) : null;
    const endMonth = dateFilter.end ? dateFilter.end.substring(0, 7) : null;
    if (startMonth && monthStr < startMonth) return false;
    if (endMonth && monthStr > endMonth) return false;
    return true;
  };

  // --- FILTROS (Arreglando el bug de date vs fecha en finanzas) ---
  const filteredFinances = useMemo(() => finances.filter(f => isWithinDateRange(f.date || f.fecha)), [finances, dateFilter]);
  const filteredSales = useMemo(() => sales.filter(s => isWithinDateRange(s.fecha)), [sales, dateFilter]);
  const filteredAccounts = useMemo(() => accounts.filter(a => isWithinDateRange(a.fecha_emision)), [accounts, dateFilter]);
  const filteredPayrolls = useMemo(() => payrolls.filter(p => isWithinMonthRange(p.mes_periodo)), [payrolls, dateFilter]);
  const filteredEstadosPago = useMemo(() => estadosPago.filter(e => isWithinDateRange(e.fecha)), [estadosPago, dateFilter]);

  // --- EXPORTAR ---
  const exportToExcel = async () => {
    if (activeCharts.length === 0) {
      addToast('No hay gráficos para exportar.', 'warning');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    
    // We keep track of added reports to avoid duplicating data if the user has 2 charts of the same data source
    const addedReports = new Set();

    for (const chart of activeCharts) {
      const { reportId, title } = chart;
      
      // Avoid creating the same sheet twice if they added 2 charts of the same data source
      if (addedReports.has(reportId)) continue;
      addedReports.add(reportId);
      
      let sheetName = title.substring(0, 25).replace(/[\*\?\/\\\[\]]/g, '');
      let counter = 1;
      let finalSheetName = sheetName;
      while (workbook.getWorksheet(finalSheetName)) {
        finalSheetName = `${sheetName} (${counter})`;
        counter++;
      }
      
      const worksheet = workbook.addWorksheet(finalSheetName);

      switch (reportId) {
        case 'finances':
          worksheet.columns = [
            { header: 'Fecha', key: 'fecha', width: 15 },
            { header: 'Tipo', key: 'tipo', width: 15 },
            { header: 'Categoría', key: 'categoria', width: 20 },
            { header: 'Descripción', key: 'descripcion', width: 30 },
            { header: 'Monto', key: 'monto', width: 15 }
          ];
          filteredFinances.forEach(f => worksheet.addRow({
            fecha: new Date(f.date || f.fecha).toLocaleDateString(),
            tipo: (f.type || f.tipo).toUpperCase(),
            categoria: f.category || f.categoria,
            descripcion: f.description || f.descripcion,
            monto: parseFloat(f.amount || f.monto)
          }));
          break;

        case 'sales':
          worksheet.columns = [
            { header: 'Fecha', key: 'fecha', width: 20 },
            { header: 'Cliente', key: 'cliente', width: 25 },
            { header: 'Método Pago', key: 'metodo', width: 15 },
            { header: 'Total Venta', key: 'total', width: 15 }
          ];
          filteredSales.forEach(s => worksheet.addRow({
            fecha: new Date(s.fecha).toLocaleDateString(),
            cliente: s.cliente_nombre || 'N/A',
            metodo: s.metodo_pago,
            total: parseFloat(s.total)
          }));
          break;

        case 'accounts':
          worksheet.columns = [
            { header: 'Tipo', key: 'tipo', width: 15 },
            { header: 'Entidad', key: 'entidad', width: 25 },
            { header: 'Monto Total', key: 'total', width: 15 },
            { header: 'Pagado', key: 'pagado', width: 15 },
            { header: 'Saldo Pendiente', key: 'saldo', width: 15 },
            { header: 'Vencimiento', key: 'vencimiento', width: 15 },
            { header: 'Estado', key: 'estado', width: 15 }
          ];
          filteredAccounts.forEach(a => {
            const total = parseFloat(a.monto_total);
            const pagado = parseFloat(a.monto_pagado);
            worksheet.addRow({
              tipo: a.tipo.toUpperCase(),
              entidad: a.nombre_entidad,
              total: total,
              pagado: pagado,
              saldo: total - pagado,
              vencimiento: new Date(a.fecha_vencimiento).toLocaleDateString(),
              estado: a.estado.toUpperCase()
            });
          });
          break;

        case 'payrolls':
          worksheet.columns = [
            { header: 'Período', key: 'periodo', width: 15 },
            { header: 'Trabajador', key: 'trabajador', width: 25 },
            { header: 'Sueldo Base', key: 'base', width: 15 },
            { header: 'Total Imponible', key: 'imponible', width: 15 },
            { header: 'AFP', key: 'afp', width: 15 },
            { header: 'Salud', key: 'salud', width: 15 },
            { header: 'Anticipos/Deuda', key: 'anticipos', width: 15 },
            { header: 'Sueldo Líquido', key: 'liquido', width: 15 }
          ];
          filteredPayrolls.forEach(p => worksheet.addRow({
            periodo: p.mes_periodo,
            trabajador: p.workerName,
            base: parseFloat(p.sueldo_base),
            imponible: parseFloat(p.total_imponible),
            afp: parseFloat(p.afp_monto),
            salud: parseFloat(p.salud_monto),
            anticipos: parseFloat(p.anticipos),
            liquido: parseFloat(p.sueldo_liquido)
          }));
          break;

        case 'estados_pago':
          worksheet.columns = [
            { header: 'Fecha', key: 'fecha', width: 15 },
            { header: 'Trabajador/Contratista', key: 'trabajador', width: 25 },
            { header: 'Descripción Avance', key: 'descripcion', width: 35 },
            { header: 'Monto a Pagar', key: 'monto', width: 15 },
            { header: 'Documento', key: 'doc', width: 15 }
          ];
          filteredEstadosPago.forEach(ep => worksheet.addRow({
            fecha: new Date(ep.fecha).toLocaleDateString(),
            trabajador: ep.workerName,
            descripcion: ep.descripcion_servicios,
            monto: parseFloat(ep.monto_total),
            doc: ep.archivo_url ? 'Firmado' : 'Falta Firma'
          }));
          break;

        case 'cxc_pendientes':
          worksheet.columns = [
            { header: 'Entidad', key: 'entidad', width: 25 },
            { header: 'Monto Adeudado (Por Cobrar)', key: 'monto', width: 25 }
          ];
          filteredAccounts.filter(a => a.tipo === 'cobrar').forEach(a => {
            const pendiente = parseFloat(a.monto_total) - parseFloat(a.monto_pagado || 0);
            if (pendiente > 0) {
              worksheet.addRow({ entidad: a.nombre_entidad || 'Sin Nombre', monto: pendiente });
            }
          });
          break;

        case 'cxp_pendientes':
          worksheet.columns = [
            { header: 'Entidad', key: 'entidad', width: 25 },
            { header: 'Monto a Pagar (Mi Deuda)', key: 'monto', width: 25 }
          ];
          filteredAccounts.filter(a => a.tipo === 'pagar').forEach(a => {
            const pendiente = parseFloat(a.monto_total) - parseFloat(a.monto_pagado || 0);
            if (pendiente > 0) {
              worksheet.addRow({ entidad: a.nombre_entidad || 'Sin Nombre', monto: pendiente });
            }
          });
          break;

        case 'payrolls_count':
          worksheet.columns = [
            { header: 'Período', key: 'periodo', width: 15 },
            { header: 'Personas Pagadas', key: 'personas', width: 20 }
          ];
          {
            const grouped = filteredPayrolls.reduce((acc, curr) => {
              const month = curr.mes_periodo;
              if (!acc[month]) acc[month] = new Set();
              acc[month].add(curr.trabajador_id || curr.workerName);
              return acc;
            }, {});
            Object.entries(grouped).forEach(([periodo, set]) => {
              worksheet.addRow({ periodo, personas: set.size });
            });
          }
          break;

        case 'estados_pago_count':
          worksheet.columns = [
            { header: 'Mes', key: 'mes', width: 15 },
            { header: 'Contratistas Pagados', key: 'contratistas', width: 20 }
          ];
          {
            const grouped = filteredEstadosPago.reduce((acc, curr) => {
              if (!curr.fecha) return acc;
              const month = curr.fecha.substring(0, 7);
              if (!acc[month]) acc[month] = new Set();
              acc[month].add(curr.trabajador_id || curr.workerName);
              return acc;
            }, {});
            Object.entries(grouped).forEach(([mes, set]) => {
              worksheet.addRow({ mes, contratistas: set.size });
            });
          }
          break;

        default:
          break;
      }

      // Estilos y Colores para toda la hoja
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: worksheet.columns.length }
      };

      worksheet.eachRow((row, rowNumber) => {
        // Bordes para todas las celdas
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
          };
        });

        if (rowNumber === 1) {
          // Cabecera: Azul vibrante con texto blanco
          row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
          row.alignment = { vertical: 'middle', horizontal: 'center' };
          row.height = 25;
        } else {
          // Filas alternas: Blanco y Celeste/Gris muy claro (Zebra)
          if (rowNumber % 2 === 0) {
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } }; // Light Blue/Gray
          } else {
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }; // White
          }
          row.alignment = { vertical: 'middle', horizontal: 'left' };
          
          // Formato de moneda para celdas numéricas si es necesario (simplificado, se aplicaría si el valor es número)
          row.eachCell((cell) => {
            if (typeof cell.value === 'number') {
              cell.numFmt = '$#,##0';
            }
          });
        }
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'Reportes_Analitica_Dashboard.xlsx');
    addToast(`Exportación general descargada con éxito`, 'success');
  };

  // --- DATOS PARA GRÁFICOS ---
  const getChartData = (reportId) => {
    switch (reportId) {
      case 'finances': {
        const grouped = filteredFinances.reduce((acc, curr) => {
          const dateVal = curr.date || curr.fecha;
          const typeVal = curr.type || curr.tipo;
          const amountVal = curr.amount || curr.monto;
          if(!dateVal) return acc;
          const month = dateVal.substring(0, 7);
          if (!acc[month]) acc[month] = { name: month, ingresos: 0, egresos: 0, value: 0 };
          if (typeVal === 'ingreso') acc[month].ingresos += parseFloat(amountVal);
          if (typeVal === 'egreso') acc[month].egresos += parseFloat(amountVal);
          acc[month].value = acc[month].ingresos; // for pie charts (defaulting to ingresos)
          return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
      }
      case 'sales': {
        const grouped = filteredSales.reduce((acc, curr) => {
          if(!curr.fecha) return acc;
          const date = curr.fecha.split('T')[0];
          if (!acc[date]) acc[date] = { name: date, ventas: 0, value: 0 };
          acc[date].ventas += parseFloat(curr.total);
          acc[date].value += parseFloat(curr.total);
          return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
      }
      case 'accounts': {
        let pagado = 0;
        let pendiente = 0;
        filteredAccounts.forEach(a => {
          pagado += parseFloat(a.monto_pagado || 0);
          pendiente += (parseFloat(a.monto_total) - parseFloat(a.monto_pagado || 0));
        });
        return [
          { name: 'Pagado', pagado: pagado, value: pagado },
          { name: 'Pendiente', pendiente: pendiente, value: pendiente }
        ];
      }
      case 'cxc_pendientes': {
        const grouped = filteredAccounts.filter(a => a.tipo === 'cobrar').reduce((acc, curr) => {
          const pendiente = parseFloat(curr.monto_total) - parseFloat(curr.monto_pagado || 0);
          if (pendiente <= 0) return acc;
          const entity = curr.nombre_entidad || 'Sin Nombre';
          if (!acc[entity]) acc[entity] = { name: entity, 'Monto Adeudado': 0, value: 0 };
          acc[entity]['Monto Adeudado'] += pendiente;
          acc[entity].value += pendiente;
          return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => b['Monto Adeudado'] - a['Monto Adeudado']);
      }
      case 'cxp_pendientes': {
        const grouped = filteredAccounts.filter(a => a.tipo === 'pagar').reduce((acc, curr) => {
          const pendiente = parseFloat(curr.monto_total) - parseFloat(curr.monto_pagado || 0);
          if (pendiente <= 0) return acc;
          const entity = curr.nombre_entidad || 'Sin Nombre';
          if (!acc[entity]) acc[entity] = { name: entity, 'Monto a Pagar': 0, value: 0 };
          acc[entity]['Monto a Pagar'] += pendiente;
          acc[entity].value += pendiente;
          return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => b['Monto a Pagar'] - a['Monto a Pagar']);
      }
      case 'payrolls': {
        const grouped = filteredPayrolls.reduce((acc, curr) => {
          const month = curr.mes_periodo;
          if (!acc[month]) acc[month] = { name: month, liquido: 0, imposiciones: 0, value: 0 };
          acc[month].liquido += parseFloat(curr.sueldo_liquido);
          acc[month].imposiciones += (parseFloat(curr.afp_monto) + parseFloat(curr.salud_monto));
          acc[month].value += parseFloat(curr.sueldo_liquido);
          return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
      }
      case 'estados_pago': {
        const grouped = filteredEstadosPago.reduce((acc, curr) => {
          const worker = curr.workerName || 'Sin Nombre';
          if (!acc[worker]) acc[worker] = { name: worker, monto: 0, value: 0 };
          acc[worker].monto += parseFloat(curr.monto_total);
          acc[worker].value += parseFloat(curr.monto_total);
          return acc;
        }, {});
        return Object.values(grouped);
      }
      case 'payrolls_count': {
        const grouped = filteredPayrolls.reduce((acc, curr) => {
          const month = curr.mes_periodo;
          if (!acc[month]) acc[month] = { name: month, personas: new Set() };
          acc[month].personas.add(curr.trabajador_id || curr.workerName);
          return acc;
        }, {});
        return Object.values(grouped).map(g => ({
          name: g.name,
          'Trabajadores': g.personas.size,
          value: g.personas.size
        })).sort((a, b) => a.name.localeCompare(b.name));
      }
      case 'estados_pago_count': {
        const grouped = filteredEstadosPago.reduce((acc, curr) => {
          if (!curr.fecha) return acc;
          const month = curr.fecha.substring(0, 7);
          if (!acc[month]) acc[month] = { name: month, contratistas: new Set() };
          acc[month].contratistas.add(curr.trabajador_id || curr.workerName);
          return acc;
        }, {});
        return Object.values(grouped).map(g => ({
          name: g.name,
          'Contratistas': g.contratistas.size,
          value: g.contratistas.size
        })).sort((a, b) => a.name.localeCompare(b.name));
      }
      default: return [];
    }
  };

  const removeChart = (id) => {
    setActiveCharts(prev => prev.filter(c => c.id !== id));
  };

  const addChart = () => {
    setActiveCharts(prev => [
      ...prev, 
      { id: Date.now(), reportId: newChartConfig.reportId, chartType: newChartConfig.chartType, title: newChartConfig.title }
    ]);
    setShowAddModal(false);
    addToast('Gráfico agregado al tablero', 'success');
  };

  const renderGenericChart = (chartConfig) => {
    const data = getChartData(chartConfig.reportId);

    if (data.length === 0) {
      return <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>No hay datos suficientes en este período.</div>;
    }

    const firstKey = Object.keys(data[0]).filter(k => k !== 'name' && k !== 'value')[0] || 'value';
    const secondKey = Object.keys(data[0]).filter(k => k !== 'name' && k !== 'value')[1] || null;

    if (chartConfig.chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)', color: 'white' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartConfig.chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)', color: 'white' }} />
            <Legend />
            <Line type="monotone" dataKey={firstKey} stroke="var(--accent)" strokeWidth={3} dot={{ r: 4 }} />
            {secondKey && <Line type="monotone" dataKey={secondKey} stroke="var(--danger)" strokeWidth={3} />}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" stroke="var(--text-muted)" />
          <YAxis stroke="var(--text-muted)" />
          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)', color: 'white' }} />
          <Legend />
          <Bar dataKey={firstKey} fill="var(--success)" />
          {secondKey && <Bar dataKey={secondKey} fill="var(--danger)" />}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="title-lg" style={{ marginBottom: 0 }}>Dashboard Analítico</h1>
          <p style={{ color: 'var(--text-muted)' }}>Crea tu propio tablero, visualiza en gráficos y exporta a Excel en múltiples libros.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white' }}>
            <Plus size={18} style={{ marginRight: '8px' }} />
            Agregar Gráfico
          </button>
          <button className="btn-success" onClick={exportToExcel} disabled={loading || activeCharts.length === 0} style={{ padding: '10px 16px' }}>
            <Download size={18} style={{ marginRight: '8px' }} />
            Exportar General
          </button>
        </div>
      </div>

      {/* FILTROS GLOBALES */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' , margin: 'auto' }}>
        <h3 style={{ fontSize: '1rem', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="var(--accent)" /> Filtros Globales
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Desde:</label>
          <input type="date" value={dateFilter.start} onChange={e => setDateFilter({...dateFilter, start: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'white', colorScheme: 'dark' }} />
          <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: '12px' }}>Hasta:</label>
          <input type="date" value={dateFilter.end} onChange={e => setDateFilter({...dateFilter, end: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'white', colorScheme: 'dark' }} />
        </div>
      </div>

      {/* GRILLA DE WIDGETS */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Cargando datos...</p>
      ) : activeCharts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed var(--border)', borderRadius: '12px', color: 'var(--text-muted)' }}>
          <Briefcase size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3>Tu dashboard está vacío</h3>
          <p>Comienza agregando un nuevo gráfico usando el botón superior.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {activeCharts.map(chart => (
            <div key={chart.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>{chart.title}</h3>
                <button onClick={() => removeChart(chart.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }} title="Eliminar gráfico">
                  <Trash2 size={16} />
                </button>
              </div>
              <div style={{ flex: 1, display: 'flex' }}>
                {renderGenericChart(chart)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL AGREGAR GRÁFICO */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <div className="card animate-fade-in" style={{ width: '450px', border: '1px solid var(--border)' , margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="title-md" style={{ margin: 0 }}>Agregar Gráfico</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Título del Gráfico</label>
              <input type="text" value={newChartConfig.title} onChange={e => setNewChartConfig({...newChartConfig, title: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Origen de Datos</label>
              <select value={newChartConfig.reportId} onChange={e => {
                const newReportId = e.target.value;
                const label = reportOptions.find(o => o.id === newReportId).label;
                setNewChartConfig({...newChartConfig, reportId: newReportId, title: label});
              }} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }}>
                {reportOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Tipo de Gráfico</label>
              <select value={newChartConfig.chartType} onChange={e => setNewChartConfig({...newChartConfig, chartType: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white' }}>
                {chartTypeOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>

            <button className="btn-primary" onClick={addChart} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              Agregar al Tablero
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsManager;
