import React, { useState, useMemo } from 'react';
import { Download, Trash2, Filter, RefreshCw, ClipboardList, Clock } from 'lucide-react';
import { SampleRecord, SimulationSystem, UserProfile } from '../types';
import { formatDateTime, formatDuration } from '../lib/formatters';
import { exportRecordsToCSV } from '../lib/exportUtils';

interface RecordsPanelProps {
  records: SampleRecord[];
  systems: SimulationSystem[];
  users: UserProfile[];
  onDeleteRecord: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const RecordsPanel: React.FC<RecordsPanelProps> = ({
  records,
  systems,
  users,
  onDeleteRecord,
  onRefresh,
}) => {
  const [selectedSystemFilter, setSelectedSystemFilter] = useState<string>('ALL');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<SampleRecord | null>(null);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedSystemFilter !== 'ALL' && r.systemId !== selectedSystemFilter) {
        return false;
      }
      if (selectedUserFilter !== 'ALL' && String(r.userId) !== selectedUserFilter) {
        return false;
      }
      return true;
    });
  }, [records, selectedSystemFilter, selectedUserFilter]);

  // Find system object to get headers
  const currentFilteredSystem = systems.find((s) => s.id === selectedSystemFilter);

  // Dynamic process columns based on filtered system or union of processes
  const processColumns = useMemo(() => {
    if (currentFilteredSystem && currentFilteredSystem.processes) {
      return currentFilteredSystem.processes.map((p) => p.name);
    }
    const set = new Set<string>();
    filteredRecords.forEach((r) => {
      r.processTimes.forEach((pt) => set.add(pt.processName));
    });
    return Array.from(set);
  }, [currentFilteredSystem, filteredRecords]);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    setDeletingId(recordToDelete.id);
    await onDeleteRecord(recordToDelete.id);
    setDeletingId(null);
    setRecordToDelete(null);
  };

  const handleExport = () => {
    exportRecordsToCSV(filteredRecords, currentFilteredSystem?.name);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header with Filters & Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Filtros:</span>
          </div>

          {/* System Filter */}
          <select
            value={selectedSystemFilter}
            onChange={(e) => setSelectedSystemFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">Todos los Sistemas ({systems.length})</option>
            {systems.map((sys) => (
              <option key={sys.id} value={sys.id}>
                {sys.name}
              </option>
            ))}
          </select>

          {/* User Filter */}
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">Todos los Usuarios</option>
            {users.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.name} (Usuario {u.id})
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
            title="Recargar datos del servidor"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={handleExport}
            disabled={filteredRecords.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV (Excel)</span>
          </button>
        </div>
      </div>

      {/* Main Records Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No hay muestras registradas</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Inicia el cronómetro en la pestaña principal para registrar tiempos de cada proceso y sistema.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100/90 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4"># / ID</th>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Sistema</th>
                  <th className="py-3 px-4">Usuario</th>
                  {processColumns.map((colName, idx) => (
                    <th key={idx} className="py-3 px-4">
                      {colName}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right">Tiempo Total</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredRecords.map((record, index) => {
                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* ID / Row Number */}
                      <td className="py-3 px-4 font-mono text-xs text-slate-500 font-semibold">
                        <span className="text-slate-400 mr-1.5">{filteredRecords.length - index}.</span>
                        <span title={record.id}>{record.id.slice(-7)}</span>
                      </td>

                      {/* Date / Time */}
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {formatDateTime(record.timestamp)}
                      </td>

                      {/* System Name */}
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {record.systemName}
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          <span>{record.userName}</span>
                        </span>
                      </td>

                      {/* Process Times */}
                      {processColumns.map((colName, idx) => {
                        const match = record.processTimes.find((pt) => pt.processName === colName);
                        return (
                          <td key={idx} className="py-3 px-4 font-mono-numbers text-xs">
                            {match ? (
                              <span className="font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 inline-block">
                                {match.durationSeconds.toFixed(2)}s
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total System Time */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-mono-numbers font-extrabold text-blue-700 text-sm">
                          {record.totalSystemTimeSeconds.toFixed(2)}s
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          ({formatDuration(record.totalSystemTimeSeconds)})
                        </div>
                      </td>

                      {/* Delete action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setRecordToDelete(record)}
                          disabled={deletingId === record.id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar este registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              Total de muestras visualizadas: <strong className="text-slate-800">{filteredRecords.length}</strong>
            </span>
          </div>
          <div>
            Sincronización multiusuario activa
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-lg">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">¿Eliminar registro?</h3>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <p>Esta acción no se puede deshacer.</p>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs font-mono">
                <div>ID: {recordToDelete.id}</div>
                <div>Sistema: {recordToDelete.systemName}</div>
                <div>Tiempo Total: {recordToDelete.totalSystemTimeSeconds.toFixed(2)}s</div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
              >
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
