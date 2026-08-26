import { SampleRecord } from '../types';
import { formatDateTime } from './formatters';

export function exportRecordsToCSV(records: SampleRecord[], systemName?: string) {
  if (!records || records.length === 0) {
    alert('No hay registros para exportar.');
    return;
  }

  // Find all unique process names across records for headers
  const processNamesSet = new Set<string>();
  records.forEach((r) => {
    r.processTimes.forEach((pt) => {
      processNamesSet.add(pt.processName);
    });
  });
  const processNames = Array.from(processNamesSet);

  // Build CSV Header
  const headers = [
    'ID Muestra',
    'Fecha y Hora',
    'Sistema',
    'Usuario ID',
    'Usuario Nombre',
    ...processNames.map((name) => `Tiempo: ${name} (seg)`),
    'Tiempo Total Sistema (seg)',
    'Tiempo Total Sistema (mm:ss)',
  ];

  // Build CSV Rows
  const rows = records.map((record) => {
    const processDurations = processNames.map((pName) => {
      const found = record.processTimes.find((pt) => pt.processName === pName);
      return found ? found.durationSeconds.toFixed(2) : 'N/A';
    });

    const mins = Math.floor(record.totalSystemTimeSeconds / 60);
    const secs = (record.totalSystemTimeSeconds % 60).toFixed(2);
    const formattedTotal = `${mins}:${Number(secs) < 10 ? '0' : ''}${secs}`;

    return [
      `"${record.id}"`,
      `"${formatDateTime(record.timestamp)}"`,
      `"${record.systemName.replace(/"/g, '""')}"`,
      record.userId,
      `"${record.userName.replace(/"/g, '""')}"`,
      ...processDurations,
      record.totalSystemTimeSeconds.toFixed(2),
      `"${formattedTotal}"`,
    ];
  });

  const csvContent = [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');

  // Create downloadable blob with UTF-8 BOM so Excel opens it with correct accents
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitizedSysName = (systemName || 'Todos_Los_Sistemas').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `muestras_simulacion_${sanitizedSysName}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
