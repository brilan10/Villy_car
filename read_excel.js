import XLSX from 'xlsx';

const workbook = XLSX.readFile('c:\\Users\\yomiy\\Documents\\Proyectos\\Villy Car\\Analizar, porpuestas\\LIQUIDACIONES_MAYO.xlsm');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
console.log(data.slice(0, 50)); // Imprimir más filas para entender bien
