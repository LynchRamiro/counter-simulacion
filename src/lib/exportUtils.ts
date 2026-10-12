import { SampleRecord } from '../types';
import { formatDateTime } from './formatters';

export function exportRecordsToCSV(records: SampleRecord[], filterTitle?: string) {
  if (!records || records.length === 0) {
    alert('No hay registros para exportar.');
    return;
  }

  // Build CSV Header (Ideal para Simulación: Wq, Ws, W total)
  const headers = [
    'ID Muestra',
    'Fecha y Hora',
    'Cola de Origen',
    'Servidor de Atencion',
    'Tipo de Tramite',
    'Tiempo en Cola Wq (seg)',
    'Tiempo en Cola Wq (mm:ss)',
    'Tiempo de Atencion Ws (seg)',
    'Tiempo de Atencion Ws (mm:ss)',
    'Tiempo Total Sistema W (seg)',
    'Tiempo Total Sistema W (mm:ss)',
    'Operador ID',
    'Operador Nombre',
    'Notas',
  ];

  const formatMinSec = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = (totalSecs % 60).toFixed(2);
    return `${mins}:${Number(secs) < 10 ? '0' : ''}${secs}`;
  };

  // Build CSV Rows
  const rows = records.map((record) => {
    const queueLabel =
      record.queueType === 'totem' || record.systemName.toLowerCase().includes('totem')
        ? 'Cola Totem'
        : 'Cola Cajero';

    const serverLabel = record.serverName || (record.queueType === 'totem' ? 'Totem Autoservicio' : 'Cajero 1');

    const operationLabel =
      record.operationType === 'adquisicion'
        ? 'Compra de entradas'
        : 'Retiro de entradas (App Web)';

    const queueWait = record.queueWaitTimeSeconds ?? 0;
    const serviceTime = record.serviceTimeSeconds ?? record.totalSystemTimeSeconds;
    const totalTime = record.totalSystemTimeSeconds;

    return [
      `"${record.id}"`,
      `"${formatDateTime(record.timestamp)}"`,
      `"${queueLabel}"`,
      `"${serverLabel}"`,
      `"${operationLabel}"`,
      queueWait.toFixed(2),
      `"${formatMinSec(queueWait)}"`,
      serviceTime.toFixed(2),
      `"${formatMinSec(serviceTime)}"`,
      totalTime.toFixed(2),
      `"${formatMinSec(totalTime)}"`,
      record.userId,
      `"${record.userName.replace(/"/g, '""')}"`,
      `"${(record.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');

  // Create downloadable blob with UTF-8 BOM so Excel opens it with correct accents
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitizedTitle = (filterTitle || 'Muestras_Cine').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `simulacion_cine_${sanitizedTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
