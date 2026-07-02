import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, Calendar, Download, X, FileText, Mail, CheckCircle } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import 'jspdf-autotable';
import { getFinances } from '../services/api';

const Dashboard = ({ companyId }) => {
  const [timeRange, setTimeRange] = useState('mensual'); // 'diario', 'semanal', 'mensual'
  
  // Estados para interactividad de gráficos
  const [visibleFlujo, setVisibleFlujo] = useState({ ingresos: true, egresos: true });
  const [visibleBalance, setVisibleBalance] = useState({ ingresos: true, egresos: true });
  const [hiddenDesglose, setHiddenDesglose] = useState({});

  const handleLegendClickFlujo = (e) => {
    setVisibleFlujo(prev => ({ ...prev, [e.dataKey]: !prev[e.dataKey] }));
  };

  const handleLegendClickBalance = (e) => {
    setVisibleBalance(prev => ({ ...prev, [e.dataKey]: !prev[e.dataKey] }));
  };

  const handleLegendClickDesglose = (e) => {
    const key = e.value || e.dataKey;
    if (key) {
      setHiddenDesglose(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const renderLegendTextFlujo = (value) => {
    const isHidden = !visibleFlujo[value.toLowerCase()];
    return <span style={{ textDecoration: isHidden ? 'line-through' : 'none', color: isHidden ? 'var(--text-muted)' : 'inherit', transition: 'all 0.2s ease' }}>{value}</span>;
  };

  const renderLegendTextBalance = (value) => {
    const isHidden = !visibleBalance[value.toLowerCase()];
    return <span style={{ textDecoration: isHidden ? 'line-through' : 'none', color: isHidden ? 'var(--text-muted)' : 'inherit', transition: 'all 0.2s ease' }}>{value}</span>;
  };

  const renderLegendTextDesglose = (value) => {
    const isHidden = hiddenDesglose[value];
    return <span style={{ textDecoration: isHidden ? 'line-through' : 'none', color: isHidden ? 'var(--text-muted)' : 'inherit', transition: 'all 0.2s ease' }}>{value}</span>;
  };

  // Estados para Modal de Exportación a Excel
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('ambos'); // 'ingresos', 'egresos', 'ambos'
  const [exportPeriod, setExportPeriod] = useState('mensual'); // 'diario', 'semanal', 'mensual', 'rango'
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const getCompanyName = () => {
    switch(companyId) {
      case '1': return 'J2 PUBLICIDAD';
      case '2': return 'DWORK';
      case '3': return 'VILLY CAR TUNING';
      case '4': return 'TRANSPORTES J2';
      default: return 'EMPRESA';
    }
  };

  const [financesData, setFinancesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFinances = async () => {
      setLoading(true);
      try {
        const data = await getFinances(companyId);
        setFinancesData(data);
      } catch (error) {
        console.error('Error loading finances:', error);
        addToast(`Error al cargar finanzas: ${error.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };
    loadFinances();
  }, [companyId]);

  const processData = () => {
    const annualMap = {};
    const monthlyMap = {};
    const weeklyMap = {};
    const dailyMap = {};
    const desgloseMap = {};
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    financesData.forEach(tx => {
      if(!tx.date && !tx.fecha) return;
      const dateStr = tx.date || tx.fecha;
      const date = new Date(dateStr);
      const amount = parseFloat(tx.amount || tx.monto) || 0;
      const type = tx.type || tx.tipo;
      const category = tx.category || tx.categoria;
      
      const year = date.getFullYear();
      
      // Anual
      if (!annualMap[year]) annualMap[year] = { name: `${year}`, ingresos: 0, egresos: 0, dateObj: new Date(year, 0, 1) };
      if (type === 'ingreso') annualMap[year].ingresos += amount;
      else annualMap[year].egresos += amount;

      // Mensual
      const monthName = `${months[date.getMonth()]} ${year}`;
      if (!monthlyMap[monthName]) monthlyMap[monthName] = { name: monthName, ingresos: 0, egresos: 0, dateObj: date };
      if (type === 'ingreso') monthlyMap[monthName].ingresos += amount;
      else monthlyMap[monthName].egresos += amount;
      
      if (type === 'egreso') {
        desgloseMap[category] = (desgloseMap[category] || 0) + amount;
      }
      
      const startDate = new Date(year, 0, 1);
      const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((days + 1) / 7);
      const weekName = `Sem ${weekNumber} ${year}`;
      if (!weeklyMap[weekName]) weeklyMap[weekName] = { name: weekName, ingresos: 0, egresos: 0, year, weekNumber };
      if (type === 'ingreso') weeklyMap[weekName].ingresos += amount;
      else weeklyMap[weekName].egresos += amount;
      
      const dayName = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${year}`;
      if (!dailyMap[dayName]) dailyMap[dayName] = { name: dayName, ingresos: 0, egresos: 0, dateObj: date };
      if (type === 'ingreso') dailyMap[dayName].ingresos += amount;
      else dailyMap[dayName].egresos += amount;
    });

    const dataAnual = Object.values(annualMap).sort((a,b) => a.dateObj - b.dateObj);
    const dataMensual = Object.values(monthlyMap).sort((a,b) => a.dateObj - b.dateObj).slice(-12);
    
    const dataSemanal = Object.values(weeklyMap).sort((a,b) => {
      if (a.year === b.year) return a.weekNumber - b.weekNumber;
      return a.year - b.year;
    }).slice(-10);
    
    const dataDiario = Object.values(dailyMap).sort((a,b) => a.dateObj - b.dateObj).slice(-14);
    
    const dataDesglose = Object.keys(desgloseMap).map(key => ({ name: key, value: desgloseMap[key] }));

    return { 
      dataAnual: dataAnual.length > 0 ? dataAnual : [{ name: 'Sin datos', ingresos: 0, egresos: 0 }],
      dataMensual: dataMensual.length > 0 ? dataMensual : [{ name: 'Sin datos', ingresos: 0, egresos: 0 }], 
      dataSemanal: dataSemanal.length > 0 ? dataSemanal : [{ name: 'Sin datos', ingresos: 0, egresos: 0 }], 
      dataDiario: dataDiario.length > 0 ? dataDiario : [{ name: 'Sin datos', ingresos: 0, egresos: 0 }], 
      dataDesglose: dataDesglose.length > 0 ? dataDesglose : [{ name: 'Sin datos', value: 1 }] 
    };
  };

  const { dataAnual, dataMensual, dataSemanal, dataDiario, dataDesglose } = processData();
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f43f5e', '#14b8a6', '#d946ef', '#eab308'];

  const getActiveData = () => {
    switch (timeRange) {
      case 'diario': return dataDiario;
      case 'semanal': return dataSemanal;
      case 'mensual': return dataMensual;
      case 'anual': return dataAnual;
      default: return dataMensual;
    }
  };

  const currentData = getActiveData();

  // Calcular totales dinámicos basados en la vista actual
  const totalIngresos = currentData.reduce((acc, curr) => acc + curr.ingresos, 0);
  const totalEgresos = currentData.reduce((acc, curr) => acc + curr.egresos, 0);

  const currentPeriod = currentData[currentData.length - 1] || { ingresos: 0, egresos: 0 };
  const previousPeriod = currentData[currentData.length - 2] || { ingresos: 0, egresos: 0 };

  const crecimientoVentas = previousPeriod.ingresos > 0 
    ? (((currentPeriod.ingresos - previousPeriod.ingresos) / previousPeriod.ingresos) * 100).toFixed(1)
    : (currentPeriod.ingresos > 0 ? 100 : 0);

  const tasaRentabilidad = totalIngresos > 0 
    ? (((totalIngresos - totalEgresos) / totalIngresos) * 100).toFixed(1)
    : 0;

  const isCrecimientoPositivo = crecimientoVentas >= 0;
  const isRentabilidadPositiva = tasaRentabilidad >= 0;

  const activeDataDesglose = dataDesglose.map(item => ({
    ...item,
    originalValue: item.value,
    value: hiddenDesglose[item.name] ? 0 : item.value
  }));

  const summaryCards = [
    { title: 'Ingresos Totales', value: `$${totalIngresos.toLocaleString()}`, icon: DollarSign, color: 'var(--success)' },
    { title: 'Egresos Totales', value: `$${totalEgresos.toLocaleString()}`, icon: TrendingDown, color: 'var(--danger)' },
    { title: 'Margen Neto', value: `$${(totalIngresos - totalEgresos).toLocaleString()}`, icon: TrendingUp, color: 'var(--accent)' },
    { title: 'Operaciones', value: financesData.length, icon: Activity, color: 'var(--warning)' },
  ];

  const getBaseData = () => {
    if (exportPeriod === 'diario') return dataDiario;
    if (exportPeriod === 'semanal') return dataSemanal;
    if (exportPeriod === 'anual') return dataAnual;
    if (exportPeriod === 'rango') {
      const start = exportStartDate ? new Date(exportStartDate + 'T00:00:00') : new Date('2000-01-01');
      const end = exportEndDate ? new Date(exportEndDate + 'T23:59:59') : new Date('2100-01-01');
      const rangeData = [];
      
      financesData.forEach(tx => {
        const dateStr = tx.date || tx.fecha;
        if (!dateStr) return;
        
        // Parse date safely
        const txDateStr = dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr;
        const txDate = new Date(txDateStr + 'T12:00:00'); 
        
        if (txDate >= start && txDate <= end) {
          const formattedDate = `${txDate.getDate().toString().padStart(2, '0')}/${(txDate.getMonth() + 1).toString().padStart(2, '0')}/${txDate.getFullYear()}`;
          const desc = tx.description || tx.descripcion || '';
          
          rangeData.push({
            name: `${formattedDate} - ${tx.category || tx.categoria || 'Operación'}${desc ? ` - ${desc}` : ''}`,
            ingresos: (tx.type === 'ingreso' || tx.tipo === 'ingreso') ? (parseFloat(tx.amount || tx.monto) || 0) : 0,
            egresos: (tx.type === 'egreso' || tx.tipo === 'egreso') ? (parseFloat(tx.amount || tx.monto) || 0) : 0
          });
        }
      });
      
      // Sort newest first or oldest first (currently oldest first based on original logic, but let's sort by string or date)
      return rangeData.length > 0 ? rangeData : [{ name: 'Sin datos', ingresos: 0, egresos: 0 }];
    }
    return dataMensual;
  };
                          
  const getPeriodName = () => exportPeriod === 'rango' 
                            ? `${exportStartDate || 'inicio'} a ${exportEndDate || 'fin'}` 
                            : exportPeriod;

  const handleExportExcel = async () => {
    setIsExporting(true);
    let periodName = getPeriodName();
    const baseData = getBaseData();

    const workbook = new ExcelJS.Workbook();
    
    // PORTADA
    const coverSheet = workbook.addWorksheet('Portada', { views: [{ showGridLines: false }] });
    coverSheet.getColumn(1).width = 4;
    coverSheet.getColumn(2).width = 30;
    coverSheet.getColumn(3).width = 25;

    const LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAADBJREFUKFNj/M/A8J+BIoCMT0v7Ty7HwMBAEwxhQJJiNBlCgmE0GUIXJk/y4E1QAAA2FgwO2s6VRAAAAABJRU5ErkJggg==';
    const logoId = workbook.addImage({ base64: LOGO_BASE64, extension: 'png' });
    coverSheet.addImage(logoId, { tl: { col: 1, row: 1 }, ext: { width: 40, height: 40 } });

    coverSheet.mergeCells('B2:C2');
    const title = coverSheet.getCell('B2');
    title.value = `REPORTE EJECUTIVO - ${getCompanyName()}`;
    title.font = { size: 18, bold: true, color: { argb: 'FF1E1E1E' } };

    coverSheet.getCell('B4').value = 'Fecha de Emisión:';
    coverSheet.getCell('C4').value = new Date().toLocaleString();
    coverSheet.getCell('B5').value = 'Periodo Seleccionado:';
    coverSheet.getCell('C5').value = periodName.toUpperCase();
    
    const totalIng = baseData.reduce((acc, curr) => acc + curr.ingresos, 0);
    const totalEgr = baseData.reduce((acc, curr) => acc + curr.egresos, 0);
    const margen = totalIng - totalEgr;

    coverSheet.getCell('B7').value = 'Total Ingresos Recaudados:';
    coverSheet.getCell('C7').value = totalIng;
    coverSheet.getCell('C7').numFmt = '"$"#,##0';
    coverSheet.getCell('C7').font = { bold: true, color: { argb: 'FF10B981' } };

    coverSheet.getCell('B8').value = 'Total Egresos:';
    coverSheet.getCell('C8').value = totalEgr;
    coverSheet.getCell('C8').numFmt = '"$"#,##0';
    coverSheet.getCell('C8').font = { bold: true, color: { argb: 'FFEF4444' } };

    coverSheet.getCell('B10').value = 'Margen Neto:';
    coverSheet.getCell('B10').font = { bold: true, size: 14 };
    coverSheet.getCell('C10').value = margen;
    coverSheet.getCell('C10').numFmt = '"$"#,##0';
    coverSheet.getCell('C10').font = { bold: true, size: 14, color: { argb: margen >= 0 ? 'FF10B981' : 'FFEF4444' } };

    const createSheet = (sheetName, columnsConfig, dataKeyMap, themeColor) => {
      const sheet = workbook.addWorksheet(sheetName, { views: [{ showGridLines: false }] });
      
      const cols = columnsConfig.length;
      const lastColLetter = String.fromCharCode(64 + cols);

      // Titulo Principal
      sheet.mergeCells(`A1:${lastColLetter}1`);
      const titleCell = sheet.getCell('A1');
      titleCell.value = `REPORTE FINANCIERO ${getCompanyName()} - ${sheetName.toUpperCase()}`;
      titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF333333' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 40;

      // Subtitulo
      sheet.mergeCells(`A2:${lastColLetter}2`);
      const subTitleCell = sheet.getCell('A2');
      subTitleCell.value = `Periodo: ${periodName.toUpperCase()} | Fecha de emisión: ${new Date().toLocaleDateString()}`;
      subTitleCell.font = { name: 'Calibri', size: 11, color: { argb: 'FF666666' }, italic: true };
      subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(2).height = 20;

      sheet.getRow(3).height = 10; // Espaciador

      // Headers
      sheet.columns = columnsConfig;
      const headerRow = sheet.getRow(4);
      columnsConfig.forEach((col, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = col.header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: themeColor } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'medium', color: { argb: themeColor } },
          bottom: { style: 'medium', color: { argb: themeColor } }
        };
      });
      headerRow.height = 30;

      // Datos
      let currentRowIdx = 5;
      baseData.forEach(item => {
        const row = sheet.getRow(currentRowIdx);
        columnsConfig.forEach((col, idx) => {
          const cell = row.getCell(idx + 1);
          const dataVal = dataKeyMap[col.key] ? dataKeyMap[col.key](item) : item[col.key];
          cell.value = dataVal;
          cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF333333' } };
          cell.alignment = { vertical: 'middle', horizontal: col.isCurrency ? 'right' : 'center' };
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } } };

          if (col.isCurrency) {
            cell.numFmt = '"$"#,##0';
            if (col.key === 'egresos') cell.font = { bold: true, color: { argb: 'FFEF4444' } };
            else if (col.key === 'ingresos') cell.font = { bold: true, color: { argb: 'FF10B981' } };
            else if (col.key === 'balance') cell.font = { bold: true, color: { argb: dataVal >= 0 ? 'FF10B981' : 'FFEF4444' } };
          }
        });
        row.height = 25;
        currentRowIdx++;
      });

      // Fila de Totales
      const totalRow = sheet.getRow(currentRowIdx);
      totalRow.getCell(1).value = 'TOTALES';
      totalRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF333333' } };
      totalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
      
      columnsConfig.forEach((col, idx) => {
        if (col.isCurrency) {
          const cell = totalRow.getCell(idx + 1);
          const colLetter = String.fromCharCode(64 + idx + 1);
          cell.value = { formula: `SUM(${colLetter}5:${colLetter}${currentRowIdx - 1})` };
          cell.numFmt = '"$"#,##0';
          cell.font = { bold: true, size: 12, color: { argb: 'FF333333' } };
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.border = { top: { style: 'double', color: { argb: 'FFCCCCCC' } } };
        }
      });
      totalRow.height = 30;

      // Formatos Condicionales Nativos (DataBars)
      const balanceIdx = columnsConfig.findIndex(c => c.key === 'balance');
      if (balanceIdx !== -1) {
        const colLetter = String.fromCharCode(64 + balanceIdx + 1);
        sheet.addConditionalFormatting({
          ref: `${colLetter}5:${colLetter}${currentRowIdx - 1}`,
          rules: [
            { type: 'dataBar', cfvo: [{ type: 'min' }, { type: 'max' }], color: { argb: 'FF10B981' } }
          ]
        });
      }
    }; // end createSheet

    try {
      if (exportType === 'ambos' || exportType === 'ingresos') {
        createSheet('Ingresos', [
          { header: 'Periodo', key: 'name', width: 25 },
          { header: 'Ingresos', key: 'ingresos', width: 20, isCurrency: true }
        ], { name: i => i.name, ingresos: i => i.ingresos }, 'FF10B981');
      }

      if (exportType === 'ambos' || exportType === 'egresos') {
        createSheet('Egresos', [
          { header: 'Periodo', key: 'name', width: 25 },
          { header: 'Egresos', key: 'egresos', width: 20, isCurrency: true }
        ], { name: i => i.name, egresos: i => i.egresos }, 'FFEF4444');
      }

      if (exportType === 'ambos') {
        createSheet('Resumen Consolidado', [
          { header: 'Periodo', key: 'name', width: 25 },
          { header: 'Ingresos', key: 'ingresos', width: 20, isCurrency: true },
          { header: 'Egresos', key: 'egresos', width: 20, isCurrency: true },
          { header: 'Margen Neto', key: 'balance', width: 20, isCurrency: true }
        ], { 
          name: i => i.name, 
          ingresos: i => i.ingresos, 
          egresos: i => i.egresos, 
          balance: i => i.ingresos - i.egresos 
        }, 'FF6366F1');
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Reporte_Financiero_${getCompanyName().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      if(addToast) addToast('Error al exportar a Excel: ' + error.message, 'danger');
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const baseData = getBaseData();
      const periodName = getPeriodName();

      doc.setFontSize(20);
      doc.setTextColor(30);
      doc.text(`REPORTE FINANCIERO - ${getCompanyName()}`, 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Periodo: ${periodName.toUpperCase()}   |   Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 30);

      let head = [['Periodo']];
      if (exportType === 'ingresos' || exportType === 'ambos') head[0].push('Ingresos');
      if (exportType === 'egresos' || exportType === 'ambos') head[0].push('Egresos');
      if (exportType === 'ambos') head[0].push('Margen Neto');

      const body = baseData.map(item => {
        let row = [item.name];
        if (exportType === 'ingresos' || exportType === 'ambos') row.push(`$${item.ingresos.toLocaleString()}`);
        if (exportType === 'egresos' || exportType === 'ambos') row.push(`$${item.egresos.toLocaleString()}`);
        if (exportType === 'ambos') row.push(`$${(item.ingresos - item.egresos).toLocaleString()}`);
        return row;
      });

      doc.autoTable({
        startY: 40,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 6, halign: 'center' },
        columnStyles: { 0: { halign: 'left' } },
      });

      window.open(doc.output('bloburl'), '_blank');
    } catch (error) {
      console.error("Error al exportar a PDF:", error);
      if(addToast) addToast('Error al exportar a PDF: ' + error.message, 'danger');
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  const handleSendEmail = () => {
    setIsExporting(true);
    // Simular envío de correo
    setTimeout(() => {
      setIsExporting(false);
      setEmailSent(true);
      setTimeout(() => {
        setEmailSent(false);
        setShowExportModal(false);
      }, 2500);
    }, 1500);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 className="title-lg" style={{ marginBottom: 0 }}>Panel de Control Financiero</h1>
          <p style={{ color: 'var(--text-muted)' }}>Métricas e indicadores en tiempo real.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button 
            className="btn-success" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.875rem' }}
            onClick={() => setShowExportModal(true)}
          >
            <Download size={18} />
            Exportar a Excel
          </button>
          
          {/* Filtros de Tiempo */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            {['diario', 'mensual', 'anual'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: timeRange === range ? 'var(--accent)' : 'transparent',
                  color: timeRange === range ? 'white' : 'var(--text-muted)',
                  fontWeight: timeRange === range ? 600 : 500,
                  textTransform: 'capitalize'
                }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: `${card.color}20`, padding: '16px', borderRadius: '12px', color: card.color }}>
                <Icon size={24} />
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} /> {card.title}
                </p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{card.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Area Superior */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="card">
          <h2 className="title-md">Flujo de Caja ({timeRange})</h2>
          <div style={{ height: '300px', width: '100%', marginTop: '24px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                <YAxis width={110} stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)' }} 
                  itemStyle={{ color: 'var(--text-main)' }}
                />
                <Legend onClick={handleLegendClickFlujo} wrapperStyle={{ cursor: 'pointer' }} formatter={renderLegendTextFlujo} />
                <Area type="monotone" dataKey="ingresos" hide={!visibleFlujo.ingresos} stroke="var(--success)" fillOpacity={1} fill="url(#colorIngresos)" name="Ingresos" />
                <Area type="monotone" dataKey="egresos" hide={!visibleFlujo.egresos} stroke="var(--danger)" fillOpacity={1} fill="url(#colorEgresos)" name="Egresos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="title-md">Balance ({timeRange})</h2>
          <div style={{ height: '300px', width: '100%', marginTop: '24px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                <YAxis width={110} stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} 
                  cursor={{fill: 'var(--bg-card-hover)'}}
                />
                <Legend onClick={handleLegendClickBalance} wrapperStyle={{ cursor: 'pointer' }} formatter={renderLegendTextBalance} />
                <Bar dataKey="ingresos" hide={!visibleBalance.ingresos} fill="var(--accent)" name="Ingresos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="egresos" hide={!visibleBalance.egresos} fill="var(--warning)" name="Egresos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Area Inferior (Nuevos Gráficos) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <div className="card">
          <h2 className="title-md">Desglose de Egresos</h2>
          <div style={{ height: '300px', width: '100%', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeDataDesglose}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {activeDataDesglose.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={hiddenDesglose[entry.name] ? 0.3 : 1} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  formatter={(value, name, props) => [props.payload.originalValue || value, name]}
                />
                <Legend onClick={handleLegendClickDesglose} wrapperStyle={{ cursor: 'pointer' }} formatter={renderLegendTextDesglose} verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="title-md">Rendimiento</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Crecimiento de Ventas</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Comparado con el periodo anterior</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isCrecimientoPositivo ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: '1.25rem' }}>
                {isCrecimientoPositivo ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                {isCrecimientoPositivo ? '+' : ''}{crecimientoVentas}%
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Tasa de Rentabilidad</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Margen neto operativo</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isRentabilidadPositiva ? 'var(--accent)' : 'var(--danger)', fontWeight: 600, fontSize: '1.25rem' }}>
                {isRentabilidadPositiva ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                {isRentabilidadPositiva ? '+' : ''}{tasaRentabilidad}%
              </div>
            </div>
            
            <div style={{ marginTop: 'auto', backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>Sugerencia del Sistema</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Tus gastos de <strong>{dataDesglose[0]?.name || 'Operaciones'}</strong> representan una gran parte de tus egresos. Te sugerimos revisar las compras recientes para mejorar el rendimiento.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Exportación (Ticket) */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '40px 20px' }}>
          <div className="card animate-fade-in" style={{ width: '650px', position: 'relative', borderTop: '4px solid var(--accent)' , margin: 'auto' }}>
            <button onClick={() => setShowExportModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)' }}><X size={20} /></button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--accent)' }}>
                <FileText size={28} />
              </div>
              <div>
                <h2 className="title-md" style={{ marginBottom: 0 }}>Ticket de Exportación Avanzada</h2>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Configura y previsualiza el reporte corporativo</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              {/* Opciones Izquierda */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>1. Datos a incluir</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    {['ingresos', 'egresos', 'ambos'].map(type => (
                      <button
                        key={type}
                        onClick={() => setExportType(type)}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '6px',
                          border: `1px solid ${exportType === type ? 'var(--accent)' : 'var(--border)'}`,
                          backgroundColor: exportType === type ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-main)',
                          color: exportType === type ? 'var(--accent)' : 'var(--text-muted)',
                          fontSize: '0.75rem',
                          fontWeight: exportType === type ? 600 : 500,
                          textTransform: 'capitalize',
                          cursor: 'pointer'
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>2. Periodo Fiscal</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {['diario', 'mensual', 'anual', 'rango'].map(period => (
                      <button
                        key={period}
                        onClick={() => setExportPeriod(period)}
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: `1px solid ${exportPeriod === period ? 'var(--success)' : 'var(--border)'}`,
                          backgroundColor: exportPeriod === period ? 'var(--success)' : 'var(--bg-main)',
                          color: exportPeriod === period ? 'white' : 'var(--text-muted)',
                          fontSize: '0.75rem',
                          fontWeight: exportPeriod === period ? 600 : 500,
                          textTransform: 'capitalize',
                          cursor: 'pointer'
                        }}
                      >
                        {period === 'rango' ? 'Personalizado' : period}
                      </button>
                    ))}
                  </div>
                </div>

                {exportPeriod === 'rango' && (
                  <div className="animate-fade-in" style={{ display: 'flex', gap: '8px', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Inicio</label>
                      <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Fin</label>
                      <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Previsualización Derecha */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Previsualización (Top 5)
                </label>
                <div style={{ flex: 1, backgroundColor: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '8px', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>
                    <div style={{ flex: 1 }}>Periodo</div>
                    {exportType !== 'egresos' && <div style={{ width: '60px', textAlign: 'right' }}>Ingresos</div>}
                    {exportType !== 'ingresos' && <div style={{ width: '60px', textAlign: 'right' }}>Egresos</div>}
                  </div>
                  <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                    {getBaseData().slice(0, 5).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <div style={{ flex: 1 }}>{item.name}</div>
                        {exportType !== 'egresos' && <div style={{ width: '60px', textAlign: 'right', color: 'var(--success)', fontWeight: 500 }}>${item.ingresos}</div>}
                        {exportType !== 'ingresos' && <div style={{ width: '60px', textAlign: 'right', color: 'var(--danger)', fontWeight: 500 }}>${item.egresos}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Alertas */}
            {emailSent && (
              <div className="animate-fade-in" style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: '8px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 500 }}>
                <CheckCircle size={18} />
                Reporte enviado exitosamente por correo electrónico.
              </div>
            )}

            {/* Botonera de Acción */}
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={handleSendEmail}
                disabled={isExporting}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', fontSize: '0.875rem', fontWeight: 500, cursor: isExporting ? 'not-allowed' : 'pointer', opacity: isExporting ? 0.5 : 1 }}
              >
                <Mail size={16} /> Enviar a Contabilidad
              </button>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--danger)', color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: isExporting ? 'not-allowed' : 'pointer', opacity: isExporting ? 0.5 : 1 }}
                >
                  <FileText size={16} /> PDF
                </button>
                <button 
                  className="btn-success" 
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', fontSize: '0.875rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)', opacity: isExporting ? 0.5 : 1 }}
                >
                  <Download size={16} /> Excel Avanzado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
