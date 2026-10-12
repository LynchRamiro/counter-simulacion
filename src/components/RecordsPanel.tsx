import React, { useState, useMemo } from 'react';
import {
  Download,
  Trash2,
  Filter,
  RefreshCw,
  ClipboardList,
  Clock,
  CheckSquare,
  Square,
  MinusSquare,
  AlertTriangle,
  Monitor,
  Ticket,
  Percent,
  Search
} from 'lucide-react';
import { SampleRecord, UserProfile, QueueType } from '../types';
import { formatDateTime, formatDuration } from '../lib/formatters';
import { exportRecordsToCSV } from '../lib/exportUtils';

interface RecordsPanelProps {
  records: SampleRecord[];
  users: UserProfile[];
  onDeleteRecords: (ids: string[]) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const RecordsPanel: React.FC<RecordsPanelProps> = ({
  records,
  users,
  onDeleteRecords,
  onRefresh,
}) => {
  // Filters
  const [selectedQueueFilter, setSelectedQueueFilter] = useState<string>('ALL'); // 'ALL' | 'totem' | 'personalizada'
  const [selectedServerFilter, setSelectedServerFilter] = useState<string>('ALL'); // 'ALL' | 'totem' | 'cajero-1' | 'cajero-2'
  const [selectedOpFilter, setSelectedOpFilter] = useState<string>('ALL'); // 'ALL' | 'adquisicion' | 'retiro_web'
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [idsToDelete, setIdsToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const isTotem = r.queueType === 'totem' || r.systemName.toLowerCase().includes('totem');
      const queueType: QueueType = isTotem ? 'totem' : 'personalizada';

      if (selectedQueueFilter !== 'ALL' && queueType !== selectedQueueFilter) {
        return false;
      }

      if (selectedServerFilter !== 'ALL') {
        const srv = (r.serverName || '').toLowerCase();
        if (selectedServerFilter === 'totem' && !srv.includes('totem')) return false;
        if (selectedServerFilter === 'cajero-1' && !srv.includes('1')) return false;
        if (selectedServerFilter === 'cajero-2' && !srv.includes('2')) return false;
      }

      if (selectedOpFilter !== 'ALL' && r.operationType !== selectedOpFilter) {
        return false;
      }

      if (selectedUserFilter !== 'ALL' && String(r.userId) !== selectedUserFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const notesMatch = (r.notes || '').toLowerCase().includes(query);
        const userMatch = r.userName.toLowerCase().includes(query);
        const idMatch = r.id.toLowerCase().includes(query);
        const srvMatch = (r.serverName || '').toLowerCase().includes(query);
        if (!notesMatch && !userMatch && !idMatch && !srvMatch) return false;
      }

      return true;
    });
  }, [records, selectedQueueFilter, selectedServerFilter, selectedOpFilter, selectedUserFilter, searchQuery]);

  // Key KPI Metrics for Queue Theory & Simulation
  const metrics = useMemo(() => {
    const total = records.length;
    const totem = records.filter((r) => r.queueType === 'totem' || r.systemName.toLowerCase().includes('totem'));
    const pers = records.filter((r) => r.queueType === 'personalizada' || !r.systemName.toLowerCase().includes('totem'));
    const persAdq = pers.filter((r) => r.operationType === 'adquisicion');
    const persRet = pers.filter((r) => r.operationType === 'retiro_web');

    // Tiempos medios de espera en cola (Wq)
    const avgTotemWq = totem.length > 0 ? totem.reduce((acc, r) => acc + (r.queueWaitTimeSeconds || 0), 0) / totem.length : 0;
    const avgPersWq = pers.length > 0 ? pers.reduce((acc, r) => acc + (r.queueWaitTimeSeconds || 0), 0) / pers.length : 0;

    // Tiempos medios de atención / servicio (Ws)
    const avgTotemWs = totem.length > 0 ? totem.reduce((acc, r) => acc + (r.serviceTimeSeconds ?? r.totalSystemTimeSeconds), 0) / totem.length : 0;
    const avgPersAdqWs = persAdq.length > 0 ? persAdq.reduce((acc, r) => acc + (r.serviceTimeSeconds ?? r.totalSystemTimeSeconds), 0) / persAdq.length : 0;
    const avgPersRetWs = persRet.length > 0 ? persRet.reduce((acc, r) => acc + (r.serviceTimeSeconds ?? r.totalSystemTimeSeconds), 0) / persRet.length : 0;

    // Tiempo medio total en el sistema (W = Wq + Ws)
    const avgTotemW = totem.length > 0 ? totem.reduce((acc, r) => acc + r.totalSystemTimeSeconds, 0) / totem.length : 0;
    const avgPersW = pers.length > 0 ? pers.reduce((acc, r) => acc + r.totalSystemTimeSeconds, 0) / pers.length : 0;

    const pctAdq = pers.length > 0 ? (persAdq.length / pers.length) * 100 : 0;
    const pctRet = pers.length > 0 ? (persRet.length / pers.length) * 100 : 0;

    return {
      total,
      totemCount: totem.length,
      avgTotemWq,
      avgTotemWs,
      avgTotemW,
      persCount: pers.length,
      avgPersWq,
      avgPersW,
      persAdqCount: persAdq.length,
      avgPersAdqWs,
      pctAdq,
      persRetCount: persRet.length,
      avgPersRetWs,
      pctRet,
    };
  }, [records]);

  // Selection helpers
  const allFilteredSelected = filteredRecords.length > 0 && filteredRecords.every((r) => selectedIds.has(r.id));
  const someFilteredSelected = filteredRecords.some((r) => selectedIds.has(r.id)) && !allFilteredSelected;

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const next = new Set(selectedIds);
      filteredRecords.forEach((r) => next.delete(r.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredRecords.forEach((r) => next.add(r.id));
      setSelectedIds(next);
    }
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleConfirmDelete = async () => {
    if (idsToDelete.length === 0) return;
    setIsDeleting(true);
    await onDeleteRecords(idsToDelete);
    const next = new Set(selectedIds);
    idsToDelete.forEach((id) => next.delete(id));
    setSelectedIds(next);
    setIsDeleting(false);
    setIdsToDelete([]);
  };

  const handleExport = () => {
    const toExport = selectedIds.size > 0
      ? filteredRecords.filter((r) => selectedIds.has(r.id))
      : filteredRecords;

    let filterTag = 'Muestras';
    if (selectedQueueFilter === 'totem') filterTag += '_Totem';
    if (selectedQueueFilter === 'personalizada') filterTag += '_Cajeros';
    if (selectedOpFilter === 'adquisicion') filterTag += '_Compra';
    if (selectedOpFilter === 'retiro_web') filterTag += '_RetiroWeb';

    exportRecordsToCSV(toExport, filterTag);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Simulation KPI Summary Cards (Wq, Ws, W) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Muestras */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Muestras</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono-numbers">
            {metrics.total}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {metrics.totemCount} Tótem + {metrics.persCount} Cajeros
          </div>
        </div>

        {/* KPI 2: Tótem Autoservicio (Wq y Ws) */}
        <div className="bg-white rounded-2xl border border-indigo-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-700 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
              <Monitor className="w-3.5 h-3.5" />
              <span>Tótem Autoservicio</span>
            </span>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200">
              {metrics.totemCount} mues.
            </span>
          </div>
          <div className="text-lg font-black text-indigo-950 font-mono-numbers">
            Espera Wq: {metrics.avgTotemWq.toFixed(1)}s
          </div>
          <div className="text-xs text-indigo-700 mt-0.5 font-medium">
            Atención Ws: <strong className="font-mono">{metrics.avgTotemWs.toFixed(1)}s</strong> | Total W: <strong className="font-mono">{metrics.avgTotemW.toFixed(1)}s</strong>
          </div>
        </div>

        {/* KPI 3: Cajeros - Compra de Entradas */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
              <Ticket className="w-3.5 h-3.5" />
              <span>Cajeros: Compra</span>
            </span>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
              {metrics.persAdqCount} ({metrics.pctAdq.toFixed(0)}%)
            </span>
          </div>
          <div className="text-lg font-black text-emerald-950 font-mono-numbers">
            Atención Ws: {metrics.avgPersAdqWs.toFixed(1)}s
          </div>
          <div className="text-xs text-emerald-700 mt-0.5 font-medium">
            Espera media en cola: <strong className="font-mono">{metrics.avgPersWq.toFixed(1)}s</strong>
          </div>
        </div>

        {/* KPI 4: Cajeros - Retiro Web */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
              <Percent className="w-3.5 h-3.5" />
              <span>Cajeros: Retiro Web</span>
            </span>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
              {metrics.persRetCount} ({metrics.pctRet.toFixed(0)}%)
            </span>
          </div>
          <div className="text-lg font-black text-amber-950 font-mono-numbers">
            Atención Ws: {metrics.avgPersRetWs.toFixed(1)}s
          </div>
          <div className="text-xs text-amber-700 mt-0.5 font-medium">
            Espera media en cola: <strong className="font-mono">{metrics.avgPersWq.toFixed(1)}s</strong>
          </div>
        </div>
      </div>

      {/* Header with Filters & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 uppercase mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filtros:</span>
          </div>

          {/* Queue Filter */}
          <select
            value={selectedQueueFilter}
            onChange={(e) => setSelectedQueueFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Todas las Colas</option>
            <option value="totem">Cola Tótem</option>
            <option value="personalizada">Cola Cajero</option>
          </select>

          {/* Server Filter */}
          <select
            value={selectedServerFilter}
            onChange={(e) => setSelectedServerFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Todos los Servidores</option>
            <option value="totem">Tótem Autoservicio</option>
            <option value="cajero-1">Cajero 1</option>
            <option value="cajero-2">Cajero 2</option>
          </select>

          {/* Operation Filter */}
          <select
            value={selectedOpFilter}
            onChange={(e) => setSelectedOpFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Todos los Trámites</option>
            <option value="adquisicion">💳 Compra de entradas</option>
            <option value="retiro_web">📱 Retiro Web</option>
          </select>

          {/* User Filter */}
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Todos los Operadores</option>
            {users.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.name} (Usuario {u.id})
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar notas, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0 self-end xl:self-auto">
          {selectedIds.size > 0 && (
            <button
              onClick={() => setIdsToDelete(Array.from(selectedIds))}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all animate-in fade-in"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar ({selectedIds.size})</span>
            </button>
          )}

          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            title="Recargar datos del servidor"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            onClick={handleExport}
            disabled={filteredRecords.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {selectedIds.size > 0 ? `Exportar (${selectedIds.size}) CSV` : 'Exportar CSV'}
            </span>
          </button>
        </div>
      </div>

      {/* Multi-selection info bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-blue-900 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <span className="font-bold">{selectedIds.size}</span>
            <span>{selectedIds.size === 1 ? 'muestra seleccionada' : 'muestras seleccionadas'}</span>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="font-bold text-blue-700 hover:text-blue-900 underline"
          >
            Deseleccionar todo
          </button>
        </div>
      )}

      {/* Main Records Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No hay muestras para este filtro</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Inicia los cronómetros en la pestaña principal para registrar tiempos de cola y atención.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors flex items-center justify-center mx-auto"
                      title={allFilteredSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    >
                      {allFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : someFilteredSelected ? (
                        <MinusSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-3">#</th>
                  <th className="py-3.5 px-4">Fecha y Hora</th>
                  <th className="py-3.5 px-4">Cola</th>
                  <th className="py-3.5 px-4">Servidor</th>
                  <th className="py-3.5 px-4">Tipo de Trámite</th>
                  <th className="py-3.5 px-3 text-right">Cola (Wq)</th>
                  <th className="py-3.5 px-3 text-right">Atención (Ws)</th>
                  <th className="py-3.5 px-4 text-right">Total (W)</th>
                  <th className="py-3.5 px-4">Operador</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 text-xs sm:text-sm">
                {filteredRecords.map((record, index) => {
                  const isSelected = selectedIds.has(record.id);
                  const isTotem = record.queueType === 'totem' || record.systemName.toLowerCase().includes('totem');
                  const isAdquisicion = record.operationType === 'adquisicion';
                  const wq = record.queueWaitTimeSeconds ?? 0;
                  const ws = record.serviceTimeSeconds ?? record.totalSystemTimeSeconds;
                  const wTotal = record.totalSystemTimeSeconds;

                  return (
                    <tr
                      key={record.id}
                      className={`transition-colors group ${
                        isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRow(record.id)}
                          className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors flex items-center justify-center mx-auto"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3 font-mono text-xs text-slate-400 font-bold">
                        {filteredRecords.length - index}
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {formatDateTime(record.timestamp)}
                      </td>

                      {/* Cola */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isTotem ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200">
                            <Monitor className="w-3 h-3" />
                            <span>Cola Tótem</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                            <Ticket className="w-3 h-3" />
                            <span>Cola Cajero</span>
                          </span>
                        )}
                      </td>

                      {/* Servidor */}
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-xs text-slate-800">
                        {record.serverName || (isTotem ? 'Tótem Autoservicio' : 'Cajero 1')}
                      </td>

                      {/* Trámite */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isAdquisicion ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300">
                            <span>💳</span>
                            <span>Compra</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 font-semibold text-xs border border-amber-200">
                            <span>📱</span>
                            <span>Retiro Web</span>
                          </span>
                        )}
                      </td>

                      {/* Wq: Tiempo en cola */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-xs text-slate-600">
                        {wq > 0 ? `${wq.toFixed(2)}s` : <span className="text-slate-300 italic">0s (directo)</span>}
                      </td>

                      {/* Ws: Tiempo de atención */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-xs font-bold text-slate-900">
                        {ws.toFixed(2)}s
                      </td>

                      {/* W: Tiempo total en sistema */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-mono-numbers font-black text-indigo-700 text-xs sm:text-sm">
                          {wTotal.toFixed(2)}s
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">
                          ({formatDuration(wTotal)})
                        </div>
                      </td>

                      {/* Operador */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          <span>{record.userName}</span>
                        </span>
                      </td>

                      {/* Eliminar */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setIdsToDelete([record.id])}
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
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-2">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              Muestras en vista: <strong className="text-slate-800">{filteredRecords.length}</strong> de {records.length}
            </span>
          </div>
          <div className="text-slate-400">
            Wq (Espera) + Ws (Atención) = W (Tiempo en Sistema) — SimuTimer Cine
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {idsToDelete.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">
                {idsToDelete.length === 1 ? '¿Eliminar muestra?' : `¿Eliminar ${idsToDelete.length} muestras?`}
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              {idsToDelete.length === 1
                ? 'Esta acción no se puede deshacer y se removerá la muestra de la base de datos.'
                : `Se eliminarán definitivamente ${idsToDelete.length} muestras seleccionadas de la base de datos.`}
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIdsToDelete([])}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : idsToDelete.length === 1 ? 'Sí, eliminar' : `Eliminar ${idsToDelete.length}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
